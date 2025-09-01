/**
 * Database Service for SpeedChecker
 * Browser-compatible storage using IndexedDB
 * Fallback to localStorage for simpler data
 */

// Database configuration
const DB_NAME = 'SpeedCheckerDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isSupported = this.checkSupport();
  }

  checkSupport() {
    return typeof window !== 'undefined' && 
           'indexedDB' in window && 
           'localStorage' in window;
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn('Database not supported, using memory storage');
      return false;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create projects store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Add indexes for searching
          store.createIndex('auftrag_nr', 'auftrag_nr', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
          store.createIndex('folder_name', 'folder_name', { unique: true });
          
          console.log('Database store created');
        }
      };
    });
  }

  // Save complete project after PDF generation
  async saveProjectSnapshot(projectData) {
    if (!this.db) {
      console.warn('Database not initialized, using localStorage fallback');
      return this.saveToLocalStorage(projectData);
    }

    try {
      const projectRecord = this.prepareProjectRecord(projectData);
      
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Check if project already exists (based on folder_name)
      const existingProject = await this.getProjectByFolderName(projectRecord.folder_name);
      
      if (existingProject) {
        // Update existing project
        projectRecord.id = existingProject.id;
        projectRecord.updated_at = new Date().toISOString();
        const request = store.put(projectRecord);
        
        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            console.log(`Project updated: ${projectRecord.folder_name}`);
            resolve(projectRecord.id);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        // Create new project
        const request = store.add(projectRecord);
        
        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            console.log(`Project saved: ${projectRecord.folder_name}`);
            resolve(request.result);
          };
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Database save failed:', error);
      // Fallback to localStorage
      return this.saveToLocalStorage(projectData);
    }
  }

  // Prepare project record from app data
  prepareProjectRecord(data) {
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

    // Generate folder name from form data
    const folderName = this.generateFolderName(testFormData);
    
    return {
      folder_name: folderName,
      created_at: new Date().toISOString(),
      
      // Form Data (Auftragsdaten)
      auftrag_nr: testFormData?.auftragsNr || '',
      maschinentyp: testFormData?.maschinentyp || '',
      
      // Form Data (Prüfung)
      pruefer: testFormData?.pruefer || '',
      datum: testFormData?.datum || '',
      
      // Form Data (Regelventil)
      art_nr_sch: testFormData?.artNrSCH || '',
      art_nr_parker: testFormData?.artNrParker || '',
      nenndurchfluss: testFormData?.nenndurchfluss || '',
      sn_parker: testFormData?.snParker || '',
      
      // Form Data (Prüfbedingungen)
      ventil_offset_original: parseFloat(testFormData?.ventilOffsetOriginal) || null,
      ventil_offset_korrektur: parseFloat(testFormData?.ventilOffsetKorrektur) || null,
      ventil_offset_nach_korrektur: parseFloat(testFormData?.ventilOffsetNachKorrektur) || null,
      druck_ventil: parseFloat(testFormData?.druckVentil) || null,
      oeltemperatur: parseFloat(testFormData?.oeltemperatur) || null,
      
      // Analysis Results Summary
      file_count: dualSlopeResults?.length || 0,
      pdf_filename: pdfFilename || '',
      file_analysis_state: JSON.stringify(dualSlopeResults || []),
      voltage_assignments: JSON.stringify(voltageAssignments || {}),
      regression_slope: speedCheckResults?.calculatedSlope || null,
      manual_slope_factor: speedCheckResults?.manualSlopeFactor || 1.0,
      final_slope: speedCheckResults?.manualSlope || null,
      
      // Complete App State Backup (for future restore functionality)
      complete_app_state: JSON.stringify({
        testFormData,
        dualSlopeResults,
        voltageAssignments,
        approvalStatus,
        manuallyAdjusted,
        regressionData,
        speedCheckResults,
        timestamp: new Date().toISOString()
      })
    };
  }

  // Generate unique folder name for project
  generateFolderName(testFormData) {
    const auftragsNr = testFormData?.auftragsNr || 'Unknown';
    const datum = testFormData?.datum || new Date().toISOString().split('T')[0];
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    
    // Clean filename-safe string
    const cleanAuftragsNr = auftragsNr.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    return `${cleanAuftragsNr}_${datum}_${timestamp}`;
  }

  // Get project by folder name
  async getProjectByFolderName(folderName) {
    if (!this.db) return null;

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('folder_name');
    const request = index.get(folderName);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all projects (for future project list functionality)
  async getAllProjects() {
    if (!this.db) {
      return this.getFromLocalStorage() || [];
    }

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const projects = request.result.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // localStorage fallback methods
  saveToLocalStorage(projectData) {
    try {
      const projectRecord = this.prepareProjectRecord(projectData);
      const key = `speedchecker_project_${projectRecord.folder_name}`;
      
      localStorage.setItem(key, JSON.stringify(projectRecord));
      console.log(`Project saved to localStorage: ${projectRecord.folder_name}`);
      
      // Also maintain a list of all project keys
      const projectList = JSON.parse(localStorage.getItem('speedchecker_projects') || '[]');
      if (!projectList.includes(key)) {
        projectList.push(key);
        localStorage.setItem('speedchecker_projects', JSON.stringify(projectList));
      }
      
      return projectRecord.folder_name;
    } catch (error) {
      console.error('localStorage save failed:', error);
      return null;
    }
  }

  getFromLocalStorage() {
    try {
      const projectList = JSON.parse(localStorage.getItem('speedchecker_projects') || '[]');
      const projects = [];
      
      projectList.forEach(key => {
        const projectData = localStorage.getItem(key);
        if (projectData) {
          projects.push(JSON.parse(projectData));
        }
      });
      
      return projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('localStorage read failed:', error);
      return [];
    }
  }

  // Initialize database on startup
  static async create() {
    const service = new DatabaseService();
    await service.initialize();
    return service;
  }
}

export default DatabaseService;