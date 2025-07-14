/**
 * PDF Export Service
 * Prepares and formats all data for PDF protocol generation
 * Combines test form data, voltage assignments, and regression results
 */

import { calculateLinearRegression } from './regressionAnalysis';

/**
 * Main function to prepare all data for PDF export
 * @param {Object} testFormData - Form data from TestDataForm
 * @param {Object} voltageAssignments - User voltage assignments
 * @param {Array} regressionData - Regression analysis data
 * @param {Array} mappedResults - Voltage mapped results
 * @returns {Object} Complete PDF data structure
 */
export const preparePDFData = (testFormData, voltageAssignments, regressionData, mappedResults) => {
  // Validate inputs
  const validation = validatePDFInputs(testFormData, voltageAssignments, regressionData);
  if (!validation.isValid) {
    throw new Error(`PDF data validation failed: ${validation.error}`);
  }

  // Calculate regression for system parameters
  const regression = calculateLinearRegression(regressionData);
  
  // Prepare all data sections
  const pdfData = {
    header: formatHeaderData(testFormData),
    measurementTable: formatMeasurementTable(mappedResults),
    chartData: formatChartData(regressionData, regression),
    systemParameters: calculateSystemParameters(regression, regressionData),
    timestamp: generateTimestamp(),
    metadata: {
      totalFiles: Object.keys(voltageAssignments).length,
      totalMeasurements: regressionData.length,
      voltageRange: getVoltageRange(regressionData)
    }
  };

  return pdfData;
};

/**
 * Format header data for PDF (left column tables)
 */
export const formatHeaderData = (testFormData) => {
  if (!testFormData) {
    return getDefaultHeaderData();
  }

  return {
    auftragsdaten: {
      auftragsNr: testFormData.auftragsNr || '',
      maschinentyp: testFormData.maschinentyp || ''
    },
    pruefung: {
      pruefer: testFormData.pruefer || '',
      datum: testFormData.datum || new Date().toISOString().split('T')[0]
    },
    regelventil: {
      artNrSCH: testFormData.artNrSCH || '',
      artNrParker: testFormData.artNrParker || '',
      nenndurchfluss: testFormData.nenndurchfluss || '',
      snParker: testFormData.snParker || ''
    },
    pruefbedingungen: {
      ventilabgleichUEQ: parseFloat(testFormData.ventilOffsetNachKorrektur || '0.00'),
      druckVentil: parseFloat(testFormData.druckVentil || '0.00'),
      oeltemperatur: parseFloat(testFormData.oeltemperatur || '0.00')
    }
  };
};

/**
 * Format measurement table data (voltage/velocity pairs)
 */
export const formatMeasurementTable = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    return [];
  }

  // Filter out reference entries and sort by voltage
  const measurements = mappedResults
    .filter(result => result.rampType !== 'reference')
    .sort((a, b) => b.voltage - a.voltage); // Descending order (10V to -10V)

  // Create measurement pairs
  const measurementTable = measurements.map(result => ({
    voltage: result.voltage,
    velocity: result.velocity,
    rampType: result.rampType,
    fileName: result.fileName
  }));

  return measurementTable;
};

/**
 * Format chart data for PDF regression chart
 */
export const formatChartData = (regressionData, regression) => {
  if (!regressionData || regressionData.length === 0) {
    return {
      dataPoints: [],
      regressionLine: [],
      statistics: null
    };
  }

  // Generate regression line points
  const regressionLine = [];
  if (regression) {
    for (let voltage = -10; voltage <= 10; voltage += 0.1) {
      const velocity = regression.slope * voltage + regression.yIntercept;
      regressionLine.push({ voltage, velocity });
    }
  }

  return {
    dataPoints: regressionData,
    regressionLine: regressionLine,
    statistics: regression ? {
      slope: regression.slope,
      yIntercept: regression.yIntercept,
      rSquared: regression.rSquared,
      equation: regression.equation
    } : null
  };
};

/**
 * Calculate system parameters for bottom summary
 */
export const calculateSystemParameters = (regression, regressionData) => {
  if (!regression || !regressionData) {
    return {
      geschwindigkeitsaenderungProVolt: 0,
      geschwindigkeitBei03V: 0,
      maxGeschwindigkeitBei10V: 0
    };
  }

  // Slope = velocity change per volt (Steigung der Regressionsgerade)
  const geschwindigkeitsaenderungProVolt = Math.abs(regression.slope);

  // Velocity at 0.3V using regression equation
  const geschwindigkeitBei03V = Math.abs(regression.slope * 0.3 + regression.yIntercept);

  // Velocity at 10V using regression equation
  const maxGeschwindigkeitBei10V = Math.abs(regression.slope * 10 + regression.yIntercept);

  return {
    geschwindigkeitsaenderungProVolt: geschwindigkeitsaenderungProVolt,
    geschwindigkeitBei03V: geschwindigkeitBei03V,
    maxGeschwindigkeitBei10V: maxGeschwindigkeitBei10V
  };
};

