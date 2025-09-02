/**
 * Express Server for SpeedChecker
 * Handles SQLite database file operations in root directory
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001; // Different port from live-server

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Database setup
const DB_PATH = path.join(__dirname, 'speedchecker.db');
const PROJECTS_DIR = path.join(__dirname, 'project_data');

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
      
      -- Form Data (Auftragsdaten)
      auftrag_nr TEXT,
      maschinentyp TEXT,
      
      -- Form Data (Prüfung)  
      pruefer TEXT,
      datum TEXT,
      
      -- Form Data (Regelventil)
      art_nr_sch TEXT,
      art_nr_parker TEXT,
      nenndurchfluss TEXT,
      sn_parker TEXT,
      
      -- Form Data (Prüfbedingungen)
      ventil_offset_original REAL,
      ventil_offset_korrektur REAL, 
      ventil_offset_nach_korrektur REAL,
      druck_ventil REAL,
      oeltemperatur REAL,
      
      -- Analysis Results Summary
      file_count INTEGER,
      pdf_filename TEXT,
      file_analysis_state TEXT,        -- JSON: detailed marker positions
      voltage_assignments TEXT,        -- JSON: file->voltage mappings
      regression_slope REAL,
      manual_slope_factor REAL,
      final_slope REAL,
      
      -- Complete App State Backup
      complete_app_state TEXT          -- JSON: everything for restore
    );
  `;
  
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('Table creation failed:', err.message);
    } else {
      console.log('✓ Database table initialized');
    }
  });
}

// API Routes

// Save project snapshot
app.post('/api/projects/save', (req, res) => {
  try {
    const projectData = req.body;
    
    // Generate folder name
    const folderName = generateFolderName(projectData.testFormData);
    const projectFolder = path.join(PROJECTS_DIR, folderName);
    
    // Create project folder
    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }
    
    // Save complete project metadata as JSON backup
    const metadataPath = path.join(projectFolder, 'project_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(projectData, null, 2));
    
    // Prepare database record
    const record = prepareProjectRecord(projectData, folderName);
    
    // Check if project exists
    const selectSQL = 'SELECT id FROM projects WHERE folder_name = ?';
    db.get(selectSQL, [folderName], (err, row) => {
      if (err) {
        console.error('Database query failed:', err.message);
        return res.status(500).json({ error: 'Database query failed' });
      }
      
      if (row) {
        // Update existing project
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
          
          console.log(`✓ Project updated: ${folderName}`);
          res.json({ 
            success: true, 
            projectId: row.id, 
            folderName: folderName,
            action: 'updated'
          });
        });
        
      } else {
        // Insert new project
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
          folderName, record.auftrag_nr, record.maschinentyp, record.pruefer, record.datum,
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
          
          console.log(`✓ Project saved: ${folderName} (ID: ${this.lastID})`);
          res.json({ 
            success: true, 
            projectId: this.lastID, 
            folderName: folderName,
            action: 'created'
          });
        });
      }
    });
    
  } catch (error) {
    console.error('Project save failed:', error.message);
    res.status(500).json({ error: 'Project save failed', details: error.message });
  }
});

// Get all projects
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

// Get project by ID
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
    approvalStatus,
    manuallyAdjusted,
    regressionData,
    speedCheckResults,
    pdfFilename 
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
    pdf_filename: pdfFilename || '',
    file_analysis_state: JSON.stringify(dualSlopeResults || []),
    voltage_assignments: JSON.stringify(voltageAssignments || {}),
    regression_slope: speedCheckResults?.calculatedSlope || null,
    manual_slope_factor: speedCheckResults?.manualSlopeFactor || 1.0,
    final_slope: speedCheckResults?.manualSlope || null,
    complete_app_state: JSON.stringify(data)
  };
}

// Catch all handler: serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SpeedChecker server running at http://localhost:${PORT}`);
  console.log(`📊 Database file: ${DB_PATH}`);
  console.log(`📁 Project data: ${PROJECTS_DIR}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('✓ Database connection closed');
    }
  });
  process.exit(0);
});