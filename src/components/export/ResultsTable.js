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

  const getRowBackgroundColor = (fileName, rampType, index) => {
    if (fileName === 'REFERENCE') {
      return '#f0f0f0';
    }

    const isApproved = approvalStatus && approvalStatus[fileName];
    const isManuallyAdjusted = manuallyAdjusted && manuallyAdjusted[fileName];
    
    if (isApproved && !isManuallyAdjusted) {
      return rampType === 'up' ? '#f0f8f0' : '#fff0f0';
    } else if (isApproved && isManuallyAdjusted) {
      return '#fff8e1';
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

  // Build table rows maintaining CHRONOLOGICAL ORDER
  const tableRows = [];
  
  // POSITIVE VOLTAGES - REVERSED order (newest to oldest)
  [...dualSlopeResults].reverse().forEach((dualResult) => {
    const fileName = dualResult.fileName;
    const isApproved = approvalStatus && approvalStatus[fileName];
    const assignedVoltage = voltageAssignments && voltageAssignments[fileName];
    
    // Add ramp up row (positive voltage)
    tableRows.push({
      key: `${fileName}-up`,
      fileName: fileName,
      voltage: isApproved && assignedVoltage ? assignedVoltage : '-',
      velocity: isApproved ? dualResult.rampUp.velocity : '-',
      rampType: 'up',
      duration: isApproved ? dualResult.rampUp.duration : '-',
      startTime: isApproved ? dualResult.rampUp.startTime : '-',
      endTime: isApproved ? dualResult.rampUp.endTime : '-',
      isApproved: isApproved
    });
  });
  
  // REFERENCE ROW - in the middle
  tableRows.push({
    key: 'REFERENCE',
    fileName: 'REFERENCE',
    voltage: 0,
    velocity: 0,
    rampType: 'reference',
    duration: '-',
    startTime: '-',
    endTime: '-',
    isApproved: true
  });
  
  // NEGATIVE VOLTAGES - normal order (oldest to newest)
  dualSlopeResults.forEach((dualResult) => {
    const fileName = dualResult.fileName;
    const isApproved = approvalStatus && approvalStatus[fileName];
    const assignedVoltage = voltageAssignments && voltageAssignments[fileName];
    
    // Add ramp down row (negative voltage)
    tableRows.push({
      key: `${fileName}-down`,
      fileName: fileName,
      voltage: isApproved && assignedVoltage ? -assignedVoltage : '-',
      velocity: isApproved ? -Math.abs(dualResult.rampDown.velocity) : '-',
      rampType: 'down',
      duration: isApproved ? dualResult.rampDown.duration : '-',
      startTime: isApproved ? dualResult.rampDown.startTime : '-',
      endTime: isApproved ? dualResult.rampDown.endTime : '-',
      isApproved: isApproved
    });
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
              <th style={headerStyle}>File Name</th>
              <th style={headerStyle}>Velocity (mm/s)</th>
              <th style={headerStyle}>Duration (s)</th>
              <th style={headerStyle}>Start Time (s)</th>
              <th style={headerStyle}>End Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => {
              const isReference = row.fileName === 'REFERENCE';
              const showFileName = isReference || row.rampType === 'up';
              const showStatus = isReference || row.rampType === 'up';
              
              return (
                <tr 
                  key={row.key}
                  style={{ 
                    backgroundColor: getRowBackgroundColor(row.fileName, row.rampType, index),
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
                      e.target.parentElement.style.backgroundColor = getRowBackgroundColor(row.fileName, row.rampType, index);
                    }
                  }}
                >
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
                    ) : showStatus ? (
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
                    ) : null}
                  </td>
                  
                  <td style={{
                    ...cellStyle,
                    textAlign: 'center',
                    fontWeight: isReference ? 'bold' : 'normal',
                    fontSize: isReference ? '16px' : '14px',
                    color: typeof row.voltage === 'number' ? 
                      (row.voltage > 0 ? 'green' : row.voltage < 0 ? 'red' : '#333') : '#999'
                  }}>
                    {typeof row.voltage === 'number' ? 
                      `${row.voltage === 0 ? '0.00' : row.voltage > 0 ? '+' : ''}${row.voltage.toFixed(2)}V` : 
                      row.voltage}
                  </td>
                  
                  <td style={cellStyle}>
                    {isReference ? '-' : showFileName ? row.fileName : ''}
                  </td>
                  
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {typeof row.velocity === 'number' ? row.velocity.toFixed(6) : row.velocity}
                  </td>
                  
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {typeof row.duration === 'number' ? row.duration.toFixed(3) : row.duration}
                  </td>
                  
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {typeof row.startTime === 'number' ? row.startTime.toFixed(3) : row.startTime}
                  </td>
                  
                  <td style={{
                    ...cellStyle,
                    textAlign: 'right',
                    fontFamily: 'monospace'
                  }}>
                    {typeof row.endTime === 'number' ? row.endTime.toFixed(3) : row.endTime}
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