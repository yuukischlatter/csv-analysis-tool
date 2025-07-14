import React, { useState } from 'react';
import { preparePDFData, validateForExport, preparePDFForPrint } from '../../services/pdfExportService';
import PDFExportView from './PDFExportView';

/**
 * PDFExportButton Component
 * Handles PDF export trigger, validation, and user feedback
 * Opens PDF preview in new window for printing/saving
 */
const PDFExportButton = ({ 
  testFormData, 
  voltageAssignments, 
  regressionData, 
  mappedResults,
  disabled = false,
  variant = 'primary',
  className = '',
  style = {}
}) => {
  const [exportState, setExportState] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [pdfWindow, setPdfWindow] = useState(null);

  const handleExport = async () => {
    try {
      setExportState('loading');
      setErrorMessage('');

      // Validate data before export
      const validation = validateForExport(testFormData, voltageAssignments, regressionData);
      
      if (!validation.canExport) {
        setErrorMessage(validation.message);
        setExportState('error');
        
        // Show detailed validation issues
        if (validation.issues.length > 0) {
          alert(`Cannot export PDF:\n\n${validation.issues.join('\n')}\n\nPlease complete the required data and try again.`);
        }
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        const proceed = window.confirm(
          `PDF can be exported but has some missing information:\n\n${validation.warnings.join('\n')}\n\nDo you want to continue with the export?`
        );
        
        if (!proceed) {
          setExportState('idle');
          return;
        }
      }

      // Prepare PDF data
      const pdfData = preparePDFData(testFormData, voltageAssignments, regressionData, mappedResults);
      const printData = preparePDFForPrint(pdfData);

      // Open PDF in new window
      openPDFPreview(printData);
      
      setExportState('success');
      
      // Reset to idle after success message
      setTimeout(() => {
        setExportState('idle');
      }, 2000);

    } catch (error) {
      console.error('PDF Export Error:', error);
      setErrorMessage(`Export failed: ${error.message}`);
      setExportState('error');
      
      // Reset to idle after error display
      setTimeout(() => {
        setExportState('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const openPDFPreview = (pdfData) => {
    // Close existing PDF window if open
    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.close();
    }

    // Create new window for PDF preview
    const newWindow = window.open('', '_blank', 
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    );

    if (!newWindow) {
      throw new Error('Unable to open PDF preview window. Please check your browser\'s popup blocker settings.');
    }

    setPdfWindow(newWindow);

    // Generate HTML for the PDF preview
    const htmlContent = generatePDFHTML(pdfData);
    
    // Write HTML to new window
    newWindow.document.write(htmlContent);
    newWindow.document.close();

    // Set window title
    const fileName = pdfData.printMetadata.title || 'Velocity_Measurement_Protocol';
    newWindow.document.title = fileName;

    // Focus the new window
    newWindow.focus();

    // Add print functionality
    setTimeout(() => {
      if (!newWindow.closed) {
        // Add print button and keyboard shortcut
        newWindow.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            newWindow.print();
          }
        });
      }
    }, 1000);
  };

  const generatePDFHTML = (pdfData) => {
    // Create complete HTML document for PDF preview
    return `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pdfData.printMetadata.title}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #f0f0f0;
          }
          
          .pdf-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          
          .pdf-controls {
            background: #003875;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .pdf-controls h2 {
            margin: 0;
            font-size: 18px;
          }
          
          .pdf-controls-buttons {
            display: flex;
            gap: 10px;
          }
          
          .pdf-button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }
          
          .pdf-button.primary {
            background: #28a745;
            color: white;
          }
          
          .pdf-button.primary:hover {
            background: #218838;
          }
          
          .pdf-button.secondary {
            background: #6c757d;
            color: white;
          }
          
          .pdf-button.secondary:hover {
            background: #5a6268;
          }
          
          .pdf-content {
            position: relative;
          }
          
          .instructions {
            background: #e7f3ff;
            padding: 15px;
            border-bottom: 1px solid #ccc;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          
          .keyboard-hint {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
          }
          
          @media print {
            body {
              background: white !important;
              padding: 0 !important;
            }
            
            .pdf-controls,
            .instructions {
              display: none !important;
            }
            
            .pdf-container {
              box-shadow: none !important;
              border-radius: 0 !important;
              max-width: none !important;
            }
          }
        </style>
        <script src="https://d3js.org/d3.v7.min.js"></script>
      </head>
      <body>
        <div class="pdf-container">
          <div class="pdf-controls">
            <h2>Velocity Measurement Protocol - PDF Preview</h2>
            <div class="pdf-controls-buttons">
              <button class="pdf-button primary" onclick="window.print()">
                Print / Save as PDF
              </button>
              <button class="pdf-button secondary" onclick="window.close()">
                Close
              </button>
            </div>
          </div>
          
          <div class="instructions">
            <div>
              <strong>Instructions:</strong> 
              Click "Print / Save as PDF" to save this protocol to your computer, or use <kbd>Ctrl+P</kbd>
            </div>
            <div class="keyboard-hint">
              Tip: Choose "Save as PDF" as your printer destination to create a PDF file
            </div>
          </div>
          
          <div class="pdf-content" id="pdf-content">
            <!-- PDF content will be injected here -->
          </div>
        </div>
        
        <script>
          // PDF data injected from React
          window.pdfData = ${JSON.stringify(pdfData)};
          
          // Simple PDF rendering (since we can't use React in new window)
          function renderPDF() {
            const container = document.getElementById('pdf-content');
            container.innerHTML = \`
              <div style="width: 297mm; min-height: 210mm; margin: 0 auto; background: white; font-family: Arial, sans-serif; font-size: 11px; color: #000; position: relative;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15mm 20mm 10mm 20mm; border-bottom: 2px solid #003875;">
                  <div style="height: 40px; width: 120px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc; font-size: 10px; color: #666;">
                    Schlatter Logo
                  </div>
                  <h1 style="font-size: 18px; font-weight: bold; color: #003875; text-align: center; flex-grow: 1; margin: 0 20px;">
                    Protokoll zur Geschwindigkeitsmessung
                  </h1>
                  <div style="width: 100px;"></div>
                </div>
                
                <!-- Main Content -->
                <div style="display: grid; grid-template-columns: 200px 1fr 180px; gap: 15px; padding: 15mm 20mm; min-height: 140mm;">
                  <!-- Left Column -->
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    \${renderDataSections()}
                  </div>
                  
                  <!-- Center Column -->
                  <div style="display: flex; flex-direction: column; align-items: center;">
                    <div style="border: 1px solid #666; background: white; padding: 10px; width: 600px; height: 400px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #666;">
                      Chart will render here<br/>
                      <small style="font-size: 10px; margin-top: 5px;">D3.js chart rendering in progress...</small>
                    </div>
                    \${renderSystemParameters()}
                  </div>
                  
                  <!-- Right Column -->
                  <div>
                    \${renderMeasurementTable()}
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="position: absolute; bottom: 15mm; right: 20mm; font-size: 10px; color: #666;">
                  \${window.pdfData.timestamp}
                </div>
              </div>
            \`;
            
            // Render chart after DOM is ready
            setTimeout(renderChart, 100);
          }
          
          function renderDataSections() {
            const { header } = window.pdfData;
            return \`
              <!-- Auftragsdaten -->
              <div style="border: 1px solid #666; background: #f8f8f8;">
                <div style="background: #003875; color: white; padding: 4px 8px; font-weight: bold; font-size: 10px; text-align: center;">Auftragsdaten</div>
                <div style="padding: 6px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9px;">
                    <span>Auftrags-Nr.:</span>
                    <span style="font-weight: bold;">\${header.auftragsdaten.auftragsNr}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9px;">
                    <span>Maschinentyp:</span>
                    <span style="font-weight: bold;">\${header.auftragsdaten.maschinentyp}</span>
                  </div>
                </div>
              </div>
              
              <!-- Similar sections for Prüfung, Regelventil, Prüfbedingungen -->
              <div style="border: 1px solid #666; background: #f8f8f8;">
                <div style="background: #003875; color: white; padding: 4px 8px; font-weight: bold; font-size: 10px; text-align: center;">Prüfung</div>
                <div style="padding: 6px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9px;">
                    <span>Prüfer:</span>
                    <span style="font-weight: bold;">\${header.pruefung.pruefer}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9px;">
                    <span>Datum:</span>
                    <span style="font-weight: bold;">\${header.pruefung.datum}</span>
                  </div>
                </div>
              </div>
            \`;
          }
          
          function renderSystemParameters() {
            const { systemParameters } = window.pdfData;
            return \`
              <div style="margin-top: 15px; border: 1px solid #666; background: #f0f8ff; width: 100%;">
                <div style="background: #003875; color: white; padding: 4px 8px; font-weight: bold; font-size: 10px; text-align: center;">Systemparameter für SWEP-Formular</div>
                <div style="padding: 8px; font-size: 9px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Geschwindigkeitsänderung pro Volt:</span>
                    <span style="font-weight: bold; font-family: monospace;">\${systemParameters.geschwindigkeitsaenderungProVolt.toFixed(2)} mm/s/V</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Schlittengeschwindigkeit bei 0.3 V:</span>
                    <span style="font-weight: bold; font-family: monospace;">\${systemParameters.geschwindigkeitBei03V.toFixed(3)} mm/s</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Maximale Schlittengeschwindigkeit bei 10 V:</span>
                    <span style="font-weight: bold; font-family: monospace;">\${systemParameters.maxGeschwindigkeitBei10V.toFixed(2)} mm/s</span>
                  </div>
                </div>
              </div>
            \`;
          }
          
          function renderMeasurementTable() {
            const { measurementTable } = window.pdfData;
            const rows = measurementTable.map(m => 
              \`<tr>
                <td style="padding: 2px 4px; text-align: center; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 8px;">\${m.voltage.toFixed(2)}</td>
                <td style="padding: 2px 4px; text-align: center; border-bottom: 1px solid #ddd; font-family: monospace; font-size: 8px;">\${m.velocity.toFixed(2)}</td>
              </tr>\`
            ).join('');
            
            return \`
              <div style="border: 1px solid #666; background: #f8f8f8; height: fit-content;">
                <div style="background: #003875; color: white; padding: 4px 8px; font-weight: bold; font-size: 10px; text-align: center;">Messwerte</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                  <thead>
                    <tr>
                      <th style="background: #003875; color: white; padding: 3px; text-align: center; font-size: 7px; font-weight: bold;">Eingangsspannung<br/>UE [V]</th>
                      <th style="background: #003875; color: white; padding: 3px; text-align: center; font-size: 7px; font-weight: bold;">Schlittengeschw.<br/>v [mm/s]</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${rows}
                  </tbody>
                </table>
              </div>
            \`;
          }
          
          function renderChart() {
            // Simplified chart rendering for new window
            const chartContainer = document.querySelector('.chart-placeholder');
            if (!chartContainer) return;
            
            // This would require full D3.js implementation
            // For now, show placeholder
            console.log('Chart data:', window.pdfData.chartData);
          }
          
          // Initialize PDF rendering
          document.addEventListener('DOMContentLoaded', renderPDF);
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderPDF);
          } else {
            renderPDF();
          }
        </script>
      </body>
      </html>
    `;
  };

  const getButtonText = () => {
    switch (exportState) {
      case 'loading': return 'Preparing PDF...';
      case 'success': return 'PDF Ready';
      case 'error': return 'Export Failed';
      default: return 'Export PDF';
    }
  };

  const getButtonClass = () => {
    const baseClass = 'pdf-export-button';
    const variantClass = variant === 'secondary' ? 'secondary' : 'primary';
    const stateClass = exportState !== 'idle' ? exportState : '';
    
    return `${baseClass} ${variantClass} ${stateClass} ${className}`.trim();
  };

  const isButtonDisabled = disabled || exportState === 'loading' || 
    !voltageAssignments || Object.keys(voltageAssignments).length === 0 ||
    !regressionData || regressionData.length < 2;

  return (
    <div className="pdf-export-container">
      <style jsx>{`
        .pdf-export-container {
          display: inline-block;
          position: relative;
        }

        .pdf-export-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
          justify-content: center;
          text-align: center;
        }

        .pdf-export-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .pdf-export-button.primary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #ccc;
        }

        .pdf-export-button.primary:hover:not(:disabled) {
          background: #e9ecef;
        }

        .pdf-export-button.secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #ccc;
        }

        .pdf-export-button.secondary:hover:not(:disabled) {
          background: #e9ecef;
        }

        .pdf-export-button.loading {
          background: #e9ecef;
        }

        .pdf-export-button.success {
          background: #e9ecef;
        }

        .pdf-export-button.error {
          background: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes success-flash {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }

        .error-message {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #dc3545;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          margin-top: 5px;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .error-message::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 20px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 5px solid #dc3545;
        }

        .validation-info {
          font-size: 11px;
          color: #666;
          margin-top: 5px;
          text-align: center;
        }

        .validation-info.warning {
          color: #856404;
        }

        .validation-info.error {
          color: #721c24;
        }

        .validation-info.success {
          color: #155724;
        }
      `}</style>

      <button
        className={getButtonClass()}
        onClick={handleExport}
        disabled={isButtonDisabled}
        style={style}
        title={isButtonDisabled ? 'Complete voltage assignments to enable PDF export' : 'Export velocity measurement protocol as PDF'}
      >
        {getButtonText()}
      </button>

      {errorMessage && exportState === 'error' && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {/* Validation status info */}
      {isButtonDisabled && (
        <div className="validation-info error">
          {!voltageAssignments || Object.keys(voltageAssignments).length === 0 
            ? 'No voltage assignments found'
            : !regressionData || regressionData.length < 2
            ? 'Insufficient measurement data'
            : 'Export not available'
          }
        </div>
      )}
    </div>
  );
};

export default PDFExportButton;