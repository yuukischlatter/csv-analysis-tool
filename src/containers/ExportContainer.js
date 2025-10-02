import React from 'react';
import { createUserAssignedVoltageMapping, downloadDualCSV } from '../services/voltageMapper';
import { generatePDF } from '../services/pdfGenerator';
import ApiClient from '../services/apiClient';

const ExportContainer = ({
  dualSlopeResults,
  voltageAssignments,
  testFormData,
  speedCheckResults,
  regressionData,
  processedFiles,
  approvalStatus,
  manuallyAdjusted,
  setError,
  loadedProjectId,
  loadedFolderName,
  hasChanges,
  setHasChanges
}) => {

  const handleCSVExport = () => {
    if (Object.keys(voltageAssignments).length === 0) {
      alert('No voltage assignments to export');
      return;
    }

    try {
      const mappedResults = createUserAssignedVoltageMapping(dualSlopeResults, voltageAssignments);
      downloadDualCSV(mappedResults, testFormData);
      console.log('User-assigned voltage CSV export successful');
    } catch (error) {
      console.error('CSV Export failed:', error);
      setError(`CSV Export failed: ${error.message}`);
    }
  };

  const handlePDFExport = async () => {
    if (Object.keys(voltageAssignments).length === 0) {
      alert('No voltage assignments to export');
      return;
    }

    if (!speedCheckResults) {
      alert('Speed check analysis required for PDF export');
      return;
    }

    try {
      const mappedResults = createUserAssignedVoltageMapping(dualSlopeResults, voltageAssignments);
      const pdfFilename = generatePDFFilename(testFormData);
      
      // Generate PDF (downloads to user) and get PDF data for server
      const pdfData = generatePDF({
        testFormData,
        voltageData: mappedResults,
        speedCheckResults,
        regressionData
      }, true); // Pass true to also return PDF data
      
      console.log('PDF export successful');
      
      // Save project to database with PDF data
      await saveProjectToDatabase(mappedResults, pdfData, pdfFilename);
      
    } catch (error) {
      console.error('PDF Export failed:', error);
      setError(`PDF Export failed: ${error.message}`);
    }
  };

  // Save project to SQLite database with PDF data
  const saveProjectToDatabase = async (mappedResults, pdfData, pdfFilename) => {
    try {
      // Check if API server is running
      const isConnected = await ApiClient.checkConnection();
      if (!isConnected) {
        console.warn('Database server not running. Start with: npm run server');
        return;
      }

      // Check if we should save or skip
      if (loadedProjectId && !hasChanges) {
        console.log('No changes detected, skipping database save');
        console.log('PDF generated from loaded project without saving');
        return;
      }

      // Prepare data for saving
      const projectData = {
        testFormData,
        dualSlopeResults,
        voltageAssignments,
        approvalStatus,
        manuallyAdjusted,
        regressionData,
        speedCheckResults,
        processedFiles,
        pdfFilename: pdfFilename,
        pdfData: pdfData, // PDF ArrayBuffer data
        projectId: loadedProjectId,  // Include for update
        folderName: loadedFolderName, // Include for update
        isUpdate: !!loadedProjectId  // Flag to indicate update mode
      };
      
      // Save to SQLite database via API
      const result = await ApiClient.saveProject(projectData);
      
      if (result.success) {
        const action = loadedProjectId ? 'updated' : 'created';
        console.log(`Project ${action}: ${result.folderName}`);
        
        if (result.pdfSaved) {
          console.log(`PDF copy saved to server: ${result.pdfPath}`);
        }
        
        showSaveNotification(`Project ${action} and PDF saved to server`);
        
        // Reset changes flag after successful save
        if (setHasChanges) {
          setHasChanges(false);
        }
      }
      
    } catch (error) {
      console.error('Database save failed:', error);
      console.warn('Make sure to run: npm run server (in separate terminal)');
    }
  };

  // Generate PDF filename based on form data
  const generatePDFFilename = (testFormData) => {
    if (testFormData && testFormData.auftragsNr) {
      const date = testFormData.datum || new Date().toISOString().split('T')[0];
      return `SpeedChecker_Report_${testFormData.auftragsNr}_${date}.pdf`;
    }
    return `SpeedChecker_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  };

  // Show save notification
  const showSaveNotification = (message) => {
    console.log(`Save ${message}`);
  };

  // Don't render if no voltage assignments
  if (!voltageAssignments || Object.keys(voltageAssignments).length === 0) {
    return null;
  }

  return (
    <div style={{ 
      marginTop: '30px',
      paddingTop: '20px',
      borderTop: '1px solid #ddd',
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-start',
      alignItems: 'center'
    }}>
      <button
        onClick={handleCSVExport}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          backgroundColor: '#f8f9fa',
          color: '#333'
        }}
      >
        Export CSV
      </button>

      <button
        onClick={handlePDFExport}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#0056b3';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#007bff';
        }}
      >
        Export PDF
      </button>

      {loadedProjectId && (
        <span style={{ 
          fontSize: '12px', 
          color: hasChanges ? '#ff9800' : '#666',
          marginLeft: '10px'
        }}>
          {hasChanges ? 'Changes will be saved' : 'No changes to save'}
        </span>
      )}
    </div>
  );
};

export default ExportContainer;