/**
 * Generate German-formatted timestamp
 */
export const generateTimestamp = () => {
  const now = new Date();
  
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${day}.${month}.${year} / ${hours}:${minutes}`;
};

/**
 * Get voltage range from regression data
 */
export const getVoltageRange = (regressionData) => {
  if (!regressionData || regressionData.length === 0) {
    return { min: 0, max: 0 };
  }

  const voltages = regressionData.map(point => point.voltage);
  return {
    min: Math.min(...voltages),
    max: Math.max(...voltages)
  };
};

/**
 * Get velocity range from regression data
 */
export const getVelocityRange = (regressionData) => {
  if (!regressionData || regressionData.length === 0) {
    return { min: 0, max: 0 };
  }

  const velocities = regressionData.map(point => Math.abs(point.velocity));
  const maxVelocity = Math.max(...velocities);
  
  return {
    min: -maxVelocity - 2, // Add 2mm/s buffer
    max: maxVelocity + 2
  };
};

/**
 * Validate PDF input data
 */
export const validatePDFInputs = (testFormData, voltageAssignments, regressionData) => {
  // Check if we have voltage assignments
  if (!voltageAssignments || Object.keys(voltageAssignments).length === 0) {
    return { isValid: false, error: 'No voltage assignments found' };
  }

  // Check if we have regression data
  if (!regressionData || regressionData.length < 2) {
    return { isValid: false, error: 'Insufficient regression data (need at least 2 points)' };
  }

  // Check for valid voltage range
  const voltageRange = getVoltageRange(regressionData);
  if (voltageRange.max > 10 || voltageRange.min < -10) {
    return { isValid: false, error: 'Voltage range exceeds ±10V limits' };
  }

  // Warn if test form data is missing (but don't fail)
  if (!testFormData) {
    console.warn('PDF Export: Test form data missing, using defaults');
  }

  return { isValid: true };
};

/**
 * Default header data when form data is missing
 */
export const getDefaultHeaderData = () => {
  return {
    auftragsdaten: {
      auftragsNr: '',
      maschinentyp: ''
    },
    pruefung: {
      pruefer: '',
      datum: new Date().toISOString().split('T')[0]
    },
    regelventil: {
      artNrSCH: '',
      artNrParker: '',
      nenndurchfluss: '',
      snParker: ''
    },
    pruefbedingungen: {
      ventilabgleichUEQ: 0.00,
      druckVentil: 0.00,
      oeltemperatur: 0.00
    }
  };
};

/**
 * Prepare PDF data for browser print
 */
export const preparePDFForPrint = (pdfData) => {
  // Add print-specific metadata
  return {
    ...pdfData,
    printMetadata: {
      pageSize: 'A4',
      orientation: 'landscape',
      margins: '10mm',
      title: `Protokoll_Geschwindigkeitsmessung_${pdfData.header.auftragsdaten.auftragsNr || 'Export'}`,
      author: 'Schlatter Industries',
      subject: 'Velocity Measurement Protocol',
      creator: 'CSV Analysis Tool'
    }
  };
};

/**
 * Export validation for user feedback
 */
export const validateForExport = (testFormData, voltageAssignments, regressionData) => {
  const issues = [];
  const warnings = [];

  // Critical issues (prevent export)
  if (!voltageAssignments || Object.keys(voltageAssignments).length === 0) {
    issues.push('No approved voltage assignments found');
  }

  if (!regressionData || regressionData.length < 2) {
    issues.push('Insufficient measurement data for regression analysis');
  }

  // Warnings (allow export but notify user)
  if (!testFormData?.auftragsNr) {
    warnings.push('Auftrags-Nr. is missing');
  }

  if (!testFormData?.pruefer) {
    warnings.push('Prüfer name is missing');
  }

  if (!testFormData?.maschinentyp) {
    warnings.push('Maschinentyp is not selected');
  }

  if (!testFormData?.artNrSCH) {
    warnings.push('Regelventil Art.-Nr. is not selected');
  }

  return {
    canExport: issues.length === 0,
    issues: issues,
    warnings: warnings,
    message: issues.length > 0 
      ? `Cannot export: ${issues.join(', ')}`
      : warnings.length > 0 
        ? `Export ready with warnings: ${warnings.join(', ')}`
        : 'Ready to export PDF'
  };
};