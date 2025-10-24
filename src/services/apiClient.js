/**
 * API Client for SpeedChecker Database Operations
 * Handles communication with Express backend
 * NEW: Loads projects from disk files instead of complete_app_state JSON blob
 *
 * Translation Layer: Frontend uses English field names, Backend uses German field names
 */

let API_BASE_URL = `http://${window.location.hostname}:8080/api`;

/**
 * Translate testFormData from English (frontend) to German (backend)
 */
const translateToGerman = (testFormData) => {
  if (!testFormData) return null;

  return {
    auftragsNr: testFormData.orderNumber,
    maschinentyp: testFormData.machineType,
    pruefer: testFormData.inspector,
    datum: testFormData.date,
    artNrSCH: testFormData.articleNumberSCH,
    artNrParker: testFormData.articleNumberParker,
    nenndurchfluss: testFormData.nominalFlow,
    snParker: testFormData.serialNumberParker,
    ventilOffsetOriginal: testFormData.valveOffsetOriginal,
    ventilOffsetKorrektur: testFormData.valveOffsetCorrection,
    ventilOffsetNachKorrektur: testFormData.valveOffsetAfterCorrection,
    druckVentil: testFormData.valvePressure,
    oeltemperatur: testFormData.oilTemperature,
    calibrationOffset: testFormData.calibrationOffset,
    calibrationMaxPosition: testFormData.calibrationMaxPosition,
    calibrationMaxVoltage: testFormData.calibrationMaxVoltage,
    geprueftAn: testFormData.testedOn,
    eingebautIn: testFormData.installedIn
  };
};

/**
 * Translate testFormData from German (backend) to English (frontend)
 */
const translateToEnglish = (testFormData) => {
  if (!testFormData) return null;

  return {
    orderNumber: testFormData.auftragsNr,
    machineType: testFormData.maschinentyp,
    inspector: testFormData.pruefer,
    date: testFormData.datum,
    articleNumberSCH: testFormData.artNrSCH,
    articleNumberParker: testFormData.artNrParker,
    nominalFlow: testFormData.nenndurchfluss,
    serialNumberParker: testFormData.snParker,
    valveOffsetOriginal: testFormData.ventilOffsetOriginal,
    valveOffsetCorrection: testFormData.ventilOffsetKorrektur,
    valveOffsetAfterCorrection: testFormData.ventilOffsetNachKorrektur,
    valvePressure: testFormData.druckVentil,
    oilTemperature: testFormData.oeltemperatur,
    calibrationOffset: testFormData.calibrationOffset,
    calibrationMaxPosition: testFormData.calibrationMaxPosition,
    calibrationMaxVoltage: testFormData.calibrationMaxVoltage,
    testedOn: testFormData.geprueftAn,
    installedIn: testFormData.eingebautIn
  };
};

// Fetch server configuration on load
(async () => {
  try {
    const response = await fetch(`http://${window.location.hostname}:8080/api/config`);
    if (response.ok) {
      const config = await response.json();
      API_BASE_URL = config.apiBaseUrl;
      console.log('API configured to use:', API_BASE_URL);
    }
  } catch (error) {
    console.log('Using default API URL:', API_BASE_URL);
  }
})();

class ApiClient {
  /**
   * NEW: Load project from disk files (FAST - no JSON parsing of processedFiles)
   * Reads CSV files and analysis from disk instead of complete_app_state blob
   * Translates German field names from backend to English for frontend
   */
  static async loadProjectFromDisk(projectId) {
    try {
      console.log(`Loading project ${projectId} from disk...`);
      const startTime = performance.now();

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/load-full`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const appState = await response.json();

      // Translate testFormData from German to English
      if (appState.testFormData) {
        appState.testFormData = translateToEnglish(appState.testFormData);
      }

      const endTime = performance.now();
      const loadTime = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`✓ Project ${projectId} loaded from disk in ${loadTime}s`);
      console.log(`  - ${appState.processedFiles?.length || 0} CSV files`);
      console.log(`  - ${appState.dualSlopeResults?.length || 0} analysis results`);

      return appState;
    } catch (error) {
      console.error('Load from disk failed:', error);
      throw new Error(`Failed to load project from disk: ${error.message}`);
    }
  }

  /**
   * Save project to SQLite database file with PDF data
   * CSV files are saved to disk, NOT in complete_app_state
   * Translates English field names from frontend to German for backend
   */
  static async saveProject(projectData) {
    try {
      // Clone projectData to avoid mutating original
      const backendData = { ...projectData };

      // Translate testFormData from English to German
      if (backendData.testFormData) {
        backendData.testFormData = translateToGerman(backendData.testFormData);
      }

      // Convert ArrayBuffer to Base64 for JSON transmission if PDF data exists
      if (backendData.pdfData && backendData.pdfData instanceof ArrayBuffer) {
        const bytes = new Uint8Array(backendData.pdfData);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        backendData.pdfDataBase64 = btoa(binary);
        delete backendData.pdfData; // Remove ArrayBuffer to avoid JSON serialization issues
      }

      // Check if this is an update
      if (backendData.projectId || backendData.folderName) {
        backendData.updateMode = true;
        console.log(`Updating project: ${backendData.folderName || backendData.projectId}`);
      } else {
        console.log('Creating new project');
      }

      const response = await fetch(`${API_BASE_URL}/projects/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Project ${result.action}: ${result.folderName} (ID: ${result.projectId})`);

      if (result.pdfSaved) {
        console.log(`PDF saved to server: ${result.pdfPath}`);
      }

      return result;
    } catch (error) {
      console.error('API save failed:', error);
      throw new Error(`Failed to save project: ${error.message}`);
    }
  }

  /**
   * Get all projects from database (metadata only)
   */
  static async getAllProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API get all projects failed:', error);
      throw new Error(`Failed to get projects: ${error.message}`);
    }
  }

  /**
   * Get specific project metadata by ID (NOT full load)
   * Use loadProjectFromDisk() for full project load
   */
  static async getProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API get project failed:', error);
      throw new Error(`Failed to get project: ${error.message}`);
    }
  }

  /**
   * Download PDF from server
   */
  static async downloadProjectPDF(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/pdf`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'report.pdf';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches) filename = matches[1];
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`Downloaded PDF: ${filename}`);
      return true;
    } catch (error) {
      console.error('API download PDF failed:', error);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  /**
   * Check if API server is running
   */
  static async checkConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default ApiClient;