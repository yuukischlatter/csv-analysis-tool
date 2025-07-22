/**
 * Default Values
 * Default configurations and initial values for forms and components
 */

// Default Form Values
export const DEFAULT_FORM_VALUES = {
  // Auftragsdaten (Order Data)
  auftragsNr: '',
  maschinentyp: 'GAA100',          // Default to most common machine type
  
  // Prüfung (Testing)
  pruefer: '',
  datum: '',                       // Will be set to current date when form loads
  
  // Regelventil (Control Valve)
  artNrSCH: '',
  artNrParker: '',                 // Auto-filled from ventil selection
  nenndurchfluss: '',              // Auto-filled from ventil selection
  snParker: '',
  
  // Prüfbedingungen (Test Conditions)
  ventilOffsetOriginal: '',
  ventilOffsetKorrektur: '',
  ventilOffsetNachKorrektur: '',
  druckVentil: '',
  oeltemperatur: ''
};

// Default Test Conditions (Recommended Values)
export const RECOMMENDED_TEST_CONDITIONS = {
  // Voltage offset tolerances
  ventilOffsetTolerance: {
    original: { min: -0.05, max: 0.05, unit: 'V', note: '± 0.05V I.O.' },
    nachKorrektur: { min: -0.02, max: 0.02, unit: 'V', note: '± 0.02V I.O.' }
  },
  
  // Temperature settings
  oeltemperatur: {
    target: 50,
    tolerance: 5,
    unit: '°C',
    note: '50 ± 5°C I.O. (Hinweis: Nullpunkt kann um 10°C zu 0.20% driften, entspricht zu 0.01V UEQ)'
  },
  
  // Pressure settings (typical values)
  druckVentil: {
    typical: 200,
    range: [150, 300],
    unit: 'Bar',
    note: 'Typical working pressure range'
  }
};

// Default Analysis Settings
export const DEFAULT_ANALYSIS_SETTINGS = {
  // Chart configurations
  chartDimensions: {
    width: 800,
    height: 400
  },
  
  // Speed check settings
  speedCheck: {
    slopeFactor: 1.0,
    machineType: 'GAA100',
    voltageRange: [0, 4.0]
  },
  
  // Regression settings
  regression: {
    includeOrigin: true,
    voltageLimit: 4.0,
    precision: 4
  },
  
  // Export settings
  export: {
    includeTestData: true,
    includeStatistics: true,
    csvSeparator: ';',
    dateFormat: 'DD.MM.YYYY'
  }
};

// Default UI Settings
export const DEFAULT_UI_SETTINGS = {
  // Form behavior
  form: {
    isCollapsed: false,
    autoSave: false,
    validateOnChange: true
  },
  
  // Analysis behavior
  analysis: {
    autoSelectFirstFile: true,
    autoApproveAutoDetected: false,
    showAllCharts: true
  },
  
  // Display preferences
  display: {
    showGridLines: true,
    showDeviationLabels: true,
    showSpeedLimits: true,
    chartTheme: 'light'
  }
};

// Default Validation Tolerances
export const DEFAULT_TOLERANCES = {
  // Measurement tolerances
  measurement: {
    velocityPrecision: 6,
    timePrecision: 3,
    positionPrecision: 3,
    voltagePrecision: 2
  },
  
  // Analysis tolerances
  analysis: {
    minRampDuration: 5,           // seconds
    maxAllowedDeviation: 10,      // percent
    regressionMinPoints: 2,
    velocityThreshold: 0.1        // mm/s
  },
  
  // Quality thresholds
  quality: {
    goodDeviation: 2,             // ≤ 2% is good
    acceptableDeviation: 5,       // ≤ 5% is acceptable
    warningDeviation: 10          // > 10% is problematic
  }
};

// Default File Processing Settings
export const DEFAULT_FILE_SETTINGS = {
  // CSV processing
  csv: {
    delimiter: ',',
    skipEmptyLines: true,
    dynamicTyping: true,
    header: false,
    encoding: 'utf-8'
  },
  
  // File validation
  validation: {
    maxFileSize: 50,              // MB
    allowedExtensions: ['.csv'],
    minDataPoints: 10,
    requiredColumns: 4
  },
  
  // Processing options
  processing: {
    autoDetectSlopes: true,
    useFallbackOnFailure: true,
    smoothingWindow: 5,
    bufferSeconds: 5
  }
};

/**
 * Get default form values with current date
 * @returns {Object} Form default values with current date set
 */
export const getDefaultFormValues = () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return {
    ...DEFAULT_FORM_VALUES,
    datum: today
  };
};

/**
 * Get recommended value for a test condition
 * @param {string} condition - Test condition name
 * @returns {any} Recommended value or null if not found
 */
export const getRecommendedValue = (condition) => {
  const recommendation = RECOMMENDED_TEST_CONDITIONS[condition];
  if (!recommendation) return null;
  
  return recommendation.target || recommendation.typical || null;
};

/**
 * Get tolerance information for a test condition
 * @param {string} condition - Test condition name
 * @returns {Object|null} Tolerance information or null if not found
 */
