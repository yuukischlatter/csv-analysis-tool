import React from 'react';
import { createUserAssignedVoltageMapping, downloadDualCSV } from '../services/voltageMapper';
import { generatePDF } from '../services/pdfGenerator';
import DatabaseService from '../services/databaseService';

const ExportContainer = ({
  dualSlopeResults,
  voltageAssignments,
  testFormData,
  speedCheckResults,
  regressionData,
  processedFiles,  // Add this prop to get original data
  approvalStatus,  // Add this prop
  manuallyAdjusted, // Add this prop
  setError
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
      
      // Generate PDF
      generatePDF({
        testFormData,
        voltageData: mappedResults,
        speedCheckResults,
        regressionData
      });
      
      console.log('PDF export successful');
      
      // NEW: Save project to database after successful PDF generation
      await saveProjectSnapshot(mappedResults);
      
    } catch (error) {
      console.error('PDF Export failed:', error);
      setError(`PDF Export failed: ${error.message}`);
    }
  };

  // NEW: Save complete project snapshot to database
  const saveProjectSnapshot = async (mappedResults) => {
    try {
      // Initialize database service
      const dbService = await DatabaseService.create();
      
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
        pdfFilename: generatePDFFilename(testFormData)
      };
      
      // Save to database
      const projectId = await dbService.saveProjectSnapshot(projectData);
      
      if (projectId) {
        console.log(`✓ Project saved automatically: ${projectId}`);
        // Optional: Show user notification (non-intrusive)
        showSaveNotification('Project saved successfully');
      }
      
    } catch (error) {
      console.error('Project save failed:', error);
      // Don't show error to user - this is background functionality
      // but log it for debugging
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

  // Show non-intrusive save notification
  const showSaveNotification = (message) => {
    // Optional: Add a subtle notification
    console.log(`💾 ${message}`);
    
    // You could add a toast notification here if desired
    // For now, just console log to keep it simple
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
      justifyContent: 'flex-start'
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
    </div>
  );
};

export default ExportContainer;