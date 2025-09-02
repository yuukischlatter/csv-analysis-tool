/**
 * API Client for SpeedChecker Database Operations
 * Communicates with Express backend to save/load projects from SQLite file
 */

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  // Save project to SQLite database file
  static async saveProject(projectData) {
    try {
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