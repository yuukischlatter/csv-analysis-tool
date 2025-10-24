import React, { useState, useEffect } from 'react';
import { MACHINE_TYPE_NAMES } from '../../data/machines';
import { getVentilOptions, getParkerData } from '../../data/ventils';

const TestDataForm = ({ onFormDataChange, isCollapsed = true, onToggleCollapse, initialData, hasUploadedFiles = false }) => {
  const [formData, setFormData] = useState({
    // Order Data
    orderNumber: '',
    machineType: '',

    // Inspection
    inspector: '',
    date: '',

    // Control Valve
    articleNumberSCH: '',
    articleNumberParker: '',
    nominalFlow: '',
    serialNumberParker: '',

    // Test Conditions
    valveOffsetOriginal: '',
    valveOffsetCorrection: '',
    valveOffsetAfterCorrection: '',
    valvePressure: '',
    oilTemperature: '',

    // Voltage to Position Calibration
    calibrationOffset: '',
    calibrationMaxPosition: '',
    calibrationMaxVoltage: '',

    // Tested/Installed
    testedOn: '',
    installedIn: ''
  });

  // Load initial data when it changes (from loading a project)
  useEffect(() => {
    if (initialData) {
      const newFormData = {
        orderNumber: initialData.orderNumber || '',
        machineType: initialData.machineType || '',
        inspector: initialData.inspector || '',
        date: initialData.date || '',
        articleNumberSCH: initialData.articleNumberSCH || '',
        articleNumberParker: initialData.articleNumberParker || '',
        nominalFlow: initialData.nominalFlow || '',
        serialNumberParker: initialData.serialNumberParker || '',
        valveOffsetOriginal: initialData.valveOffsetOriginal || '',
        valveOffsetCorrection: initialData.valveOffsetCorrection || '',
        valveOffsetAfterCorrection: initialData.valveOffsetAfterCorrection || '',
        valvePressure: initialData.valvePressure || '',
        oilTemperature: initialData.oilTemperature || '',
        calibrationOffset: initialData.calibrationOffset || '',
        calibrationMaxPosition: initialData.calibrationMaxPosition || '',
        calibrationMaxVoltage: initialData.calibrationMaxVoltage || '',
        testedOn: initialData.testedOn || '',
        installedIn: initialData.installedIn || ''
      };
      setFormData(newFormData);

      // Call onFormDataChange when loading initial data
      if (onFormDataChange) {
        const processedFormData = { ...newFormData };
        if (newFormData.date) {
          processedFormData.dateFormatted = formatDateForPDF(newFormData.date);
        }
        onFormDataChange(processedFormData);
      }
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-mapping for Ventil selection
    if (field === 'articleNumberSCH') {
      const parkerData = getParkerData(value);
      newFormData.articleNumberParker = parkerData.parkerArtNr;
      newFormData.nominalFlow = parkerData.nenndurchfluss;
    }

    setFormData(newFormData);

    if (onFormDataChange) {
      // Format date for PDF export if it's a date field
      const processedFormData = { ...newFormData };
      if (field === 'date' && value) {
        // Keep the original ISO format for internal use, but add formatted version
        processedFormData.dateFormatted = formatDateForPDF(value);
      } else if (processedFormData.date) {
        // Ensure formatted date is always available
        processedFormData.dateFormatted = formatDateForPDF(processedFormData.date);
      }

      onFormDataChange(processedFormData);
    }
  };

  // Helper function to format date from YYYY-MM-DD to DD.MM.YYYY
  const formatDateForPDF = (isoDate) => {
    if (!isoDate) return '';
    
    try {
      const [year, month, day] = isoDate.split('-');
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.warn('Error formatting date:', error);
      return isoDate; // Return original if formatting fails
    }
  };

  const ventilOptions = getVentilOptions();

  // Count filled fields for progress indicator
  const filledFields = Object.values(formData).filter(value => value && value.toString().trim() !== '').length;
  const totalFields = Object.keys(formData).length;
  const progressPercentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div style={{ marginBottom: '30px' }}>
      {/* Collapsible Header */}
      <div 
        onClick={onToggleCollapse}
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
          <h2 style={{ margin: '0', fontSize: '18px', color: '#333' }}>
            Test Data Entry
          </h2>
          {filledFields > 0 && (
            <span style={{ 
              fontSize: '12px', 
              color: '#666',
              background: '#e9ecef',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {filledFields}/{totalFields} fields completed ({progressPercentage}%)
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isCollapsed && filledFields > 0 && (
            <span style={{ fontSize: '12px', color: '#28a745' }}>
              Data entered
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

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div style={{
          border: '1px solid #ddd',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          backgroundColor: 'white',
          padding: '20px'
        }}>
          {/* Order Data */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Order Data</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Order No.:</label>
                <input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Machine Type:</label>
                <select
                  value={formData.machineType}
                  onChange={(e) => handleInputChange('machineType', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="">Select...</option>
                  {MACHINE_TYPE_NAMES.map(typ => (
                    <option key={typ} value={typ}>{typ}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inspection */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Inspection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Inspector:</label>
                <input
                  type="text"
                  value={formData.inspector}
                  onChange={(e) => handleInputChange('inspector', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Date:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          {/* Control Valve */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Control Valve</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Art. No. S-CH:</label>
                <select
                  value={formData.articleNumberSCH}
                  onChange={(e) => handleInputChange('articleNumberSCH', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="">Select...</option>
                  {ventilOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>S/N Parker:</label>
                <input
                  type="text"
                  value={formData.serialNumberParker}
                  onChange={(e) => handleInputChange('serialNumberParker', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Art. No. Parker:</label>
                <input
                  type="text"
                  value={formData.articleNumberParker}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#f0f0f0',
                    color: '#666'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nominal Flow:</label>
                <input
                  type="text"
                  value={formData.nominalFlow}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#f0f0f0',
                    color: '#666'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Test Conditions */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Test Conditions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px'
                }}>
                  Valve Offset UEQ (with AQ60), Original State:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valveOffsetOriginal}
                    onChange={(e) => handleInputChange('valveOffsetOriginal', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                  />
                  <span style={{ fontSize: '14px' }}>V</span>
                </div>
                <small style={{ color: '#666', fontSize: '12px' }}>± 0.05V I.O.</small>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px'
                }}>
                  Valve Offset Corrections in Parker Software, if applied:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.valveOffsetCorrection}
                    onChange={(e) => handleInputChange('valveOffsetCorrection', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                  />
                  <span style={{ fontSize: '14px' }}>%</span>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px'
                }}>
                  Valve Offset UEQ (with AQ60), after corrections with Parker Software:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valveOffsetAfterCorrection}
                    onChange={(e) => handleInputChange('valveOffsetAfterCorrection', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                  />
                  <span style={{ fontSize: '14px' }}>V</span>
                </div>
                <small style={{ color: '#666', fontSize: '12px' }}>± 0.02V I.O.</small>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px'
                }}>
                  Pressure at Valve / Pump:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.valvePressure}
                    onChange={(e) => handleInputChange('valvePressure', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                  />
                  <span style={{ fontSize: '14px' }}>Bar</span>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px'
                }}>
                  Oil Temperature (before measurement):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.oilTemperature}
                    onChange={(e) => handleInputChange('oilTemperature', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                  />
                  <span style={{ fontSize: '14px' }}>°C</span>
                </div>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  50 ± 5°C I.O. (Note: Zero point can drift by 0.20% per 10°C, equivalent to 0.01V UEQ)
                </small>
              </div>
            </div>
          </div>

          {/* Voltage to Position Calibration */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
              Voltage to Position Calibration
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Position at Max Voltage:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.calibrationMaxPosition}
                    onChange={(e) => handleInputChange('calibrationMaxPosition', e.target.value)}
                    disabled={hasUploadedFiles}
                    style={{
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '150px',
                      backgroundColor: hasUploadedFiles ? '#f0f0f0' : 'white',
                      color: hasUploadedFiles ? '#666' : 'inherit',
                      cursor: hasUploadedFiles ? 'not-allowed' : 'text'
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>mm</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Max Voltage Value:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.00001"
                    value={formData.calibrationMaxVoltage}
                    onChange={(e) => handleInputChange('calibrationMaxVoltage', e.target.value)}
                    disabled={hasUploadedFiles}
                    style={{
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '150px',
                      backgroundColor: hasUploadedFiles ? '#f0f0f0' : 'white',
                      color: hasUploadedFiles ? '#666' : 'inherit',
                      cursor: hasUploadedFiles ? 'not-allowed' : 'text'
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>V</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Voltage Offset to Zero:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.calibrationOffset}
                    onChange={(e) => handleInputChange('calibrationOffset', e.target.value)}
                    disabled={hasUploadedFiles}
                    style={{
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      width: '150px',
                      backgroundColor: hasUploadedFiles ? '#f0f0f0' : 'white',
                      color: hasUploadedFiles ? '#666' : 'inherit',
                      cursor: hasUploadedFiles ? 'not-allowed' : 'text'
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>V</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tested/Installed */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Tested On:</label>
                <input
                  type="text"
                  value={formData.testedOn}
                  onChange={(e) => handleInputChange('testedOn', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Installed In:</label>
                <input
                  type="text"
                  value={formData.installedIn}
                  onChange={(e) => handleInputChange('installedIn', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDataForm;