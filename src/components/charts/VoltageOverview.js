import React from 'react';

const VoltageOverview = ({ availableVoltages, assignedVoltages }) => {
  // All possible voltage magnitudes in order (removed 0V)
  const ALL_VOLTAGES = [
    0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 9.0, 10.0
  ];

  const formatVoltage = (voltage) => {
    return `±${voltage}V`;
  };

  const isVoltageAssigned = (voltage) => {
    return assignedVoltages && assignedVoltages.has(voltage);
  };

  const getStatusIcon = (voltage) => {
    return isVoltageAssigned(voltage) ? '✓' : '✗';
  };

  const getStatusColor = (voltage) => {
    return isVoltageAssigned(voltage) ? '#4CAF50' : '#f44336';
  };

  const completedCount = assignedVoltages ? assignedVoltages.size : 0;
  const totalCount = ALL_VOLTAGES.length;

  return (
    <div style={{ 
      marginTop: '20px',
      marginBottom: '20px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '15px',
      backgroundColor: '#fafafa'
    }}>
      
      {/* Header */}
      <div style={{ 
        marginBottom: '15px'
      }}>
        <h4 style={{ margin: '0', fontSize: '16px', color: '#333' }}>
          Voltage Assignment Progress
        </h4>
      </div>

      {/* Two-Row Display */}
      <div style={{ 
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white',
        overflow: 'hidden'
      }}>
        
        {/* First Row: Voltages */}
        <div style={{ 
          display: 'flex',
          borderBottom: '1px solid #ccc',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#666',
            borderRight: '1px solid #ccc',
            minWidth: '80px',
            backgroundColor: '#e8e8e8'
          }}>
            Voltages:
          </div>
          {ALL_VOLTAGES.map((voltage, index) => (
            <div 
              key={voltage}
              style={{
                padding: '6px 4px',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                minWidth: '50px',
                borderRight: index < ALL_VOLTAGES.length - 1 ? '1px solid #eee' : 'none',
                color: '#333',
                backgroundColor: isVoltageAssigned(voltage) ? '#e8f5e8' : '#fff'
              }}
            >
              {formatVoltage(voltage)}
            </div>
          ))}
        </div>

        {/* Second Row: Status */}
        <div style={{ 
          display: 'flex'
        }}>
          <div style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#666',
            borderRight: '1px solid #ccc',
            minWidth: '80px',
            backgroundColor: '#e8e8e8'
          }}>
            Status:
          </div>
          {ALL_VOLTAGES.map((voltage, index) => (
            <div 
              key={voltage}
              style={{
                padding: '6px 4px',
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'center',
                minWidth: '50px',
                borderRight: index < ALL_VOLTAGES.length - 1 ? '1px solid #eee' : 'none',
                color: getStatusColor(voltage),
                backgroundColor: isVoltageAssigned(voltage) ? '#e8f5e8' : '#ffebee'
              }}
            >
              {getStatusIcon(voltage)}
            </div>
          ))}
        </div>
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#e8f5e8',
          border: '1px solid #4CAF50',
          borderRadius: '4px',
          color: '#2e7d32',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          🎉 All voltage assignments completed! Ready for export.
        </div>
      )}
    </div>
  );
};

export default VoltageOverview;