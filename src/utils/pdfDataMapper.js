/**
 * PDF Data Mapper
 * Transforms React app data into the format expected by PDF generator
 */

/**
 * Transform React testFormData (English) to PDF format (German)
 * @param {Object} testFormData - Form data from React app (English field names)
 * @returns {Object} PDF-formatted test data (German field names)
 */
export const mapTestFormData = (testFormData) => {
  if (!testFormData) {
    // Return default structure if no data
    return {
      auftragsNr: "",
      maschinentyp: "",
      pruefer: "",
      datum: "",
      artNrSCH: "",
      artNrParker: "",
      nenndurchfluss: "",
      snParker: "",
      ventilOffsetOriginal: "",
      ventilOffsetKorrektur: "",
      ventilOffsetNachKorrektur: "",
      druckVentil: "",
      oeltemperatur: ""
    };
  }

  // Translate English field names to German for PDF generator
  return {
    // Auftragsdaten (Order Data)
    auftragsNr: testFormData.orderNumber || "",
    maschinentyp: testFormData.machineType || "",

    // Prüfung (Inspection)
    pruefer: testFormData.inspector || "",
    datum: testFormData.date || "",

    // Regelventil (Control Valve)
    artNrSCH: testFormData.articleNumberSCH || "",
    artNrParker: testFormData.articleNumberParker || "",
    nenndurchfluss: testFormData.nominalFlow || "",
    snParker: testFormData.serialNumberParker || "",

    // Prüfbedingungen (Test Conditions)
    ventilOffsetOriginal: testFormData.valveOffsetOriginal || "",
    ventilOffsetKorrektur: testFormData.valveOffsetCorrection || "",
    ventilOffsetNachKorrektur: testFormData.valveOffsetAfterCorrection || "",
    druckVentil: testFormData.valvePressure || "",
    oeltemperatur: testFormData.oilTemperature || ""
  };
};

/**
 * Transform mapped voltage results to voltage data for PDF chart
 * @param {Array} mappedResults - Results from createUserAssignedVoltageMapping
 * @returns {Array} PDF-formatted voltage data
 */
export const mapVoltageData = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    return [];
  }

  // Keep all voltage data including reference points - don't filter anything out
  const voltageData = mappedResults.map(result => ({
    voltage: parseFloat(result.voltage.toFixed(2)),
    velocity: parseFloat(result.velocity.toFixed(2))
  }));

  // Sort by voltage for proper chart display (descending: +10V to -10V)
  return voltageData.sort((a, b) => b.voltage - a.voltage);
};

/**
 * Transform speed check results to PDF format
 * @param {Object} speedCheckResults - Speed check analysis from React app
 * @returns {Object} PDF-formatted speed check results
 */
export const mapSpeedCheckResults = (speedCheckResults) => {
  if (!speedCheckResults) {
    throw new Error('Speed check analysis required for PDF generation');
  }

  return {
    calculatedSlope: speedCheckResults.calculatedSlope,
    manualSlope: speedCheckResults.manualSlope || speedCheckResults.calculatedSlope,
    manualSlopeFactor: speedCheckResults.manualSlopeFactor,
    intercept: speedCheckResults.intercept,
    machineType: speedCheckResults.machineType,
    machineParams: {
      lower: speedCheckResults.machineParams.lower,
      middle: speedCheckResults.machineParams.middle,
      upper: speedCheckResults.machineParams.upper,
      type: speedCheckResults.machineParams.type
    }
  };
};

/**
 * Generate system parameters for SWEP form section
 * @param {Object} speedCheckResults - Speed check analysis results
 * @param {number} realMaxSpeed - Real measured maximum speed from voltage data
 * @returns {Object} System parameters for PDF
 */
export const mapSystemParameters = (speedCheckResults, realMaxSpeed) => {
  if (!speedCheckResults) {
    throw new Error('Speed check results required for system parameters');
  }

  const slope = speedCheckResults.manualSlope || speedCheckResults.calculatedSlope;
  
  return {
    slopeValue: parseFloat(slope.toFixed(2)),
    speedAt03V: parseFloat((slope * 0.3).toFixed(3)),
    maxSpeedAt10V: parseFloat(realMaxSpeed.toFixed(2)) // Use real measured max speed
  };
};

/**
 * Generate PDF filename based on test data
 * @param {Object} testFormData - Test form data
 * @returns {string} Generated filename
 */
export const generatePDFFilename = (testFormData) => {
  const auftragsNr = testFormData?.auftragsNr || "UNKNOWN";
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  
  return `${auftragsNr}_Speedcheck_${day}.${month}.${year}.pdf`;
};

/**
 * Get formatted current date for PDF timestamp
 * @returns {string} Formatted date string
 */
export const getCurrentFormattedDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} / ${hours}:${minutes}`;
};

/**
 * Validate data before PDF generation
 * @param {Object} data - All data needed for PDF
 * @returns {Object} Validation result
 */
export const validatePDFData = (data) => {
  const { testFormData, voltageData, speedCheckResults } = data;

  // Check for required voltage data
  if (!voltageData || voltageData.length === 0) {
    return {
      isValid: false,
      error: 'No voltage/velocity data available for PDF generation'
    };
  }

  // Check for speed check results
  if (!speedCheckResults) {
    return {
      isValid: false,
      error: 'Speed check analysis required for PDF generation'
    };
  }

  // Check for valid slope
  const slope = speedCheckResults.manualSlope || speedCheckResults.calculatedSlope;
  if (!slope || isNaN(slope) || slope <= 0) {
    return {
      isValid: false,
      error: 'Invalid slope value in speed check results'
    };
  }

  // Validate voltage data format
  const invalidData = voltageData.find(point => 
    typeof point.voltage !== 'number' || 
    typeof point.velocity !== 'number' ||
    isNaN(point.voltage) || 
    isNaN(point.velocity)
  );

  if (invalidData) {
    return {
      isValid: false,
      error: 'Invalid voltage or velocity data detected'
    };
  }

  return { isValid: true };
};

/**
 * Calculate Bezier control points using Catmull-Rom spline
 * @param {Array} dataPoints - Array of {voltage, velocity} points (should be sorted)
 * @returns {Array} Array of Bezier segments with control points
 */
export const calculateBezierControlPoints = (dataPoints) => {
  if (!dataPoints || dataPoints.length < 2) {
    return null;
  }
  
  // If only 2 points, return null (will fall back to straight line)
  if (dataPoints.length === 2) {
    return null;
  }
  
  const segments = [];
  const tension = 0.5; // Tension factor for curve tightness
  
  for (let i = 0; i < dataPoints.length - 1; i++) {
    // Get the four points needed for Catmull-Rom calculation
    const p0 = dataPoints[i - 1] || dataPoints[i]; // Use current point if no previous
    const p1 = dataPoints[i];
    const p2 = dataPoints[i + 1];
    const p3 = dataPoints[i + 2] || dataPoints[i + 1]; // Use next point if no point after
    
    // Calculate tangents
    const t1 = {
      voltage: tension * (p2.voltage - p0.voltage),
      velocity: tension * (p2.velocity - p0.velocity)
    };
    
    const t2 = {
      voltage: tension * (p3.voltage - p1.voltage),
      velocity: tension * (p3.velocity - p1.velocity)
    };
    
    // Convert to Bezier control points
    const cp1 = {
      voltage: p1.voltage + t1.voltage / 3,
      velocity: p1.velocity + t1.velocity / 3
    };
    
    const cp2 = {
      voltage: p2.voltage - t2.voltage / 3,
      velocity: p2.velocity - t2.velocity / 3
    };
    
    segments.push({
      start: { voltage: p1.voltage, velocity: p1.velocity },
      cp1: cp1,
      cp2: cp2,
      end: { voltage: p2.voltage, velocity: p2.velocity }
    });
  }
  
  return segments;
};

/**
 * Transform Bezier segments from data coordinates to PDF coordinates
 * @param {Array} bezierSegments - Bezier segments in data space
 * @param {Object} chartParams - Chart transformation parameters
 * @returns {Array} Bezier segments in PDF coordinate space
 */
export const transformToPDFCoordinates = (bezierSegments, chartParams) => {
  if (!bezierSegments || bezierSegments.length === 0) {
    return null;
  }
  
  const { x, y, voltageRange, velocityRange, xScale, yScale } = chartParams;
  
  return bezierSegments.map(segment => {
    return {
      start: {
        x: x + (segment.start.voltage - voltageRange[0]) * xScale,
        y: y + (velocityRange[1] - segment.start.velocity) * yScale
      },
      cp1: {
        x: x + (segment.cp1.voltage - voltageRange[0]) * xScale,
        y: y + (velocityRange[1] - segment.cp1.velocity) * yScale
      },
      cp2: {
        x: x + (segment.cp2.voltage - voltageRange[0]) * xScale,
        y: y + (velocityRange[1] - segment.cp2.velocity) * yScale
      },
      end: {
        x: x + (segment.end.voltage - voltageRange[0]) * xScale,
        y: y + (velocityRange[1] - segment.end.velocity) * yScale
      }
    };
  });
};

/**
 * Create complete PDF data package
 * @param {Object} reactData - Data from React app
 * @returns {Object} Complete PDF data package
 */
export const createPDFDataPackage = (reactData) => {
  const { testFormData, voltageData: mappedResults, speedCheckResults, regressionData } = reactData;

  // Transform voltage data
  const voltageData = mapVoltageData(mappedResults);
  
  // Calculate real maximum measured speed from actual voltage data
  let realMaxSpeed = 0;
  
  // Find speeds at +10V and -10V
  const speedAt10V = voltageData.find(point => point.voltage === 10);
  const speedAtMinus10V = voltageData.find(point => point.voltage === -10);
  
  if (speedAt10V && speedAtMinus10V) {
    // Take the one with larger absolute value
    realMaxSpeed = Math.abs(speedAt10V.velocity) > Math.abs(speedAtMinus10V.velocity) 
      ? Math.abs(speedAt10V.velocity) 
      : Math.abs(speedAtMinus10V.velocity);
  } else if (speedAt10V) {
    realMaxSpeed = Math.abs(speedAt10V.velocity);
  } else if (speedAtMinus10V) {
    realMaxSpeed = Math.abs(speedAtMinus10V.velocity);
  } else {
    // Fallback: use the maximum absolute velocity from all data
    const maxVelocity = Math.max(...voltageData.map(point => Math.abs(point.velocity)));
    realMaxSpeed = maxVelocity;
  }

  // Transform all data
  const pdfData = {
    testFormData: mapTestFormData(testFormData),
    voltageData: voltageData,
    speedCheckResults: mapSpeedCheckResults(speedCheckResults),
    systemParameters: mapSystemParameters(speedCheckResults, realMaxSpeed),
    filename: generatePDFFilename(testFormData),
    timestamp: getCurrentFormattedDate()
  };

  // Validate the package
  const validation = validatePDFData(pdfData);
  if (!validation.isValid) {
    throw new Error(`PDF data validation failed: ${validation.error}`);
  }

  return pdfData;
};