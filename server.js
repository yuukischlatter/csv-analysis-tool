/**
 * Express Server for SpeedChecker
 * Saves raw CSV files, detailed analysis metadata, and PDF copies
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

console.log('Public folder path:', path.join(__dirname, 'public'));
console.log('Looking for logo at:', path.join(__dirname, 'public', 'assets', 'schlatter-logo.png'));

// Database setup
const DB_PATH = path.join(__dirname, 'speedchecker.db');
const PROJECTS_DIR = path.join(__dirname, 'ventil_data');

// Ensure directories exist
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Initialize SQLite database
let db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log(`✓ Connected to SQLite database: ${DB_PATH}`);
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_name TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      -- Form Data
      auftrag_nr TEXT,
      maschinentyp TEXT,
      pruefer TEXT,
      datum TEXT,
      art_nr_sch TEXT,
      art_nr_parker TEXT,
      nenndurchfluss TEXT,
      sn_parker TEXT,
      ventil_offset_original REAL,
      ventil_offset_korrektur REAL, 
      ventil_offset_nach_korrektur REAL,
      druck_ventil REAL,
      oeltemperatur REAL,
      
      -- Analysis Results
      file_count INTEGER,
      pdf_filename TEXT,
      file_analysis_state TEXT,
      voltage_assignments TEXT,
      regression_slope REAL,
      manual_slope_factor REAL,
      final_slope REAL,
      complete_app_state TEXT
    );
  `;
  
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('Table creation failed:', err.message);
    } else {
      console.log('Database table initialized');
    }
  });
}

// Save project snapshot
app.post('/api/projects/save', (req, res) => {
  try {
    const projectData = req.body;
    
    // Check if this is an update or new save
    const isUpdate = projectData.projectId || projectData.folderName || projectData.updateMode;
    const folderName = projectData.folderName || generateFolderName(projectData.testFormData);
    
    console.log(isUpdate ? `Updating project: ${folderName}` : `Creating new project: ${folderName}`);
    
    const projectFolder = path.join(PROJECTS_DIR, folderName);
    
    // Create project structure
    createProjectStructure(projectFolder);
    
    // Save all project files
    saveProjectFiles(projectFolder, projectData);
    
    // Save complete project metadata with Auftrags-Nr in filename
    const auftragsNr = projectData.testFormData?.auftragsNr || 'Unknown';
    const cleanAuftragsNr = auftragsNr.replace(/[^a-zA-Z0-9_-]/g, '_');
    const metadataPath = path.join(projectFolder, `${cleanAuftragsNr}_metadata.json`);
    
    const completeMetadata = {
      ...projectData,
      projectInfo: {
        folderName: folderName,
        savedAt: new Date().toISOString(),
        version: '1.0.1',
        isUpdate: isUpdate
      }
    };
    const metadataToSave = { ...completeMetadata };
    delete metadataToSave.pdfDataBase64;
    fs.writeFileSync(metadataPath, JSON.stringify(metadataToSave, null, 2));
    
    // Save to database
    const record = prepareProjectRecord(projectData, folderName);
    saveToDatabase(record, folderName, projectData, res, isUpdate);
    
  } catch (error) {
    console.error('Project save failed:', error.message);
    res.status(500).json({ error: 'Project save failed', details: error.message });
  }
});

// Create project folder structure
function createProjectStructure(projectFolder) {
  const folders = [
    projectFolder,
    path.join(projectFolder, 'raw_csv'),
    path.join(projectFolder, 'analysis'),
    path.join(projectFolder, 'exports')
  ];
  
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
  
  console.log(`Project structure created: ${path.basename(projectFolder)}`);
}

// Save project files
function saveProjectFiles(projectFolder, projectData) {
  const { processedFiles, dualSlopeResults, voltageAssignments, approvalStatus, manuallyAdjusted, pdfDataBase64, pdfFilename } = projectData;
  
  // Save PDF file if provided
  if (pdfDataBase64 && pdfFilename) {
    savePDFFile(projectFolder, pdfDataBase64, pdfFilename);
  }
  
  // Save CSV files and analysis metadata
  if (processedFiles && dualSlopeResults) {
    processedFiles.forEach(processedFile => {
      const fileName = processedFile.fileName;
      const dualSlope = dualSlopeResults.find(ds => ds.fileName === fileName);
      
      if (dualSlope) {
        saveRawCSVFile(projectFolder, processedFile);
        saveFileAnalysisMetadata(projectFolder, fileName, {
          dualSlope,
          voltageAssignment: voltageAssignments[fileName],
          isApproved: approvalStatus[fileName],
          isManuallyAdjusted: manuallyAdjusted[fileName],
          processedAt: new Date().toISOString()
        });
      }
    });
    
    console.log(`✓ Saved ${processedFiles.length} CSV files and analysis metadata`);
  }
}

// Save PDF file to exports folder
function savePDFFile(projectFolder, pdfDataBase64, pdfFilename) {
  try {
    const pdfBuffer = Buffer.from(pdfDataBase64, 'base64');
    const pdfPath = path.join(projectFolder, 'exports', pdfFilename);
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log(`✓ PDF saved to server: ${pdfFilename} (${Math.round(pdfBuffer.length / 1024)} KB)`);
    return pdfPath;
  } catch (error) {
    console.error(`Failed to save PDF ${pdfFilename}:`, error.message);
    return null;
  }
}

// Save raw CSV file
function saveRawCSVFile(projectFolder, processedFile) {
  const csvPath = path.join(projectFolder, 'raw_csv', processedFile.fileName);
  
  try {
    const csvLines = ['Time,Col2,Col3,Position,Col5'];
    
    processedFile.data.forEach(point => {
      const originalPosition = point.position / 1000;
      csvLines.push(`${point.time},,,,${originalPosition}`);
    });
    
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`✓ Saved raw CSV: ${processedFile.fileName}`);
  } catch (error) {
    console.error(`Failed to save raw CSV ${processedFile.fileName}:`, error.message);
  }
}

// Save detailed analysis metadata for each file
function saveFileAnalysisMetadata(projectFolder, fileName, analysisData) {
  const analysisPath = path.join(projectFolder, 'analysis', `${fileName.replace('.csv', '_analysis.json')}`);
  
  try {
    const metadata = {
      fileName: fileName,
      analysisTimestamp: analysisData.processedAt,
      detectionMethod: analysisData.dualSlope.detectionMethod,
      detectionTimestamp: new Date().toISOString(),
      
      rampUp: {
        startIndex: analysisData.dualSlope.rampUp.startIndex,
        endIndex: analysisData.dualSlope.rampUp.endIndex,
        startTime: analysisData.dualSlope.rampUp.startTime,
        endTime: analysisData.dualSlope.rampUp.endTime,
        startPosition: analysisData.dualSlope.rampUp.startPosition,
        endPosition: analysisData.dualSlope.rampUp.endPosition,
        velocity: analysisData.dualSlope.rampUp.velocity,
        duration: analysisData.dualSlope.rampUp.duration,
        markerSetAt: new Date().toISOString()
      },
      
      rampDown: {
        startIndex: analysisData.dualSlope.rampDown.startIndex,
        endIndex: analysisData.dualSlope.rampDown.endIndex,
        startTime: analysisData.dualSlope.rampDown.startTime,
        endTime: analysisData.dualSlope.rampDown.endTime,
        startPosition: analysisData.dualSlope.rampDown.startPosition,
        endPosition: analysisData.dualSlope.rampDown.endPosition,
        velocity: analysisData.dualSlope.rampDown.velocity,
        duration: analysisData.dualSlope.rampDown.duration,
        markerSetAt: new Date().toISOString()
      },
      
      voltageAssignment: analysisData.voltageAssignment || null,
      voltageAssignedAt: analysisData.voltageAssignment ? new Date().toISOString() : null,
      isApproved: analysisData.isApproved || false,
      approvedAt: analysisData.isApproved ? new Date().toISOString() : null,
      isManuallyAdjusted: analysisData.isManuallyAdjusted || false,
      manualAdjustmentAt: analysisData.isManuallyAdjusted ? new Date().toISOString() : null,
      
      analysisQuality: {
        detectionConfidence: analysisData.dualSlope.detectionMethod === 'automatic' ? 'high' : 
                           analysisData.dualSlope.detectionMethod === 'triangle_based' ? 'medium' : 'low',
        requiresReview: analysisData.dualSlope.detectionMethod === 'fallback',
        markerDistance: {
          rampUp: analysisData.dualSlope.rampUp.endIndex - analysisData.dualSlope.rampUp.startIndex,
          rampDown: analysisData.dualSlope.rampDown.endIndex - analysisData.dualSlope.rampDown.startIndex
        }
      },
      
      completeAnalysisData: analysisData.dualSlope
    };
    
    fs.writeFileSync(analysisPath, JSON.stringify(metadata, null, 2));
    console.log(`✓ Saved analysis metadata: ${fileName.replace('.csv', '_analysis.json')}`);
  } catch (error) {
    console.error(`Failed to save analysis metadata for ${fileName}:`, error.message);
  }
}

// Database operations
function saveToDatabase(record, folderName, projectData, res, isUpdate) {
  // If updating and we have a projectId, use that
  if (isUpdate && projectData.projectId) {
    // Direct update using projectId
    updateProject(record, folderName, projectData.projectId, projectData, res);
  } else {
    // Check if folder exists (for backwards compatibility)
    const selectSQL = 'SELECT id FROM projects WHERE folder_name = ?';
    db.get(selectSQL, [folderName], (err, row) => {
      if (err) {
        console.error('Database query failed:', err.message);
        return res.status(500).json({ error: 'Database query failed' });
      }
      
      if (row) {
        updateProject(record, folderName, row.id, projectData, res);
      } else {
        insertProject(record, projectData, res);
      }
    });
  }
}

function updateProject(record, folderName, projectId, projectData, res) {
  const updateSQL = `
    UPDATE projects SET 
      updated_at = CURRENT_TIMESTAMP,
      auftrag_nr = ?, maschinentyp = ?, pruefer = ?, datum = ?,
      art_nr_sch = ?, art_nr_parker = ?, nenndurchfluss = ?, sn_parker = ?,
      ventil_offset_original = ?, ventil_offset_korrektur = ?, ventil_offset_nach_korrektur = ?,
      druck_ventil = ?, oeltemperatur = ?, file_count = ?, pdf_filename = ?,
      file_analysis_state = ?, voltage_assignments = ?, regression_slope = ?,
      manual_slope_factor = ?, final_slope = ?, complete_app_state = ?
    WHERE folder_name = ?
  `;
  
  const updateParams = [
    record.auftrag_nr, record.maschinentyp, record.pruefer, record.datum,
    record.art_nr_sch, record.art_nr_parker, record.nenndurchfluss, record.sn_parker,
    record.ventil_offset_original, record.ventil_offset_korrektur, record.ventil_offset_nach_korrektur,
    record.druck_ventil, record.oeltemperatur, record.file_count, record.pdf_filename,
    record.file_analysis_state, record.voltage_assignments, record.regression_slope,
    record.manual_slope_factor, record.final_slope, record.complete_app_state,
    folderName
  ];
  
  db.run(updateSQL, updateParams, function(err) {
    if (err) {
      console.error('Database update failed:', err.message);
      return res.status(500).json({ error: 'Database update failed' });
    }
    
    console.log(`Project updated in database: ${folderName}`);
    res.json({ 
      success: true, 
      projectId: projectId, 
      folderName: folderName,
      action: 'updated',
      pdfSaved: !!projectData.pdfDataBase64,
      pdfPath: projectData.pdfDataBase64 ? `${folderName}/exports/${projectData.pdfFilename}` : null
    });
  });
}

function insertProject(record, projectData, res) {
  const insertSQL = `
    INSERT INTO projects (
      folder_name, auftrag_nr, maschinentyp, pruefer, datum,
      art_nr_sch, art_nr_parker, nenndurchfluss, sn_parker,
      ventil_offset_original, ventil_offset_korrektur, ventil_offset_nach_korrektur,
      druck_ventil, oeltemperatur, file_count, pdf_filename,
      file_analysis_state, voltage_assignments, regression_slope,
      manual_slope_factor, final_slope, complete_app_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const insertParams = [
    record.folder_name, record.auftrag_nr, record.maschinentyp, record.pruefer, record.datum,
    record.art_nr_sch, record.art_nr_parker, record.nenndurchfluss, record.sn_parker,
    record.ventil_offset_original, record.ventil_offset_korrektur, record.ventil_offset_nach_korrektur,
    record.druck_ventil, record.oeltemperatur, record.file_count, record.pdf_filename,
    record.file_analysis_state, record.voltage_assignments, record.regression_slope,
    record.manual_slope_factor, record.final_slope, record.complete_app_state
  ];
  
  db.run(insertSQL, insertParams, function(err) {
    if (err) {
      console.error('Database insert failed:', err.message);
      return res.status(500).json({ error: 'Database insert failed' });
    }
    
    console.log(`Project saved to database: ${record.folder_name} (ID: ${this.lastID})`);
    res.json({ 
      success: true, 
      projectId: this.lastID, 
      folderName: record.folder_name,
      action: 'created',
      pdfSaved: !!projectData.pdfDataBase64,
      pdfPath: projectData.pdfDataBase64 ? `${record.folder_name}/exports/${projectData.pdfFilename}` : null
    });
  });
}

// API Routes
app.get('/api/projects', (req, res) => {
  const sql = 'SELECT * FROM projects ORDER BY created_at DESC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Database query failed:', err.message);
      return res.status(500).json({ error: 'Database query failed' });
    }
    
    res.json(rows);
  });
});

app.get('/api/projects/:id', (req, res) => {
  const sql = 'SELECT * FROM projects WHERE id = ?';
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      console.error('Database query failed:', err.message);
      return res.status(500).json({ error: 'Database query failed' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(row);
  });
});

app.get('/api/projects/:id/pdf', (req, res) => {
  const sql = 'SELECT folder_name, pdf_filename FROM projects WHERE id = ?';
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      console.error('Database query failed:', err.message);
      return res.status(500).json({ error: 'Database query failed' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const pdfPath = path.join(PROJECTS_DIR, row.folder_name, 'exports', row.pdf_filename);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${row.pdf_filename}"`);
    
    const pdfStream = fs.createReadStream(pdfPath);
    pdfStream.pipe(res);
  });
});

// Helper functions
function generateFolderName(testFormData) {
  const auftragsNr = testFormData?.auftragsNr || 'Unknown';
  const datum = testFormData?.datum || new Date().toISOString().split('T')[0];
  const timestamp = Date.now().toString().slice(-6);
  
  const cleanAuftragsNr = auftragsNr.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  return `${cleanAuftragsNr}_${datum}_${timestamp}`;
}

function prepareProjectRecord(data, folderName) {
  const { 
    testFormData, 
    dualSlopeResults, 
    voltageAssignments, 
    speedCheckResults
  } = data;

  return {
    folder_name: folderName,
    auftrag_nr: testFormData?.auftragsNr || '',
    maschinentyp: testFormData?.maschinentyp || '',
    pruefer: testFormData?.pruefer || '',
    datum: testFormData?.datum || '',
    art_nr_sch: testFormData?.artNrSCH || '',
    art_nr_parker: testFormData?.artNrParker || '',
    nenndurchfluss: testFormData?.nenndurchfluss || '',
    sn_parker: testFormData?.snParker || '',
    ventil_offset_original: parseFloat(testFormData?.ventilOffsetOriginal) || null,
    ventil_offset_korrektur: parseFloat(testFormData?.ventilOffsetKorrektur) || null,
    ventil_offset_nach_korrektur: parseFloat(testFormData?.ventilOffsetNachKorrektur) || null,
    druck_ventil: parseFloat(testFormData?.druckVentil) || null,
    oeltemperatur: parseFloat(testFormData?.oeltemperatur) || null,
    file_count: dualSlopeResults?.length || 0,
    pdf_filename: data.pdfFilename || '',
    file_analysis_state: JSON.stringify(dualSlopeResults || []),
    voltage_assignments: JSON.stringify(voltageAssignments || {}),
    regression_slope: speedCheckResults?.calculatedSlope || null,
    manual_slope_factor: speedCheckResults?.manualSlopeFactor || 1.0,
    final_slope: speedCheckResults?.manualSlope || null,
    complete_app_state: JSON.stringify(data)
  };
}

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
//app.listen(PORT, () => {
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SpeedChecker server running at http://localhost:${PORT}`);
  console.log(`Database file: ${DB_PATH}`);
  console.log(`Project data: ${PROJECTS_DIR}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('✓ Database connection closed');
    }
  });
  process.exit(0);
});