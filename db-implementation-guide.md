# SpeedChecker Database Save Implementation Guide

## Overview
This document outlines the complete database saving functionality that needs to be implemented for the SpeedChecker application. The system should invisibly save complete project snapshots after successful PDF generation.

## Architecture Requirements

### Storage Location
```
~/Documents/SpeedChecker/
├── projects.db                    # SQLite database
└── project_data/
    └── {PROJECT_FOLDER}/
        ├── raw_csv/               # Original uploaded CSV files
        ├── exports/               # Generated PDF files  
        └── project_metadata.json # Complete project backup
```

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_name TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
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
```

## Data Flow

### 1. Trigger Point
- **When:** After successful PDF generation in `ExportContainer.js`
- **Function:** `handlePDFExport()` calls `saveProjectSnapshot()`
- **Location:** `src/containers/ExportContainer.js` line ~75

### 2. Input Data Structure
The save function receives this data:

```javascript
const saveData = {
  // Form data from TestDataForm
  testFormData: {
    auftragsNr: string,
    maschinentyp: string,
    pruefer: string,
    datum: string,              // YYYY-MM-DD format
    datumFormatted: string,     // DD.MM.YYYY format for PDF
    artNrSCH: string,
    artNrParker: string,
    nenndurchfluss: string,
    snParker: string,
    ventilOffsetOriginal: number,
    ventilOffsetKorrektur: number,
    ventilOffsetNachKorrektur: number,
    druckVentil: number,
    oeltemperatur: number
  },
  
  // Original uploaded File objects
  originalFiles: [File, File, ...],
  
  // Processed CSV data
  processedFiles: [{
    fileName: string,
    data: [
      { Time: number, Position: number, Voltage: number },
      ...
    ]
  }],
  
  // Analysis results with exact marker positions
  dualSlopeResults: [{
    fileName: string,
    detectionMethod: 'automatic' | 'fallback' | 'manual',
    rampUp: {
      startIndex: number,
      endIndex: number,
      startTime: number,
      endTime: number,
      startPosition: number,
      endPosition: number,
      velocity: number,
      duration: number
    },
    rampDown: {
      startIndex: number,
      endIndex: number, 
      startTime: number,
      endTime: number,
      startPosition: number,
      endPosition: number,
      velocity: number,
      duration: number
    }
  }],
  
  // User voltage assignments
  voltageAssignments: {
    "filename1.csv": 1.0,
    "filename2.csv": 2.0,
    // ...
  },
  
  // File approval status
  approvalStatus: {
    "filename1.csv": true,
    "filename2.csv": false,
    // ...
  },
  
  // Manual adjustment tracking
  manuallyAdjusted: {
    "filename1.csv": false,
    "filename2.csv": true,
    // ...
  },
  
  // Regression analysis data (approved files only)
  regressionData: [{
    voltage: number,
    velocity: number,
    fileName: string,
    rampType: 'up' | 'down'
  }],
  
  // Speed check analysis results
  speedCheckResults: {
    calculatedSlope: number,
    manualSlopeFactor: number,
    manualSlope: number,
    intercept: number
  },
  
  // Generated PDF (as buffer)
  pdfBuffer: ArrayBuffer,
  pdfFilename: string
};
```
