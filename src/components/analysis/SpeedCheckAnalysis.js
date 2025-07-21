import React, { useState, useEffect } from 'react';
import { performSpeedCheckAnalysis, validateSpeedCheckData } from '../../services/speedCheckService';
import { getMachineTypes, SLOPE_FACTOR_RANGE } from '../../constants/speedCheckConstants';
import SpeedCheckChart from '../charts/SpeedCheckChart';

const SpeedCheckAnalysis = ({ 
  regressionData, 
  selectedMachineType = 'GAA100', 
  onAnalysisUpdate 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [manualSlopeFactor, setManualSlopeFactor] = useState(SLOPE_FACTOR_RANGE.default);
  const [directSlopeInput, setDirectSlopeInput] = useState('');
  const [machineType, setMachineType] = useState(selectedMachineType);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Perform analysis when inputs change
  useEffect(() => {
    if (!regressionData || regressionData.length === 0) {
      setAnalysis(null);
      setError(null);
      return;
    }

    try {
      const validation = validateSpeedCheckData(regressionData);
      if (!validation.isValid) {
        setError(validation.error);
        setAnalysis(null);
        return;
      }

      const newAnalysis = performSpeedCheckAnalysis(regressionData, manualSlopeFactor, machineType);
      setAnalysis(newAnalysis);
      setError(null);

      // Update direct slope input to match calculated value
      if (directSlopeInput === '') {
        setDirectSlopeInput(newAnalysis.manualSlope.toFixed(4));
      }

      // Notify parent component
      if (onAnalysisUpdate) {
        onAnalysisUpdate(newAnalysis);
      }

    } catch (err) {
      console.error('Speed check analysis error:', err);
      setError(err.message);
      setAnalysis(null);
    }
  }, [regressionData, manualSlopeFactor, machineType, onAnalysisUpdate]);

  // Update machine type when prop changes
  useEffect(() => {
    setMachineType(selectedMachineType);
  }, [selectedMachineType]);

  const handleSliderChange = (event) => {
    const newFactor = parseFloat(event.target.value);
    setManualSlopeFactor(newFactor);
    
    // Update direct input to match
    if (analysis) {
      const newManualSlope = analysis.calculatedSlope * newFactor;
      setDirectSlopeInput(newManualSlope.toFixed(4));
    }
  };

  const handleDirectSlopeChange = (event) => {
    const value = event.target.value;
    setDirectSlopeInput(value);
    
    // Calculate corresponding factor
    if (analysis && value !== '' && !isNaN(parseFloat(value))) {
      const inputSlope = parseFloat(value);
      const newFactor = inputSlope / analysis.calculatedSlope;
      
      // Clamp factor to valid range
      const clampedFactor = Math.max(
        SLOPE_FACTOR_RANGE.min, 
        Math.min(SLOPE_FACTOR_RANGE.max, newFactor)
      );
      
      setManualSlopeFactor(clampedFactor);
    }
  };

  const handleMachineTypeChange = (event) => {
    setMachineType(event.target.value);
  };

  const handleResetToCalculated = () => {
    setManualSlopeFactor(1.0);
    if (analysis) {
      setDirectSlopeInput(analysis.calculatedSlope.toFixed(4));
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Don't render if no regression data
  if (!regressionData || regressionData.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '30px' }}>
      {/* Header */}
      <div 
        onClick={handleToggleCollapse}
        style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px 20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: isCollapsed ? '4px' : '4px 4px 0 0',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 style={{ margin: '0', fontSize: '18px', color: '#333' }}>
            Speed Check Analysis
          </h3>
          {analysis && (
            <span style={{ 
              fontSize: '12px', 
              color: '#666',
              background: '#e9ecef',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {analysis.machineType} ({analysis.machineParams.type})
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isCollapsed && analysis && (
            <span style={{ fontSize: '12px', color: '#28a745' }}>
              Manual Slope: {analysis.manualSlope.toFixed(4)} mm/s/V
            </span>
          )}
          <span style={{ 
            fontSize: '16px',
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div style={{
          border: '1px solid #ddd',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          backgroundColor: 'white',
          padding: '20px'
        }}>
          
          {/* Error Display */}
          {error && (
            <div style={{ 
              background: '#ffebee', 
              border: '1px solid #f44336', 
              borderRadius: '4px',
              padding: '10px',
              marginBottom: '20px',
              color: '#d32f2f'
            }}>
              Speed Check Error: {error}
            </div>
          )}

          {/* Controls */}
          {analysis && (
            <>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px', 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #eee'
              }}>
                
                {/* Left Column - Machine Type & Calculated Values */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                      Machine Type:
                    </label>
                    <select
                      value={machineType}
                      onChange={handleMachineTypeChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {getMachineTypes().map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      Calculated Slope (0-4V):
                    </label>
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>
                      {analysis.calculatedSlope.toFixed(4)} mm/s per V
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      R-squared:
                    </label>
                    <div style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>
                      {analysis.rSquared.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Right Column - Manual Adjustments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                      Manual Slope Factor: {manualSlopeFactor.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min={SLOPE_FACTOR_RANGE.min}
                      max={SLOPE_FACTOR_RANGE.max}
                      step={SLOPE_FACTOR_RANGE.step}
                      value={manualSlopeFactor}
                      onChange={handleSliderChange}
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: '#ddd',
                        outline: 'none'
                      }}
                    />
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '12px', 
                      color: '#666',
                      marginTop: '5px'
                    }}>
                      <span>{SLOPE_FACTOR_RANGE.min}</span>
                      <span>{SLOPE_FACTOR_RANGE.max}</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                      Direct Slope Input (mm/s per V):
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={directSlopeInput}
                      onChange={handleDirectSlopeChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleResetToCalculated}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Reset to Calculated
                  </button>
                </div>
              </div>

              {/* Dual Chart Container - Increased height for better grid visibility */}
              <div style={{ 
                width: '100%',
                overflow: 'hidden', // Prevent horizontal scroll
                marginBottom: '20px'
              }}>
                <SpeedCheckChart 
                  analysis={analysis}
                  width={1100} // Wide enough for dual chart layout
                  height={550} // Increased height for better grid spacing
                />
              </div>

              {/* Results Summary */}
              <div style={{ 
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f0f8ff',
                borderRadius: '4px',
                border: '1px solid #b3d9ff'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                  Analysis Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '14px' }}>
                  <div>
                    <strong>Speed Limits ({machineType}):</strong><br/>
                    Lower: {analysis.machineParams.lower} mm/s<br/>
                    Middle: {analysis.machineParams.middle} mm/s<br/>
                    Upper: {analysis.machineParams.upper} mm/s
                  </div>
                  <div>
                    <strong>Regression Analysis:</strong><br/>
                    Data Points: {analysis.dataPointsUsed}<br/>
                    Voltage Range: {analysis.voltageRange[0]}-{analysis.voltageRange[1]}V<br/>
                    Manual Factor: {analysis.manualSlopeFactor.toFixed(2)}
                  </div>
                  <div>
                    <strong>Manual Slope:</strong><br/>
                    Value: {analysis.manualSlope.toFixed(4)} mm/s/V<br/>
                    vs Calculated: {((analysis.manualSlope / analysis.calculatedSlope - 1) * 100).toFixed(1)}%<br/>
                    Quality: R² = {analysis.rSquared.toFixed(4)}
                  </div>
                </div>

                {/* Deviation Summary for Critical Speeds */}
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                  <strong style={{ fontSize: '14px' }}>Critical Speed Deviations:</strong>
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    marginTop: '8px',
                    fontSize: '13px',
                    flexWrap: 'wrap'
                  }}>
                    {analysis.deviations
                      .filter(d => 
                        d.targetSpeed >= analysis.machineParams.lower && 
                        d.targetSpeed <= analysis.machineParams.upper &&
                        d.targetSpeed % 0.5 === 0 // Only show half-step increments
                      )
                      .map((deviation, index) => (
                        <div 
                          key={index}
                          style={{ 
                            padding: '4px 8px',
                            backgroundColor: Math.abs(deviation.deviation) <= 2 ? '#d4edda' : '#fff3cd',
                            borderRadius: '4px',
                            border: `1px solid ${Math.abs(deviation.deviation) <= 2 ? '#c3e6cb' : '#ffeaa7'}`
                          }}
                        >
                          <strong>{deviation.targetSpeed}mm/s:</strong> {deviation.deviation.toFixed(1)}%
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeedCheckAnalysis;