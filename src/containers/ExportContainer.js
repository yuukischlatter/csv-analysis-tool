import React from 'react';
import { createUserAssignedVoltageMapping, downloadDualCSV } from '../services/voltageMapper';

const ExportContainer = ({
  dualSlopeResults,
  voltageAssignments,
  testFormData,
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
    </div>
  );
};

export default ExportContainer;