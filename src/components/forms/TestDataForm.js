import React, { useState, useEffect } from 'react';
import { MASCHINEN_TYPEN } from '../../data/machines';
import { getVentilOptions, getParkerData } from '../../data/ventils';

const TestDataForm = ({ onFormDataChange, isCollapsed = true, onToggleCollapse, initialData }) => {
  const [formData, setFormData] = useState({
    // Auftragsdaten
    auftragsNr: '',
    maschinentyp: '',
    
    // Prüfung
    pruefer: '',
    datum: '',
    
    // Regelventil
    artNrSCH: '',
    artNrParker: '',
    nenndurchfluss: '',
    snParker: '',
    
    // Prüfbedingungen
    ventilOffsetOriginal: '',
    ventilOffsetKorrektur: '',
    ventilOffsetNachKorrektur: '',
    druckVentil: '',
    oeltemperatur: '',
    
    // Voltage to Position Calibration (NEW)
    calibrationOffset: '',
    calibrationMaxPosition: '',
    calibrationMaxVoltage: ''
  });

  // Load initial data when it changes (from loading a project)
  useEffect(() => {
    if (initialData) {
      setFormData({
        auftragsNr: initialData.auftragsNr || '',
        maschinentyp: initialData.maschinentyp || '',
        pruefer: initialData.pruefer || '',
        datum: initialData.datum || '',
        artNrSCH: initialData.artNrSCH || '',
        artNrParker: initialData.artNrParker || '',
        nenndurchfluss: initialData.nenndurchfluss || '',
        snParker: initialData.snParker || '',
        ventilOffsetOriginal: initialData.ventilOffsetOriginal || '',
        ventilOffsetKorrektur: initialData.ventilOffsetKorrektur || '',
        ventilOffsetNachKorrektur: initialData.ventilOffsetNachKorrektur || '',
        druckVentil: initialData.druckVentil || '',
        oeltemperatur: initialData.oeltemperatur || '',
        // Include calibration fields when loading project
        calibrationOffset: initialData.calibrationOffset || '',
        calibrationMaxPosition: initialData.calibrationMaxPosition || '',
        calibrationMaxVoltage: initialData.calibrationMaxVoltage || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    
    // Auto-mapping for Ventil selection
    if (field === 'artNrSCH') {
      const parkerData = getParkerData(value);
      newFormData.artNrParker = parkerData.parkerArtNr;
      newFormData.nenndurchfluss = parkerData.nenndurchfluss;
    }
    
    setFormData(newFormData);
    
    if (onFormDataChange) {
      // Format date for PDF export if it's a date field
      const processedFormData = { ...newFormData };
      if (field === 'datum' && value) {
        // Keep the original ISO format for internal use, but add formatted version
        processedFormData.datumFormatted = formatDateForPDF(value);
      } else if (processedFormData.datum) {
        // Ensure formatted date is always available
        processedFormData.datumFormatted = formatDateForPDF(processedFormData.datum);
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
            Prüfdaten Eingabe
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
          {/* Auftragsdaten */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Auftragsdaten</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Auftrags-Nr.:</label>
                <input
                  type="text"
                  value={formData.auftragsNr}
                  onChange={(e) => handleInputChange('auftragsNr', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Maschinentyp:</label>
                <select
                  value={formData.maschinentyp}
                  onChange={(e) => handleInputChange('maschinentyp', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="">Auswählen...</option>
                  {MASCHINEN_TYPEN.map(typ => (
                    <option key={typ} value={typ}>{typ}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Prüfung */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Prüfung</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Prüfer:</label>
                <input
                  type="text"
                  value={formData.pruefer}
                  onChange={(e) => handleInputChange('pruefer', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Datum:</label>
                <input
                  type="date"
                  value={formData.datum}
                  onChange={(e) => handleInputChange('datum', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          {/* Regelventil */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Regelventil</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Art.-Nr. S-CH:</label>
                <select
                  value={formData.artNrSCH}
                  onChange={(e) => handleInputChange('artNrSCH', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="">Auswählen...</option>
                  {ventilOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>S/N Parker:</label>
                <input
                  type="text"
                  value={formData.snParker}
                  onChange={(e) => handleInputChange('snParker', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Art.-Nr. Parker:</label>
                <input
                  type="text"
                  value={formData.artNrParker}
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
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Nenndurchfluss:</label>
                <input
                  type="text"
                  value={formData.nenndurchfluss}
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

          {/* Prüfbedingungen */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#fafafa'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Prüfbedingungen</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '14px' 
                }}>
                  Ventil-Offset UEQ (mit AQ60), Originalzustand:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ventilOffsetOriginal}
                    onChange={(e) => handleInputChange('ventilOffsetOriginal', e.target.value)}
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
                  Ventil-Offset Korrekturen in Parker-Software, falls angewendet:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ventilOffsetKorrektur}
                    onChange={(e) => handleInputChange('ventilOffsetKorrektur', e.target.value)}
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
                  Ventil-Offset UEQ (mit AQ60), nach allfälliger Korrektur mit Parker-Software:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ventilOffsetNachKorrektur}
                    onChange={(e) => handleInputChange('ventilOffsetNachKorrektur', e.target.value)}
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
                  Druck am Ventil / an der Pumpe:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.druckVentil}
                    onChange={(e) => handleInputChange('druckVentil', e.target.value)}
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
                  Öltemperatur (vor Start der Messung):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.oeltemperatur}
                    onChange={(e) => handleInputChange('oeltemperatur', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '150px' }}
                  />
                  <span style={{ fontSize: '14px' }}>°C</span>
                </div>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  50 ± 5°C I.O. (Hinweis: Nullpunkt kann um 10°C zu 0.20% driften, entspricht zu 0.01V UEQ)
                </small>
              </div>
            </div>
          </div>

          {/* Voltage to Position Calibration - UPDATED */}
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            padding: '15px', 
            marginBottom: '15px',
            backgroundColor: '#fafafa'  // Same as others
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
              Voltage to Position Calibration
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              {/* Reordered: Position at Max first */}
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
                    style={{ 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px', 
                      width: '150px' 
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>mm</span>
                </div>
              </div>

              {/* Max Voltage second */}
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
                    style={{ 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px', 
                      width: '150px' 
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>V</span>
                </div>
              </div>

              {/* Voltage Offset last */}
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
                    style={{ 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px', 
                      width: '150px' 
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>V</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDataForm;