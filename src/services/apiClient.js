/**
 * API Client for SpeedChecker Database Operations
 * Handles communication with Express backend
 */

//const API_BASE_URL = 'http://localhost:3001/api';
//const API_BASE_URL = `http://${window.location.hostname}:3001/api`;
const API_BASE_URL = `http://${window.location.hostname}/api`;
//http://10.4.1.83:8080

class ApiClient {
  // Save project to SQLite database file with PDF data
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
      console.log(`✓ Project ${result.action}: ${result.folderName} (ID: ${result.projectId})`);
      
      if (result.pdfSaved) {
        console.log(`📄 PDF saved to server: ${result.pdfPath}`);
      }
      
      return result;
    } catch (error) {
      console.error('API save failed:', error);
      throw new Error(`Failed to save project: ${error.message}`);
    }
  }

  // Get all projects from database
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

  // Get specific project by ID
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

  // Download PDF from server
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

      console.log(`✓ Downloaded PDF: ${filename}`);
      return true;
    } catch (error) {
      console.error('API download PDF failed:', error);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  // Check if API server is running
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