export const getToleranceInfo = (condition) => {
  return RECOMMENDED_TEST_CONDITIONS[condition] || null;
};

/**
 * Get default settings for a specific component
 * @param {string} component - Component name ('analysis', 'ui', 'file', etc.)
 * @returns {Object} Default settings for component
 */
export const getDefaultSettings = (component) => {
  const settingsMap = {
    analysis: DEFAULT_ANALYSIS_SETTINGS,
    ui: DEFAULT_UI_SETTINGS,
    file: DEFAULT_FILE_SETTINGS,
    form: DEFAULT_FORM_VALUES
  };
  
  return settingsMap[component] || {};
};

/**
 * Check if a value is within recommended tolerances
 * @param {string} condition - Test condition name
 * @param {number} value - Value to check
 * @returns {boolean} True if value is within tolerances
 */
export const isWithinTolerance = (condition, value) => {
  const recommendation = RECOMMENDED_TEST_CONDITIONS[condition];
  if (!recommendation || typeof value !== 'number') return false;
  
  if (recommendation.tolerance) {
    const target = recommendation.target;
    const tolerance = recommendation.tolerance;
    return value >= (target - tolerance) && value <= (target + tolerance);
  }
  
  if (recommendation.range) {
    const [min, max] = recommendation.range;
    return value >= min && value <= max;
  }
  
  if (recommendation.min !== undefined && recommendation.max !== undefined) {
    return value >= recommendation.min && value <= recommendation.max;
  }
  
  return true; // No specific tolerance defined
};

/**
 * Get default machine type based on usage statistics
 * @returns {string} Most commonly used machine type
 */
export const getDefaultMachineType = () => {
  return DEFAULT_FORM_VALUES.maschinentyp;
};

/**
 * Get default voltage assignment for new files
 * @param {Array} availableVoltages - Array of available voltage magnitudes
 * @returns {number|null} Suggested voltage assignment or null
 */
export const getDefaultVoltageAssignment = (availableVoltages = []) => {
  if (availableVoltages.length === 0) return null;
  
  // Suggest lowest available voltage
  return Math.min(...availableVoltages);
};

/**
 * Generate default filename for export
 * @param {Object} testFormData - Test form data
 * @param {string} type - Export type ('voltage_mapping', 'analysis', etc.)
 * @returns {string} Generated filename
 */
export const generateDefaultFilename = (testFormData = {}, type = 'analysis') => {
  const date = new Date().toISOString().split('T')[0];
  const auftragsNr = testFormData.auftragsNr || 'UNKNOWN';
  const maschinentyp = testFormData.maschinentyp || 'UNKNOWN';
  
  const typeMap = {
    voltage_mapping: 'Ventil_Analyse_UserAssigned',
    speed_check: 'Speed_Check_Analysis',
    regression: 'Regression_Analysis',
    analysis: 'CSV_Analysis'
  };
  
  const prefix = typeMap[type] || 'Export';
  return `${prefix}_${auftragsNr}_${maschinentyp}_${date}.csv`;
};

/**
 * Get default CSV export settings
 * @returns {Object} CSV export configuration
 */
export const getDefaultCSVSettings = () => {
  return {
    separator: DEFAULT_ANALYSIS_SETTINGS.export.csvSeparator,
    includeHeaders: true,
    includeTestData: DEFAULT_ANALYSIS_SETTINGS.export.includeTestData,
    includeStatistics: DEFAULT_ANALYSIS_SETTINGS.export.includeStatistics,
    dateFormat: DEFAULT_ANALYSIS_SETTINGS.export.dateFormat,
    encoding: 'utf-8'
  };
};

/**
 * Get default chart configuration for a specific chart type
 * @param {string} chartType - Type of chart
 * @returns {Object} Chart configuration
 */
export const getDefaultChartConfig = (chartType = 'default') => {
  const baseConfig = {
    width: DEFAULT_ANALYSIS_SETTINGS.chartDimensions.width,
    height: DEFAULT_ANALYSIS_SETTINGS.chartDimensions.height,
    showGrid: DEFAULT_UI_SETTINGS.display.showGridLines,
    showDeviations: DEFAULT_UI_SETTINGS.display.showDeviationLabels,
    theme: DEFAULT_UI_SETTINGS.display.chartTheme
  };
  
  // Chart-specific configurations
  const chartConfigs = {
    regression: {
      ...baseConfig,
      includeOrigin: DEFAULT_ANALYSIS_SETTINGS.regression.includeOrigin,
      voltageLimit: DEFAULT_ANALYSIS_SETTINGS.regression.voltageLimit
    },
    speedcheck: {
      ...baseConfig,
      width: 1100,
      height: 550,
      showSpeedLimits: DEFAULT_UI_SETTINGS.display.showSpeedLimits
    },
    dual: {
      ...baseConfig,
      allowDragging: true,
      showRampAreas: true
    }
  };
  
  return chartConfigs[chartType] || baseConfig;
};