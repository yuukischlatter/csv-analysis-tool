import React from 'react';

const ResultsTable = ({ results, approvalStatus, manuallyAdjusted, onFileSelect }) => {
  if (!results || results.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No results to display. Upload CSV files to see analysis.
      </div>
    );
  }

  // Sort results by voltage (fastest first)
  const sortedResults = [...results].sort((a, b) => b.velocity - a.velocity);

  // Assign voltages (1-24V)
  const resultsWithVoltage = sortedResults.map((result, index) => ({
    ...result,
    voltage: sortedResults.length - index // Highest velocity gets highest voltage
  }));

  const handleRowClick = (result) => {
    if (onFileSelect) {
      onFileSelect(result);
    }
  };

  const getStatusIcon = (fileName) => {
    const isApproved = approvalStatus && approvalStatus[fileName];
    return isApproved ? '✓' : '⏳';
  };

  const getStatusColor = (fileName) => {
    const isApproved = approvalStatus && approvalStatus[fileName];
    const isManuallyAdjusted = manuallyAdjusted && manuallyAdjusted[fileName];
    
    if (!isApproved) {
      return '#666'; // Gray for pending
    }
    
    // Approved files: green for auto, orange for manually adjusted
    return isManuallyAdjusted ? 'orange' : 'green';
  };

  const getRowBackgroundColor = (fileName, index) => {
    const isApproved = approvalStatus && approvalStatus[fileName];
    const isManuallyAdjusted = manuallyAdjusted && manuallyAdjusted[fileName];
    
    if (isApproved && !isManuallyAdjusted) {
      return '#f0f8f0'; // Light green for approved auto-detected
    } else if (isApproved && isManuallyAdjusted) {
      return '#fff8e1'; // Light orange for approved manually adjusted
    }
    
    return index % 2 === 0 ? '#fff' : '#f9f9f9'; // Alternating rows for pending
  };

  const getStatusText = (fileName) => {
    const isApproved = approvalStatus && approvalStatus[fileName];
    const isManuallyAdjusted = manuallyAdjusted && manuallyAdjusted[fileName];
    
    if (!isApproved) {
      return 'Pending';
    }
    
    return isManuallyAdjusted ? 'Approved (Manual)' : 'Approved (Auto)';
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <h3>Analysis Results</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
        {results.length} files analyzed, sorted by velocity (fastest = highest voltage)
      </p>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          border: '1px solid #ddd',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={headerStyle}>Status</th>
              <th style={headerStyle}>Voltage (V)</th>
              <th style={headerStyle}>File Name</th>
              <th style={headerStyle}>Velocity (mm/s)</th>
              <th style={headerStyle}>Duration (s)</th>
              <th style={headerStyle}>Start Time (s)</th>
              <th style={headerStyle}>End Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {resultsWithVoltage.map((result, index) => (
              <tr 
                key={index}
                style={{ 
                  backgroundColor: getRowBackgroundColor(result.fileName, index),
                  cursor: onFileSelect ? 'pointer' : 'default',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => handleRowClick(result)}
                onMouseEnter={(e) => {
                  if (onFileSelect) {
                    e.target.parentElement.style.backgroundColor = '#e3f2fd';
                  }
                }}
                onMouseLeave={(e) => {
                  if (onFileSelect) {
                    e.target.parentElement.style.backgroundColor = getRowBackgroundColor(result.fileName, index);
                  }
                }}
              >
                <td style={{
                  ...cellStyle,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: getStatusColor(result.fileName)
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '18px' }}>
                      {getStatusIcon(result.fileName)}
                    </span>
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#666',
                      fontWeight: 'normal'
                    }}>
                      {getStatusText(result.fileName)}
                    </span>
                  </div>
                </td>
                <td style={cellStyle}>
                  <strong>{result.voltage}V</strong>
                </td>
                <td style={cellStyle}>
                  {result.fileName}
                </td>
                <td style={cellStyle}>
                  {result.velocity.toFixed(6)}
                </td>
                <td style={cellStyle}>
                  {result.duration.toFixed(3)}
                </td>
                <td style={cellStyle}>
                  {result.startTime.toFixed(3)}
                </td>
                <td style={cellStyle}>
                  {result.endTime.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p>
          <strong>Status Legend:</strong>
        </p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', lineHeight: '1.5' }}>
          <li><span style={{ color: 'green', fontWeight: 'bold' }}>✓ Green</span> = Approved, automatically detected</li>
          <li><span style={{ color: 'orange', fontWeight: 'bold' }}>✓ Orange</span> = Approved, manually adjusted</li>
          <li><span style={{ color: '#666', fontWeight: 'bold' }}>⏳ Gray</span> = Pending review</li>
        </ul>
        <p>
          Click on a row to view the corresponding chart. 
          Velocity calculated as Δposition/Δtime for the linear section.
        </p>
      </div>
    </div>
  );
};

const headerStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
  fontWeight: 'bold'
};

const cellStyle = {
  padding: '8px',
  borderBottom: '1px solid #eee',
  textAlign: 'left'
};

export default ResultsTable;