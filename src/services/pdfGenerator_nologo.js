/**
 * PDF Generator Service for Schlatter Speed Check Reports
 * MODIFIED: Now also returns PDF data for server storage
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { createPDFDataPackage, calculateBezierControlPoints, transformToPDFCoordinates } from '../utils/pdfDataMapper';

// Get version from package.json
const getAppVersion = () => {
  try {
    // In Electron environment, we can access the main process
    if (window.require) {
      const { remote } = window.require('electron');
      const app = remote ? remote.app : window.require('electron').app;
      return app.getVersion();
    }
    
    // Fallback: try to read package.json directly
    if (window.fs && window.fs.readFileSync) {
      const packageJson = JSON.parse(window.fs.readFileSync('package.json', 'utf8'));
      return packageJson.version;
    }
    
    // If neither works, return a default
    return '1.0.0';
  } catch (error) {
    console.warn('Could not retrieve app version:', error);
    return '1.0.0';
  }
};

/**
 * Main PDF generation function - MODIFIED
 * @param {Object} reactData - Data from React app
 * @param {boolean} returnData - If true, also return PDF data for server storage
 */
export const generatePDF = (reactData, returnData = false) => {
  try {
    console.log('Starting PDF generation...');
    
    // Transform React data to PDF format
    const pdfData = createPDFDataPackage(reactData);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Schlatter brand colors
    const colors = {
      schlatterBlue: [0, 50, 120],
      schlatterRed: [220, 50, 50],
      text: [51, 51, 51],
      textLight: [102, 102, 102],
      border: [200, 200, 200],
      background: [248, 249, 250]
    };
    
    addHeader(doc, pageWidth, colors);
    addInfoBoxes(doc, pdfData.testFormData, colors);
    addResultsSection(doc, pdfData.voltageData, pdfData.speedCheckResults, pdfData.systemParameters, pageWidth, colors);
    
    // Add version information at bottom left
    addVersionInfo(doc, colors);
    
    // Save PDF (downloads to user as before)
    doc.save(pdfData.filename);
    console.log(`PDF generated: ${pdfData.filename}`);
    
    // NEW: Also return PDF data for server storage if requested
    if (returnData) {
      const pdfArrayBuffer = doc.output('arraybuffer');
      return pdfArrayBuffer;
    }
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

function addVersionInfo(doc, colors) {
  const version = getAppVersion();
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textLight);
  
  // Position at bottom left (20mm from left, 290mm from top)
  doc.text(`SpeedChecker v${version}`, 20, 290);
}

function addHeader(doc, pageWidth, colors) {
  // Title - moved up by 6mm
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.text);
  doc.text("Protokoll zur Geschwindigkeitsmessung", 20, 18);
  
  // Underline - moved up by 6mm
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(20, 21, pageWidth - 82, 21);
  
  // Logo placeholder - moved up by 6mm
  const logoBase64 = "";
  
  try {
    if (logoBase64 !== "") {
      doc.addImage(logoBase64, 'PNG', pageWidth - 74, 2, 63, 26);
    } else {
      throw new Error('Logo placeholder');
    }
  } catch (error) {
    console.warn('Logo not loaded, using text fallback');
    
    // Fallback to text - moved up by 6mm
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.schlatterBlue);
    doc.text("schlatter", pageWidth - 45, 12);
    
    // Logo box border - moved up by 6mm
    doc.setDrawColor(...colors.schlatterBlue);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth - 50, 6, 40, 12);
  }
  
  // Reset colors
  doc.setTextColor(...colors.text);
  doc.setDrawColor(...colors.border);
}

function addInfoBoxes(doc, testData, colors) {
  const boxWidth = 85;
  const uniformBoxHeight = 38; // Uniform height for both bottom boxes
  const reducedBoxHeight = 25; // Height for top boxes
  const startY = 28; // Moved up by 7mm (was 35)
  const leftX = 20;
  const rightX = 110;
  
  // Helper function to format date from YYYY-MM-DD to DD.MM.YYYY
  const formatDateForPDF = (isoDate) => {
    if (!isoDate) return '';
    try {
      const [year, month, day] = isoDate.split('-');
      return `${day}.${month}.${year}`;
    } catch (error) {
      return isoDate;
    }
  };
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  
  // Top row: Auftragsdaten (left) and Prüfung (right) - both small boxes
  addInfoBox(doc, "Auftragsdaten", leftX, startY, boxWidth, reducedBoxHeight, [
    ["Auftrags-Nr.:", testData.auftragsNr || ""],
    ["Maschinentyp:", testData.maschinentyp || ""]
  ], colors);
  
  addInfoBox(doc, "Prüfung", rightX, startY, boxWidth, reducedBoxHeight, [
    ["Prüfer:", testData.pruefer || ""],
    ["Datum:", testData.datumFormatted || formatDateForPDF(testData.datum) || ""]
  ], colors);
  
  // Bottom row: Both boxes now have uniform height of 38mm
  addInfoBox(doc, "Regelventil", leftX, startY + reducedBoxHeight + 5, boxWidth, uniformBoxHeight, [
    ["Art.-Nr. S-CH:", testData.artNrSCH || ""],
    ["Art.-Nr. Parker:", wrapText(testData.artNrParker || "", 25)],
    ["Nenndurchfluss:", testData.nenndurchfluss || ""],
    ["S/N Parker:", testData.snParker || ""]
  ], colors);
  
  addInfoBox(doc, "Prüfbedingungen", rightX, startY + reducedBoxHeight + 5, boxWidth, uniformBoxHeight, [
    ["Offset Original:", (testData.ventilOffsetOriginal || "") + (testData.ventilOffsetOriginal ? " V" : "")],
    ["Parker Korrektur:", (testData.ventilOffsetKorrektur || "") + (testData.ventilOffsetKorrektur ? " %" : "")],
    ["Offset n. Korrektur:", (testData.ventilOffsetNachKorrektur || "0.00") + " V"],
    ["Druck am Ventil:", (testData.druckVentil || "") + (testData.druckVentil ? " bar" : "")],
    ["Öltemperatur:", (testData.oeltemperatur || "") + (testData.oeltemperatur ? " °C" : "")]
  ], colors);
}

function addInfoBox(doc, title, x, y, width, height, data, colors) {
  // Border
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.schlatterBlue);
  doc.text(title, x + 3, y + 7);
  
  // Title underline
  doc.setDrawColor(...colors.schlatterBlue);
  doc.setLineWidth(0.3);
  doc.line(x + 3, y + 9, x + width - 3, y + 9);
  
  // Data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  let currentY = y + 16;
  const lineHeight = 4.5;
  
  data.forEach(([label, value]) => {
    if (currentY < y + height - 3) {
      // Label
      doc.setTextColor(...colors.textLight);
      doc.text(label, x + 3, currentY);
      
      // Value
      doc.setTextColor(...colors.text);
      doc.setFont("helvetica", "bold");
      
      const maxWidth = 35;
      const wrappedValue = wrapText(value, maxWidth);
      const lines = wrappedValue.split('\n');
      
      lines.forEach((line, lineIndex) => {
        if (currentY + (lineIndex * 3.5) < y + height - 3) {
          doc.text(line, x + 42, currentY + (lineIndex * 3.5));
        }
      });
      
      doc.setFont("helvetica", "normal");
      currentY += lineHeight + (lines.length > 1 ? 3 : 0);
    }
  });
  
  doc.setTextColor(...colors.text);
  doc.setDrawColor(...colors.border);
}

function wrapText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  
  const words = text.split(' ');
  let result = '';
  let line = '';
  
  for (const word of words) {
    if ((line + word).length <= maxLength) {
      line += (line ? ' ' : '') + word;
    } else {
      if (result) result += '\n';
      result += line;
      line = word;
    }
  }
  
  if (line) {
    if (result) result += '\n';
    result += line;
  }
  
  return result;
}

function addResultsSection(doc, voltageData, speedCheckResults, systemParameters, pageWidth, colors) {
  // Keep all positions exactly the same as before
  const tableSectionY = 105;
  const chartSectionY = 115;
  const tableWidth = 28;
  const chartX = 67;
  const chartWidth = 130;
  const chartHeight = 124;
  
  addExtendedMeasurementTable(doc, voltageData, 20, tableSectionY, tableWidth, colors);
  addChart(doc, voltageData, speedCheckResults, chartX, chartSectionY, chartWidth, chartHeight, colors);
  addSystemParametersUnderChart(doc, systemParameters, chartX, chartSectionY + chartHeight + 18, chartWidth, colors);
}

function addExtendedMeasurementTable(doc, data, x, y, width, colors) {
  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.schlatterBlue);
  
  doc.setFillColor(...colors.background);
  doc.rect(x, y, width, 8, 'F');
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, 8);
  doc.text("Messwerte", x + width/2 - 10, y + 5.5);
  
  // Column headers
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.text);
  
  doc.setFillColor(250, 250, 250);
  doc.rect(x, y + 8, width/2, 32, 'F');
  doc.rect(x + width/2, y + 8, width/2, 32, 'F');
  doc.rect(x, y + 8, width, 32);
  doc.line(x + width/2, y + 8, x + width/2, y + 40);
  
  doc.text("Eingangsspannung UE [V]", x + width/4 - 1, y + 38, { angle: 90 });
  doc.text("Schlittengeschw. v [mm/s]", x + 3*width/4 - 1, y + 38, { angle: 90 });
  
  // Data rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.text);
  
  let currentY = y + 40;
  const rowHeight = 4.1;
  const maxY = 277;
  
  data.forEach((row, index) => {
    if (currentY > maxY) return;
    
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(x, currentY, width, rowHeight, 'F');
    }
    
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.1);
    doc.rect(x, currentY, width, rowHeight);
    doc.line(x + width/2, currentY, x + width/2, currentY + rowHeight);
    
    doc.text(row.voltage.toFixed(2), x + width/4 - 2, currentY + 2.8, { align: 'center' });
    doc.text(row.velocity.toFixed(2), x + 3*width/4 - 2, currentY + 2.8, { align: 'center' });
    currentY += rowHeight;
  });
}

function addChart(doc, data, speedCheckResults, x, y, width, height, colors) {
  // Chart title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.schlatterBlue);
  doc.text("Diagramm der Messwerte und Regressionsgerade", x + width/2 - 45, y - 4);
  
  // Chart border
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.4);
  doc.rect(x, y, width, height);
  
  // Calculate scales
  const voltageRange = [-10, 10];
  const velocityRange = calculateVelocityRange(data);
  
  const xScale = width / (voltageRange[1] - voltageRange[0]);
  const yScale = height / (velocityRange[1] - velocityRange[0]);
  
  addChartGrid(doc, x, y, width, height, voltageRange, velocityRange, xScale, yScale, colors);
  addChartAxes(doc, x, y, width, height, voltageRange, velocityRange, colors);
  addChartDataPoints(doc, data, x, y, voltageRange, velocityRange, xScale, yScale, colors);
  addRedRegressionLine(doc, speedCheckResults, x, y, width, height, voltageRange, velocityRange, xScale, yScale, colors);
}

function calculateVelocityRange(data) {
  const velocities = data.map(d => d.velocity);
  const min = Math.min(...velocities);
  const max = Math.max(...velocities);
  const buffer = (max - min) * 0.1;
  return [min - buffer, max + buffer];
}

