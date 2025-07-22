import React from 'react';
import { createUserAssignedVoltageMapping, downloadDualCSV } from '../services/voltageMapper';
import { generatePDF } from '../services/pdfGenerator';

const ExportContainer = ({
  dualSlopeResults,
  voltageAssignments,
  testFormData,
  speedCheckResults,
  regressionData,
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

  const handlePDFExport = () => {
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
      generatePDF({
        testFormData,
        voltageData: mappedResults,
        speedCheckResults,
        regressionData
      });
      console.log('PDF export successful');
    } catch (error) {
      console.error('PDF Export failed:', error);
      setError(`PDF Export failed: ${error.message}`);
    }
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