import React, { useState, useEffect } from 'react';
import { performSpeedCheckAnalysis, validateSpeedCheckData } from '../../services/speedCheckService';
import { SPEED_CHECK } from '../../constants/analysis';
import SpeedCheckChart from '../charts/SpeedCheckChart';

const SpeedCheckAnalysis = ({ 
  regressionData, 
  testFormData,
  onAnalysisUpdate 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [manualSlopeFactor, setManualSlopeFactor] = useState(SPEED_CHECK.SLOPE_FACTOR_RANGE.default);
  const [directSlopeInput, setDirectSlopeInput] = useState('');
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get machine type from test form data
  const machineType = testFormData?.maschinentyp || 'GAA100';

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
        SPEED_CHECK.SLOPE_FACTOR_RANGE.min, 
        Math.min(SPEED_CHECK.SLOPE_FACTOR_RANGE.max, newFactor)
      );
      
      setManualSlopeFactor(clampedFactor);
    }
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
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #eee'
              }}>
                
                {/* Top Row: Calculated Slope (left) + Direct Slope Input (right) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '20px',
                  marginBottom: '15px'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
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
                </div>

                {/* Bottom Row: Full-width slider (left) + Small reset button (right) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto', 
                  gap: '15px',
                  alignItems: 'end'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                      Manual Slope Factor: {manualSlopeFactor.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min={SPEED_CHECK.SLOPE_FACTOR_RANGE.min}
                      max={SPEED_CHECK.SLOPE_FACTOR_RANGE.max}
                      step={SPEED_CHECK.SLOPE_FACTOR_RANGE.step}
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
                      <span>{SPEED_CHECK.SLOPE_FACTOR_RANGE.min}</span>
                      <span>{SPEED_CHECK.SLOPE_FACTOR_RANGE.max}</span>
                    </div>
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
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Reset to Calculated
                  </button>
                </div>
              </div>

              {/* Chart Container */}
              <div style={{ 
                width: '100%',
                overflow: 'hidden'
              }}>
                <SpeedCheckChart 
                  analysis={analysis}
                  regressionData={regressionData}
                  width={1100}
                  height={800}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeedCheckAnalysis;