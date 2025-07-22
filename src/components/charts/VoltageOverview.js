import React from 'react';
import { AVAILABLE_VOLTAGES, formatVoltageMagnitude } from '../../constants/voltages';

const VoltageOverview = ({ assignedVoltages }) => {
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
  const totalCount = AVAILABLE_VOLTAGES.length;

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
          {AVAILABLE_VOLTAGES.map((voltage, index) => (
            <div 
              key={voltage}
              style={{
                padding: '6px 4px',
                fontSize: '11px',
                fontWeight: 'bold',
                textAlign: 'center',
                minWidth: '50px',
                borderRight: index < AVAILABLE_VOLTAGES.length - 1 ? '1px solid #eee' : 'none',
                color: '#333',
                backgroundColor: isVoltageAssigned(voltage) ? '#e8f5e8' : '#fff'
              }}
            >
              {formatVoltageMagnitude(voltage)}
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
          {AVAILABLE_VOLTAGES.map((voltage, index) => (
            <div 
              key={voltage}
              style={{
                padding: '6px 4px',
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'center',
                minWidth: '50px',
                borderRight: index < AVAILABLE_VOLTAGES.length - 1 ? '1px solid #eee' : 'none',
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