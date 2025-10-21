/**
 * API Client for SpeedChecker Database Operations
 * Handles communication with Express backend
 * NEW: Loads projects from disk files instead of complete_app_state JSON blob
 */

let API_BASE_URL = `http://${window.location.hostname}:8080/api`;

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
   */
  static async saveProject(projectData) {
    try {
      // Convert ArrayBuffer to Base64 for JSON transmission if PDF data exists
      if (projectData.pdfData && projectData.pdfData instanceof ArrayBuffer) {
        const bytes = new Uint8Array(projectData.pdfData);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        projectData.pdfDataBase64 = btoa(binary);
        delete projectData.pdfData; // Remove ArrayBuffer to avoid JSON serialization issues
      }

      // Check if this is an update
      if (projectData.projectId || projectData.folderName) {
        projectData.updateMode = true;
        console.log(`Updating project: ${projectData.folderName || projectData.projectId}`);
      } else {
        console.log('Creating new project');
      }

      const response = await fetch(`${API_BASE_URL}/projects/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
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