function addChartGrid(doc, x, y, width, height, voltageRange, velocityRange, xScale, yScale, colors) {
  doc.setDrawColor(240, 240, 240);
  doc.setLineWidth(0.08);
  
  // Vertical grid lines
  for (let v = voltageRange[0]; v <= voltageRange[1]; v++) {
    const gridX = x + (v - voltageRange[0]) * xScale;
    doc.line(gridX, y, gridX, y + height);
  }
  
  // Horizontal grid lines
  const step = Math.ceil((velocityRange[1] - velocityRange[0]) / 20);
  for (let v = Math.ceil(velocityRange[0]); v <= velocityRange[1]; v += step) {
    const gridY = y + height - (v - velocityRange[0]) * yScale;
    doc.line(x, gridY, x + width, gridY);
  }
  
  // Zero lines
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.15);
  
  const zeroX = x + (0 - voltageRange[0]) * xScale;
  doc.line(zeroX, y, zeroX, y + height);
  
  const zeroY = y + height - (0 - velocityRange[0]) * yScale;
  doc.line(x, zeroY, x + width, zeroY);
  
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
}

function addChartAxes(doc, x, y, width, height, voltageRange, velocityRange, colors) {
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textLight);
  
  // Axis labels
  doc.text("Eingangsspannung UE [V]", x + width/2 - 16, y + height + 10);
  doc.text("Schlittengeschwindigkeit v [mm/s]", x - 10, y + height/2 + 20, { angle: 90 });
  
  // Tick labels
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.text);
  
  // X-axis ticks
  for (let v = voltageRange[0]; v <= voltageRange[1]; v += 2) {
    const tickX = x + (v - voltageRange[0]) * (width / (voltageRange[1] - voltageRange[0]));
    doc.text(v.toString(), tickX - 2, y + height + 4);
    
    doc.setDrawColor(...colors.border);
    doc.line(tickX, y + height, tickX, y + height + 1);
  }
  
  // Y-axis ticks
  const step = Math.ceil((velocityRange[1] - velocityRange[0]) / 10);
  for (let v = Math.ceil(velocityRange[0]); v <= velocityRange[1]; v += step) {
    const tickY = y + height - (v - velocityRange[0]) * (height / (velocityRange[1] - velocityRange[0]));
    doc.text(v.toString(), x - 6, tickY + 1);
    doc.line(x - 1, tickY, x, tickY);
  }
}

function addChartDataPoints(doc, data, x, y, voltageRange, velocityRange, xScale, yScale, colors) {
  const sortedData = [...data].sort((a, b) => a.voltage - b.voltage);
  
  const chartPoints = sortedData.map(point => ({
    x: x + (point.voltage - voltageRange[0]) * xScale,
    y: y + (velocityRange[1] - point.velocity) * yScale,
    voltage: point.voltage,
    velocity: point.velocity
  }));
  
  // NEW: Calculate Bezier control points for smooth curve
  const chartParams = {
    x: x,
    y: y,
    width: x + (voltageRange[1] - voltageRange[0]) * xScale,
    height: y + (velocityRange[1] - velocityRange[0]) * yScale,
    voltageRange: voltageRange,
    velocityRange: velocityRange,
    xScale: xScale,
    yScale: yScale
  };
  
  // Get Bezier segments with control points
  const bezierSegments = calculateBezierControlPoints(sortedData);
  const pdfBezierSegments = transformToPDFCoordinates(bezierSegments, chartParams);
  
  // Draw smooth curve using Bezier curves
  doc.setDrawColor(...colors.schlatterBlue);
  doc.setLineWidth(0.4);
  
  if (pdfBezierSegments && pdfBezierSegments.length > 0) {
    // Move to first point
    doc.moveTo(pdfBezierSegments[0].start.x, pdfBezierSegments[0].start.y);
    
    // Draw each Bezier segment
    pdfBezierSegments.forEach(segment => {
      doc.curveTo(
        segment.cp1.x, segment.cp1.y,
        segment.cp2.x, segment.cp2.y,
        segment.end.x, segment.end.y
      );
    });
    
    // Stroke the complete path
    doc.stroke();
  } else {
    // Fallback to straight lines if Bezier calculation fails
    for (let i = 0; i < chartPoints.length - 1; i++) {
      doc.line(chartPoints[i].x, chartPoints[i].y, chartPoints[i + 1].x, chartPoints[i + 1].y);
    }
  }
  
  // Data points (diamonds) - unchanged
  doc.setFillColor(...colors.schlatterBlue);
  doc.setDrawColor(...colors.schlatterBlue);
  doc.setLineWidth(0.2);
  chartPoints.forEach(point => {
    doc.circle(point.x, point.y, 0.8, 'FD');
  });
}

