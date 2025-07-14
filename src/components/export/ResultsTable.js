import React from 'react';

const DualResultsTable = ({ results, approvalStatus, manuallyAdjusted, onFileSelect }) => {
  if (!results || results.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No results to display. Upload CSV files to see analysis.
      </div>
    );
  }

  const handleRowClick = (result) => {
    if (onFileSelect && result.rampType !== 'reference') {
      // Find the original dual result for this file
      const fileName = result.fileName;
      onFileSelect({ fileName }); // Pass fileName to load the dual chart
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

  const getRowBackgroundColor = (result, index) => {
    if (result.rampType === 'reference') {
      return '#f0f0f0'; // Light gray for reference row
    }

    const fileName = result.fileName;
    const isApproved = approvalStatus && approvalStatus[fileName];
    const isManuallyAdjusted = manuallyAdjusted && manuallyAdjusted[fileName];
    
    if (isApproved && !isManuallyAdjusted) {
      return result.rampType === 'up' ? '#f0f8f0' : '#fff0f0'; // Light green for up, light red for down
    } else if (isApproved && isManuallyAdjusted) {
      return '#fff8e1'; // Light orange for approved manually adjusted
    }
    
    // Alternating rows for pending
    return index % 2 === 0 ? '#fff' : '#f9f9f9';
  };

  const getStatusText = (fileName) => {
    if (!fileName || fileName === 'REFERENCE') return '';
    
    const isApproved = approvalStatus && approvalStatus[fileName];
    const isManuallyAdjusted = manuallyAdjusted && manuallyAdjusted[fileName];
    
    if (!isApproved) {
      return 'Pending';
    }
    
    return isManuallyAdjusted ? 'Approved (Manual)' : 'Approved (Auto)';
  };

  const getRampIcon = (rampType) => {
    if (rampType === 'up') return '↗️';
    if (rampType === 'down') return '↘️';
    return '⚪'; // Reference
  };

  const getRampLabel = (rampType) => {
    if (rampType === 'up') return 'Ramp Up';
    if (rampType === 'down') return 'Ramp Down';
    return 'Reference';
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <h3>Bidirectional Analysis Results</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
        {Math.floor(results.filter(r => r.rampType !== 'reference').length / 2)} CSV files analyzed, 
        sorted by voltage (-10V to +10V, 0V reference in center)
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
              <th style={headerStyle}>Eingangsspannung UE (V)</th>
              <th style={headerStyle}>Ramp</th>
              <th style={headerStyle}>File Name</th>
              <th style={headerStyle}>Velocity (mm/s)</th>
              <th style={headerStyle}>Duration (s)</th>
              <th style={headerStyle}>Start Time (s)</th>
              <th style={headerStyle}>End Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr 
                key={`${result.fileName}-${result.rampType}-${index}`}
                style={{ 
                  backgroundColor: getRowBackgroundColor(result, index),
                  cursor: result.rampType !== 'reference' && onFileSelect ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                  fontWeight: result.rampType === 'reference' ? 'bold' : 'normal',
                  borderTop: result.rampType === 'reference' ? '2px solid #ddd' : 'none',
                  borderBottom: result.rampType === 'reference' ? '2px solid #ddd' : 'none'
                }}
                onClick={() => handleRowClick(result)}
                onMouseEnter={(e) => {
                  if (result.rampType !== 'reference' && onFileSelect) {
                    e.target.parentElement.style.backgroundColor = '#e3f2fd';
                  }
                }}
                onMouseLeave={(e) => {
                  if (result.rampType !== 'reference' && onFileSelect) {
                    e.target.parentElement.style.backgroundColor = getRowBackgroundColor(result, index);
                  }
                }}
              >
                <td style={{
                  ...cellStyle,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: result.rampType === 'reference' ? '#999' : getStatusColor(result.fileName)
                }}>
                  {result.rampType === 'reference' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '18px' }}>⚪</span>
                      <span style={{ 
                        fontSize: '10px', 
                        color: '#666',
                        fontWeight: 'normal'
                      }}>
                        Reference
                      </span>
                    </div>
                  ) : (
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
                  )}
                </td>
                
                <td style={{
                  ...cellStyle,
                  textAlign: 'center',
                  fontWeight: result.rampType === 'reference' ? 'bold' : 'normal',
                  fontSize: result.rampType === 'reference' ? '16px' : '14px',
                  color: result.voltage > 0 ? 'green' : result.voltage < 0 ? 'red' : '#333'
                }}>
                  {result.voltage === 0 ? '0.00' : result.voltage.toFixed(2)}V
                </td>
                
                <td style={{
                  ...cellStyle,
                  textAlign: 'center',
                  color: result.rampType === 'up' ? 'green' : result.rampType === 'down' ? 'red' : '#666'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '16px' }}>{getRampIcon(result.rampType)}</span>
                    <span style={{ fontSize: '12px' }}>{getRampLabel(result.rampType)}</span>
                  </div>
                </td>
                
                <td style={cellStyle}>
                  {result.rampType === 'reference' ? '-' : result.fileName}
                </td>
                
                <td style={{
                  ...cellStyle,
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}>
                  {result.rampType === 'reference' ? '0.000000' : result.velocity.toFixed(6)}
                </td>
                
                <td style={{
                  ...cellStyle,
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}>
                  {result.rampType === 'reference' ? '-' : result.duration.toFixed(3)}
                </td>
                
                <td style={{
                  ...cellStyle,
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}>
                  {result.rampType === 'reference' ? '-' : result.startTime.toFixed(3)}
                </td>
                
                <td style={{
                  ...cellStyle,
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}>
                  {result.rampType === 'reference' ? '-' : result.endTime.toFixed(3)}
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
          <strong>Ramp Types:</strong>
        </p>
        <ul style={{ margin: '5px 0', paddingLeft: '20px', lineHeight: '1.5' }}>
          <li><span style={{ color: 'green', fontWeight: 'bold' }}>↗️ Ramp Up</span> = Positive voltage, upward movement</li>
          <li><span style={{ color: 'red', fontWeight: 'bold' }}>↘️ Ramp Down</span> = Negative voltage, downward movement</li>
          <li><span style={{ color: '#666', fontWeight: 'bold' }}>⚪ Reference</span> = 0V baseline (0 mm/s)</li>
        </ul>
        <p>
          Click on a row to view the corresponding dual-ramp chart. 
          Each CSV file contains both ramp up and ramp down measurements.
          Approval applies to both ramps of the same file simultaneously.
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

export default DualResultsTable;