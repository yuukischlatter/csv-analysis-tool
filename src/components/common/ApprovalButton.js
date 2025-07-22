import React, { useState, useEffect } from 'react';
import { formatVoltageMagnitude } from '../../constants/voltages';

const ApprovalButton = ({ 
  fileName, 
  isApproved, 
  onApproveWithVoltage, 
  availableVoltages, 
  assignedVoltage 
}) => {
  const [selectedVoltage, setSelectedVoltage] = useState('');

  // Auto-select lowest available voltage
  useEffect(() => {
    if (availableVoltages.length > 0 && selectedVoltage === '' && !isApproved) {
      const lowestVoltage = Math.min(...availableVoltages);
      setSelectedVoltage(lowestVoltage);
    }
  }, [availableVoltages, selectedVoltage, isApproved]);

  // Auto-select lowest available voltage when available voltages change
  useEffect(() => {
    if (availableVoltages.length > 0 && selectedVoltage === '' && !isApproved) {
      const lowestVoltage = Math.min(...availableVoltages);
      setSelectedVoltage(lowestVoltage);
      console.log(`🎯 Auto-selected lowest voltage: ±${lowestVoltage}V for ${fileName}`);
    }
  }, [availableVoltages, selectedVoltage, isApproved, fileName]);

  const handleVoltageChange = (event) => {
    setSelectedVoltage(parseFloat(event.target.value));
  };

  const handleApprove = () => {
    if (selectedVoltage !== '' && onApproveWithVoltage) {
      onApproveWithVoltage(fileName, selectedVoltage);
      setSelectedVoltage(''); // Reset for next file
    }
  };

  const canApprove = !isApproved && selectedVoltage !== '';

  return (
    <div style={{ 
      marginTop: '15px', 
      paddingTop: '15px', 
      borderTop: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      
      {/* Status and Instructions */}
      <div style={{ fontSize: '14px', color: '#666' }}>
        {isApproved ? (
          <span style={{ color: 'green', fontWeight: 'bold' }}>
            ✓ This file has been approved for {formatVoltageMagnitude(assignedVoltage)}
          </span>
        ) : (
          <span>
            Review the chart, select the voltage this measurement represents, then click "Approve"
          </span>
        )}
      </div>

      {/* Voltage Selection and Approval */}
      {!isApproved && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          
          {/* Voltage Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#333',
              minWidth: 'max-content'
            }}>
              Voltage Tested:
            </label>
            <select
              value={selectedVoltage}
              onChange={handleVoltageChange}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '120px',
                color: selectedVoltage === '' ? '#999' : '#333'
              }}
            >
              <option value="" disabled>
                Select voltage...
              </option>
              {availableVoltages.map(voltage => (
                <option key={voltage} value={voltage}>
                  {formatVoltageMagnitude(voltage)}
                </option>
              ))}
            </select>
          </div>

          {/* Approve Button */}
          <button
            onClick={handleApprove}
            disabled={!canApprove}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              cursor: canApprove ? 'pointer' : 'not-allowed',
              backgroundColor: canApprove ? '#4CAF50' : '#e0e0e0',
              color: canApprove ? 'white' : '#999',
              transition: 'all 0.2s ease',
              opacity: canApprove ? 1 : 0.6,
              minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              if (canApprove) {
                e.target.style.backgroundColor = '#45a049';
              }
            }}
            onMouseLeave={(e) => {
              if (canApprove) {
                e.target.style.backgroundColor = '#4CAF50';
              }
            }}
          >
            {canApprove ? 'Approve' : 'Select Voltage'}
          </button>
        </div>
      )}

      {/* No Available Voltages Warning */}
      {!isApproved && availableVoltages.length === 0 && (
        <div style={{ 
          fontSize: '12px', 
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #f44336'
        }}>
          <strong>⚠️ No voltages available</strong>
          <br />
          All voltage assignments have been used. Unapprove other files to free up voltages.
        </div>
      )}
    </div>
  );
};

export default ApprovalButton;