function addRedRegressionLine(doc, speedCheckResults, x, y, width, height, voltageRange, velocityRange, xScale, yScale, colors) {
  doc.setDrawColor(...colors.schlatterRed);
  doc.setLineWidth(0.6);
  
  const slope = speedCheckResults.manualSlope || speedCheckResults.calculatedSlope;
  const intercept = speedCheckResults.intercept || 0;
  
  const startVoltage = voltageRange[0];
  const endVoltage = voltageRange[1];
  
  let startVelocity = slope * startVoltage + intercept;
  let endVelocity = slope * endVoltage + intercept;
  
  const minVelocity = velocityRange[0];
  const maxVelocity = velocityRange[1];
  
  let actualStartVoltage = startVoltage;
  let actualEndVoltage = endVoltage;
  
  if (startVelocity < minVelocity) {
    startVelocity = minVelocity;
    actualStartVoltage = (minVelocity - intercept) / slope;
  }
  if (startVelocity > maxVelocity) {
    startVelocity = maxVelocity;
    actualStartVoltage = (maxVelocity - intercept) / slope;
  }
  
  if (endVelocity < minVelocity) {
    endVelocity = minVelocity;
    actualEndVoltage = (minVelocity - intercept) / slope;
  }
  if (endVelocity > maxVelocity) {
    endVelocity = maxVelocity;
    actualEndVoltage = (maxVelocity - intercept) / slope;
  }
  
  const startX = x + (actualStartVoltage - voltageRange[0]) * xScale;
  const endX = x + (actualEndVoltage - voltageRange[0]) * xScale;
  const startY = y + height - (startVelocity - velocityRange[0]) * yScale;
  const endY = y + height - (endVelocity - velocityRange[0]) * yScale;
  
  doc.line(startX, startY, endX, endY);
  
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
}

function addSystemParametersUnderChart(doc, params, x, y, width, colors) {
  // Section header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.schlatterBlue);
  doc.text("Systemparameter für SWEP-Formular", x, y);
  
  // Underline
  doc.setDrawColor(...colors.schlatterBlue);
  doc.setLineWidth(0.3);
  doc.line(x, y + 2, x + width, y + 2);
  
  // Parameters
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...colors.text);
  
  const parameters = [
    [`Steigung der Regr.ger.`, `${params.slopeValue}`, `mm/s/V`],
    [`Geschw. bei 0.3 V`, `${params.speedAt03V}`, `mm/s`],
    [`Max. Geschw. bei 10 V`, `${params.maxSpeedAt10V}`, `mm/s`]
  ];
  
  let currentY = y + 8;
  parameters.forEach(([label, value, unit], index) => {
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(x, currentY - 2, width, 5, 'F');
    }
    
    doc.setTextColor(...colors.textLight);
    doc.text(label, x + 2, currentY);
    
    doc.setTextColor(...colors.text);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + width - 30, currentY);
    doc.setFont("helvetica", "normal");
    
    doc.setTextColor(...colors.textLight);
    doc.text(unit, x + width - 15, currentY);
    
    currentY += 6;
  });
  
  // Date stamp
  doc.setFontSize(7);
  doc.setTextColor(...colors.textLight);
  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} / ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  doc.text(timestamp, x + width - 22, currentY + 4);
  
  doc.setTextColor(...colors.text);
}