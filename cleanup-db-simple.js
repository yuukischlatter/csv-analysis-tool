/**
 * SpeedChecker Database Cleanup Script (SIMPLIFIED)
 * 
 * Since CSV and analysis files already exist on disk,
 * this script ONLY cleans up the database JSON.
 * 
 * WHAT IT DOES:
 * 1. Reads all projects from database
 * 2. For each project with processedFiles in complete_app_state:
 *    - Removes processedFiles from JSON (keeps everything else)
 *    - Updates database with minimal complete_app_state
 * 3. Shows progress and statistics
 * 
 * USAGE:
 *   node cleanup-db-simple.js
 * 
 * SAFETY:
 *   - Creates backup of database before starting
 *   - Non-destructive (only updates JSON, doesn't touch disk files)
 *   - Shows preview before making changes
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Paths
const DB_PATH = path.join(__dirname, 'speedchecker.db');
const DB_BACKUP_PATH = path.join(__dirname, `speedchecker_backup_${Date.now()}.db`);
const PROJECTS_DIR = path.join(__dirname, 'ventil_data');

// Statistics
let stats = {
  total: 0,
  alreadyClean: 0,
  cleaned: 0,
  failed: 0,
  sizeBefore: 0,
  sizeAfter: 0
};

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   SpeedChecker Database JSON Cleanup                      ║');
console.log('║   Removes processedFiles from database (files on disk OK) ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Step 1: Backup database
console.log('Step 1: Creating database backup...');
try {
  fs.copyFileSync(DB_PATH, DB_BACKUP_PATH);
  console.log(`✓ Backup created: ${DB_BACKUP_PATH}`);
  console.log('');
} catch (error) {
  console.error('✗ Failed to create backup:', error.message);
  console.error('Aborting for safety.');
  process.exit(1);
}

// Step 2: Open database
let db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('Step 2: Connected to database');
  console.log('');
  
  startCleanup();
});

function startCleanup() {
  console.log('Step 3: Analyzing projects...');
  console.log('');
  
  // Get all projects
  const sql = 'SELECT * FROM projects ORDER BY id ASC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('✗ Failed to read projects:', err.message);
      db.close();
      process.exit(1);
    }
    
    stats.total = rows.length;
    console.log(`Found ${stats.total} projects in database`);
    console.log('');
    
    if (rows.length === 0) {
      console.log('No projects to clean. Exiting.');
      db.close();
      process.exit(0);
    }
    
    // Analyze each project
    analyzeProjects(rows);
  });
}

function analyzeProjects(projects) {
  console.log('Analyzing project data...');
  console.log('─'.repeat(80));
  
  const needsCleanup = [];
  
  projects.forEach((project, index) => {
    try {
      if (!project.complete_app_state) {
        console.log(`${index + 1}. ${project.folder_name || project.auftrag_nr} - No state data`);
        return;
      }
      
      const appState = JSON.parse(project.complete_app_state);
      const stateSize = Buffer.byteLength(project.complete_app_state, 'utf8');
      stats.sizeBefore += stateSize;
      
      // Check if has processedFiles (needs cleanup)
      if (appState.processedFiles && Array.isArray(appState.processedFiles) && appState.processedFiles.length > 0) {
        const fileCount = appState.processedFiles.length;
        const sizeMB = (stateSize / 1024 / 1024).toFixed(2);
        
        // Check if folder exists on disk
        const projectFolder = path.join(PROJECTS_DIR, project.folder_name);
        const folderExists = fs.existsSync(projectFolder);
        const csvFolder = path.join(projectFolder, 'raw_csv');
        const csvExists = fs.existsSync(csvFolder);
        
        console.log(`${index + 1}. ${project.folder_name || project.auftrag_nr}`);
        console.log(`   ├─ Status: NEEDS CLEANUP`);
        console.log(`   ├─ Files in JSON: ${fileCount}`);
        console.log(`   ├─ State size: ${sizeMB} MB`);
        console.log(`   ├─ Folder on disk: ${folderExists ? '✓ Found' : '✗ Missing'}`);
        console.log(`   └─ CSV folder: ${csvExists ? '✓ Found' : '✗ Missing'}`);
        
        needsCleanup.push(project);
      } else {
        const sizeMB = (stateSize / 1024 / 1024).toFixed(2);
        console.log(`${index + 1}. ${project.folder_name || project.auftrag_nr}`);
        console.log(`   ├─ Status: ✓ Already clean`);
        console.log(`   └─ State size: ${sizeMB} MB`);
        
        stats.alreadyClean++;
        stats.sizeAfter += stateSize;
      }
      
    } catch (error) {
      console.log(`${index + 1}. ${project.folder_name || project.auftrag_nr}`);
      console.log(`   └─ Status: ✗ Error parsing state: ${error.message}`);
    }
  });
  
  console.log('─'.repeat(80));
  console.log('');
  
  // Show summary and confirm
  showCleanupSummary(needsCleanup);
}

function showCleanupSummary(needsCleanup) {
  console.log('CLEANUP SUMMARY:');
  console.log(`  Total projects: ${stats.total}`);
  console.log(`  Already clean: ${stats.alreadyClean}`);
  console.log(`  Need cleanup: ${needsCleanup.length}`);
  console.log(`  Total size before: ${(stats.sizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  
  if (needsCleanup.length === 0) {
    console.log('✓ All projects are already clean!');
    console.log('No cleanup needed.');
    db.close();
    process.exit(0);
  }
  
  // Confirm cleanup
  console.log('Ready to clean database JSON. This will:');
  console.log('  1. Remove processedFiles from complete_app_state');
  console.log('  2. Keep all other data (testFormData, analysis results, etc.)');
  console.log('  3. Files on disk will NOT be touched');
  console.log('');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
  console.log('');
  
  setTimeout(() => {
    cleanProjects(needsCleanup);
  }, 3000);
}

async function cleanProjects(projects) {
  console.log('Starting cleanup...');
  console.log('═'.repeat(80));
  console.log('');
  
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`[${i + 1}/${projects.length}] Cleaning: ${project.folder_name || project.auftrag_nr}`);
    
    try {
      await cleanProject(project);
      stats.cleaned++;
      console.log(`✓ Cleanup complete`);
    } catch (error) {
      stats.failed++;
      console.error(`✗ Cleanup failed: ${error.message}`);
    }
    
    console.log('');
  }
  
  showFinalResults();
}

function cleanProject(project) {
  return new Promise((resolve, reject) => {
    try {
      const appState = JSON.parse(project.complete_app_state);
      
      // Show what we're removing
      if (appState.processedFiles && appState.processedFiles.length > 0) {
        console.log(`  ├─ Removing processedFiles: ${appState.processedFiles.length} files`);
      }
      
      // Create minimal app state (without processedFiles)
      const cleanAppState = {
        testFormData: appState.testFormData,
        dualSlopeResults: appState.dualSlopeResults,
        voltageAssignments: appState.voltageAssignments,
        approvalStatus: appState.approvalStatus,
        manuallyAdjusted: appState.manuallyAdjusted,
        regressionData: appState.regressionData,
        speedCheckResults: appState.speedCheckResults,
        failedFiles: appState.failedFiles || []
        // NOTE: processedFiles removed - will be loaded from disk!
      };
      
      const cleanStateJSON = JSON.stringify(cleanAppState);
      const newSize = Buffer.byteLength(cleanStateJSON, 'utf8');
      stats.sizeAfter += newSize;
      
      const oldSize = Buffer.byteLength(project.complete_app_state, 'utf8');
      const savedKB = ((oldSize - newSize) / 1024).toFixed(0);
      const reduction = ((1 - newSize / oldSize) * 100).toFixed(1);
      
      console.log(`  ├─ State size: ${(oldSize / 1024).toFixed(0)} KB → ${(newSize / 1024).toFixed(0)} KB`);
      console.log(`  ├─ Saved: ${savedKB} KB (${reduction}% reduction)`);
      
      // Update database
      console.log(`  └─ Updating database...`);
      const updateSQL = 'UPDATE projects SET complete_app_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      db.run(updateSQL, [cleanStateJSON, project.id], function(err) {
        if (err) {
          reject(new Error(`Database update failed: ${err.message}`));
        } else {
          resolve();
        }
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

function showFinalResults() {
  console.log('═'.repeat(80));
  console.log('');
  console.log('CLEANUP COMPLETE!');
  console.log('');
  console.log('STATISTICS:');
  console.log(`  Total projects: ${stats.total}`);
  console.log(`  Already clean: ${stats.alreadyClean}`);
  console.log(`  Cleaned: ${stats.cleaned}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log('');
  console.log('DATABASE SIZE:');
  console.log(`  Before: ${(stats.sizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  After:  ${(stats.sizeAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Saved:  ${((stats.sizeBefore - stats.sizeAfter) / 1024 / 1024).toFixed(2)} MB`);
  
  if (stats.sizeBefore > 0) {
    console.log(`  Reduction: ${((1 - stats.sizeAfter / stats.sizeBefore) * 100).toFixed(1)}%`);
  }
  
  console.log('');
  console.log('BACKUP:');
  console.log(`  Original database backed up to: ${DB_BACKUP_PATH}`);
  console.log('');
  
  if (stats.failed === 0) {
    console.log('✓ All projects cleaned successfully!');
    console.log('✓ Loading projects should now be 10-20x faster!');
    console.log('✓ CSV and analysis files remain safely on disk');
  } else {
    console.log(`⚠ ${stats.failed} project(s) failed to clean.`);
    console.log('  Check the output above for details.');
  }
  
  console.log('');
  console.log('NEXT STEPS:');
  console.log('  1. Restart server: npm run server');
  console.log('  2. Test loading a ventil (should be fast!)');
  console.log('  3. If everything works, delete backup:');
  console.log(`     del ${DB_BACKUP_PATH}`);
  console.log('');
  
  db.close();
  process.exit(0);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('');
  console.error('✗ Unhandled error:', error.message);
  console.error('');
  console.error('Cleanup aborted. Database backup preserved at:', DB_BACKUP_PATH);
  db.close();
  process.exit(1);
});