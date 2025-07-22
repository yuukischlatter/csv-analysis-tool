/**
 * PDF Data Mapper
 * Transforms React app data into the format expected by PDF generator
 */

/**
 * Transform React testFormData to PDF format
 * @param {Object} testFormData - Form data from React app
 * @returns {Object} PDF-formatted test data
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

  return {
    // Auftragsdaten
    auftragsNr: testFormData.auftragsNr || "",
    maschinentyp: testFormData.maschinentyp || "",
    
    // Prüfung
    pruefer: testFormData.pruefer || "",
    datum: testFormData.datum || "",
    
    // Regelventil
    artNrSCH: testFormData.artNrSCH || "",
    artNrParker: testFormData.artNrParker || "",
    nenndurchfluss: testFormData.nenndurchfluss || "",
    snParker: testFormData.snParker || "",
    
    // Prüfbedingungen
    ventilOffsetOriginal: testFormData.ventilOffsetOriginal || "",
    ventilOffsetKorrektur: testFormData.ventilOffsetKorrektur || "",
    ventilOffsetNachKorrektur: testFormData.ventilOffsetNachKorrektur || "",
    druckVentil: testFormData.druckVentil || "",
    oeltemperatur: testFormData.oeltemperatur || ""
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

  // Filter out reference rows and convert to PDF format
  const voltageData = mappedResults
    .filter(result => result.rampType !== 'reference')
    .map(result => ({
      voltage: parseFloat(result.voltage.toFixed(2)),
      velocity: parseFloat(result.velocity.toFixed(2))
    }));

  // Add origin point if not present
  const hasOrigin = voltageData.some(point => point.voltage === 0 && point.velocity === 0);
  if (!hasOrigin) {
    voltageData.push({ voltage: 0.00, velocity: 0.00 });
  }

  // Sort by voltage for proper chart display
  return voltageData.sort((a, b) => a.voltage - b.voltage);
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
 * @returns {Object} System parameters for PDF
 */
export const mapSystemParameters = (speedCheckResults) => {
  if (!speedCheckResults) {
    throw new Error('Speed check results required for system parameters');
  }

  const slope = speedCheckResults.manualSlope || speedCheckResults.calculatedSlope;
  
  return {
    slopeValue: parseFloat(slope.toFixed(2)),
    speedAt03V: parseFloat((slope * 0.3).toFixed(3)),
    maxSpeedAt10V: parseFloat((slope * 10.0).toFixed(2))
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
 * Create complete PDF data package
 * @param {Object} reactData - Data from React app
 * @returns {Object} Complete PDF data package
 */
export const createPDFDataPackage = (reactData) => {
  const { testFormData, voltageData: mappedResults, speedCheckResults, regressionData } = reactData;

  // Transform all data
  const pdfData = {
    testFormData: mapTestFormData(testFormData),
    voltageData: mapVoltageData(mappedResults),
    speedCheckResults: mapSpeedCheckResults(speedCheckResults),
    systemParameters: mapSystemParameters(speedCheckResults),
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