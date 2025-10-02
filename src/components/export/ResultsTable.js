import React from 'react';

const DualResultsTable = ({ 
  results, 
  dualSlopeResults, 
  voltageAssignments, 
  approvalStatus, 
  manuallyAdjusted, 
  onFileSelect 
}) => {
  // Show all files immediately from dualSlopeResults
  if (!dualSlopeResults || dualSlopeResults.length === 0) {
    return (
      <div style={{ margin: '20px 0' }}>
        <h3>Voltage Assignment Results</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          No files loaded yet. Upload CSV files to begin.
        </p>
      </div>
    );
  }

  const handleRowClick = (fileName) => {
    if (onFileSelect && fileName !== 'REFERENCE') {
      onFileSelect({ fileName });
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
    
    return isManuallyAdjusted ? 'orange' : 'green';
  };

  const getRowBackgroundColor = (fileName, index) => {
    if (fileName === 'REFERENCE') {
      return '#f0f0f0';
    }

    const isApproved = approvalStatus && approvalStatus[fileName];
    const isManuallyAdjusted = manuallyAdjusted && manuallyAdjusted[fileName];
    
    if (isApproved && !isManuallyAdjusted) {
      return '#f0f8f0'; // Light green for approved
    } else if (isApproved && isManuallyAdjusted) {
      return '#fff8e1'; // Light yellow for manual
    }
    
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

  // Build table rows - POSITIVE VOLTAGES ONLY (with combined ramp data)
  const tableRows = [];
  
  // POSITIVE VOLTAGES - REVERSED order (newest/highest to oldest/lowest)
  [...dualSlopeResults].reverse().forEach((dualResult) => {
    const fileName = dualResult.fileName;
    const isApproved = approvalStatus && approvalStatus[fileName];
    const assignedVoltage = voltageAssignments && voltageAssignments[fileName];
    
    // Add combined row with both ramp up (positive) and ramp down (negative) data
    tableRows.push({
      key: `${fileName}-combined`,
      fileName: fileName,
      voltage: isApproved && assignedVoltage ? assignedVoltage : '-',
      rampUp: {
        velocity: isApproved ? dualResult.rampUp.velocity : '-',
        duration: isApproved ? dualResult.rampUp.duration : '-',
        startTime: isApproved ? dualResult.rampUp.startTime : '-',
        endTime: isApproved ? dualResult.rampUp.endTime : '-'
      },
      rampDown: {
        velocity: isApproved ? dualResult.rampDown.velocity : '-',
        duration: isApproved ? dualResult.rampDown.duration : '-',
        startTime: isApproved ? dualResult.rampDown.startTime : '-',
        endTime: isApproved ? dualResult.rampDown.endTime : '-'
      },
      isApproved: isApproved
    });
  });
  
  // REFERENCE ROW - at the end
  tableRows.push({
    key: 'REFERENCE',
    fileName: 'REFERENCE',
    voltage: 0,
    rampUp: {
      velocity: 0,
      duration: '-',
      startTime: '-',
      endTime: '-'
    },
    rampDown: {
      velocity: 0,
      duration: '-',
      startTime: '-',
      endTime: '-'
    },
    isApproved: true
  });

  return (
    <div style={{ margin: '20px 0' }}>
      <h3>Voltage Assignment Results</h3>
      
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
              <th style={{...headerStyle, width: '200px'}}>File Name</th>
              <th style={headerStyle}>Velocity (mm/s)</th>
              <th style={headerStyle}>Duration (s)</th>
              <th style={headerStyle}>Start Time (s)</th>
              <th style={headerStyle}>End Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => {
              const isReference = row.fileName === 'REFERENCE';
              
              return (
                <tr 
                  key={row.key}
                  style={{ 
                    backgroundColor: getRowBackgroundColor(row.fileName, index),
                    cursor: !isReference && onFileSelect ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                    fontWeight: isReference ? 'bold' : 'normal',
                    borderTop: isReference ? '2px solid #ddd' : 'none',
                    borderBottom: isReference ? '2px solid #ddd' : 'none'
                  }}
                  onClick={() => !isReference && handleRowClick(row.fileName)}
                  onMouseEnter={(e) => {
                    if (!isReference && onFileSelect) {
                      e.target.parentElement.style.backgroundColor = '#e3f2fd';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isReference && onFileSelect) {
                      e.target.parentElement.style.backgroundColor = getRowBackgroundColor(row.fileName, index);
                    }
                  }}
                >
                  {/* Status Column */}
                  <td style={{
                    ...cellStyle,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: isReference ? '#999' : getStatusColor(row.fileName)
                  }}>
                    {isReference ? (
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
                          {getStatusIcon(row.fileName)}
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          color: '#666',
                          fontWeight: 'normal'
                        }}>
                          {getStatusText(row.fileName)}
                        </span>
                      </div>
                    )}
                  </td>
                  
                  {/* Voltage Column */}
                  <td style={{
                    ...cellStyle,
                    textAlign: 'center',
                    fontWeight: isReference ? 'bold' : 'normal',
                    fontSize: isReference ? '16px' : '14px',
                    color: '#333'
                  }}>
                    {isReference ? '0.00V' : (typeof row.voltage === 'number' ? `±${row.voltage.toFixed(2)}V` : row.voltage)}
                  </td>
                  
                  {/* File Name Column */}
                  <td style={{...cellStyle, width: '200px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {isReference ? '-' : row.fileName}
                  </td>
                  
                  {/* Velocity Column - Combined */}
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {isReference ? (
                      '0.000000'
                    ) : (
                      <>
                        <span style={{ color: 'green' }}>
                          {typeof row.rampUp.velocity === 'number' ? row.rampUp.velocity.toFixed(6) : row.rampUp.velocity}
                        </span>
                        {' / '}
                        <span style={{ color: 'red' }}>
                          {typeof row.rampDown.velocity === 'number' ? (-Math.abs(row.rampDown.velocity)).toFixed(6) : row.rampDown.velocity}
                        </span>
                      </>
                    )}
                  </td>
                  
                  {/* Duration Column - Combined */}
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {isReference ? (
                      '-'
                    ) : (
                      <>
                        <span style={{ color: 'green' }}>
                          {typeof row.rampUp.duration === 'number' ? row.rampUp.duration.toFixed(3) : row.rampUp.duration}
                        </span>
                        {' / '}
                        <span style={{ color: 'red' }}>
                          {typeof row.rampDown.duration === 'number' ? row.rampDown.duration.toFixed(3) : row.rampDown.duration}
                        </span>
                      </>
                    )}
                  </td>
                  
                  {/* Start Time Column - Combined */}
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {isReference ? (
                      '-'
                    ) : (
                      <>
                        <span style={{ color: 'green' }}>
                          {typeof row.rampUp.startTime === 'number' ? row.rampUp.startTime.toFixed(3) : row.rampUp.startTime}
                        </span>
                        {' / '}
                        <span style={{ color: 'red' }}>
                          {typeof row.rampDown.startTime === 'number' ? row.rampDown.startTime.toFixed(3) : row.rampDown.startTime}
                        </span>
                      </>
                    )}
                  </td>
                  
                  {/* End Time Column - Combined */}
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {isReference ? (
                      '-'
                    ) : (
                      <>
                        <span style={{ color: 'green' }}>
                          {typeof row.rampUp.endTime === 'number' ? row.rampUp.endTime.toFixed(3) : row.rampUp.endTime}
                        </span>
                        {' / '}
                        <span style={{ color: 'red' }}>
                          {typeof row.rampDown.endTime === 'number' ? row.rampDown.endTime.toFixed(3) : row.rampDown.endTime}
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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