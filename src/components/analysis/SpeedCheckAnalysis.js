import React, { useState, useEffect, useRef } from 'react';
import { performSpeedCheckAnalysis, validateSpeedCheckData } from '../../services/speedCheckService';
import { SPEED_CHECK } from '../../constants/analysis';
import SpeedCheckChart from '../charts/SpeedCheckChart';

const SpeedCheckAnalysis = ({ 
  regressionData, 
  testFormData,
  onAnalysisUpdate,
  initialAnalysis,
  onManualChange 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [manualSlopeFactor, setManualSlopeFactor] = useState(
    initialAnalysis?.manualSlopeFactor || SPEED_CHECK.SLOPE_FACTOR_RANGE.default
  );
  const [directSlopeInput, setDirectSlopeInput] = useState('');
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const debounceTimer = useRef(null);

  // Get machine type from test form data
  const machineType = testFormData?.maschinentyp || 'GAA100';

  // Calculate the "master" direct slope value (what the slider represents)
  const masterDirectSlopeValue = analysis ? (analysis.calculatedSlope * manualSlopeFactor).toFixed(4) : '';

  // Check if there's a pending change (text field different from slider)
  const hasPendingChange = directSlopeInput !== '' && directSlopeInput !== masterDirectSlopeValue;

  // FIXED: Initialize from saved analysis ONLY ONCE on mount
  useEffect(() => {
    if (initialAnalysis && !analysis) {
      setAnalysis(initialAnalysis);
      const factor = initialAnalysis.manualSlopeFactor || 1.0;
      setManualSlopeFactor(factor);
      setDirectSlopeInput(initialAnalysis.manualSlope?.toFixed(4) || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update text field when slider changes (slider is master)
  useEffect(() => {
    if (analysis && !hasPendingChange) {
      setDirectSlopeInput(masterDirectSlopeValue);
    }
  }, [analysis, masterDirectSlopeValue, hasPendingChange]);

  // FIXED: Perform analysis when slider factor changes
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

      // Notify parent component
      if (onAnalysisUpdate) {
        onAnalysisUpdate(newAnalysis);
      }

    } catch (err) {
      console.error('Speed check analysis error:', err);
      setError(err.message);
      setAnalysis(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regressionData, manualSlopeFactor, machineType]); // FIXED: Removed onAnalysisUpdate from deps

  const handleSliderChange = (event) => {
    const newFactor = parseFloat(event.target.value);
    setManualSlopeFactor(newFactor);

    // Slider is master - discard any pending text changes
    setDirectSlopeInput(''); // Will be updated by useEffect to match slider

    // FIXED: Debounce the parent notification
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (onManualChange) {
        onManualChange();
      }
    }, 100);
  };

  const handleDirectSlopeChange = (event) => {
    const value = event.target.value;
    setDirectSlopeInput(value);
    // Don't update slider or analysis yet - wait for apply button
  };

  const handleApplyTextValue = () => {
    if (analysis && directSlopeInput !== '' && !isNaN(parseFloat(directSlopeInput))) {
      const inputSlope = parseFloat(directSlopeInput);
      const newFactor = inputSlope / analysis.calculatedSlope;
      
      // Clamp factor to valid range
      const clampedFactor = Math.max(
        SPEED_CHECK.SLOPE_FACTOR_RANGE.min, 
        Math.min(SPEED_CHECK.SLOPE_FACTOR_RANGE.max, newFactor)
      );
      
      setManualSlopeFactor(clampedFactor);
      
      if (onManualChange) {
        onManualChange();
      }
    }
  };

  const handleResetToCalculated = () => {
    setManualSlopeFactor(1.0);
    setDirectSlopeInput(''); // Will be updated by useEffect
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

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

          {/* Chart Container - UPDATED FOR PLOTLY */}
          {analysis && (
            <div style={{ 
              width: '100%',
              height: '800px', // Fixed height for Plotly
              marginBottom: '20px'
            }}>
              <SpeedCheckChart 
                analysis={analysis}
                regressionData={regressionData}
                width={1100}
                height={800}
              />
            </div>
          )}

          {/* Controls - MOVED TO BOTTOM */}
          {analysis && (
            <div style={{ 
              padding: '15px',
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              border: '1px solid #eee'
            }}>
              
              {/* Top Row: Calculated Slope (left) + Direct Slope Input with Apply Button (right) */}
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
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      step="0.0001"
                      value={directSlopeInput}
                      onChange={handleDirectSlopeChange}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: hasPendingChange ? '2px solid #007bff' : '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        backgroundColor: hasPendingChange ? '#f0f8ff' : 'white'
                      }}
                    />
                    {hasPendingChange && (
                      <button
                        onClick={handleApplyTextValue}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '36px',
                          height: '36px'
                        }}
                        title="Apply typed value"
                      >
                        ✓
                      </button>
                    )}
                  </div>
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
          )}
        </div>
      )}
    </div>
  );
};

export default SpeedCheckAnalysis;