/**
 * Validation Constants
 * Rules and limits for data validation across the application
 */

// File Validation Rules
export const FILE_VALIDATION = {
  // CSV file requirements
  MIN_COLUMNS: 4,                    // Minimum columns required in CSV
  MAX_FILE_SIZE_MB: 50,             // Maximum file size in megabytes
  ALLOWED_EXTENSIONS: ['.csv'],      // Allowed file extensions
  ENCODING: 'utf-8',                // Expected file encoding
  
  // Data requirements
  MIN_DATA_POINTS: 10,              // Minimum data points for analysis
  MAX_DATA_POINTS: 100000,          // Maximum data points to prevent memory issues
  
  // Column indices (0-based)
  TIME_COLUMN: 0,                   // Time data column index
  POSITION_COLUMN: 3,               // Position data column index
  POSITION_MULTIPLIER: 10,
  
  // Data format requirements
  REQUIRED_NUMERIC_COLUMNS: [0, 3], // Columns that must contain numeric data
  ALLOW_EMPTY_ROWS: false,          // Whether to allow empty rows
  SKIP_HEADER_ROWS: 0               // Number of header rows to skip
};

// Data Range Validation
export const DATA_RANGES = {
  // Time validation
  TIME: {
    MIN: 0,                         // Minimum time value (seconds)
    MAX: 3600,                      // Maximum time value (1 hour)
    MUST_BE_INCREASING: true        // Time values must be monotonically increasing
  },
  
  // Position validation  
  POSITION: {
    MIN: -1000,                     // Minimum position value (mm)
    MAX: 1000,                      // Maximum position value (mm)
    PRECISION: 3                    // Decimal places for position values
  },
  
  // Velocity validation
  VELOCITY: {
    MIN: -100,                      // Minimum velocity (mm/s)
    MAX: 100,                       // Maximum velocity (mm/s)
    PRECISION: 6                    // Decimal places for velocity values
  },
  
  // Voltage validation
  VOLTAGE: {
    MIN: -10.0,                     // Minimum voltage value
    MAX: 10.0,                      // Maximum voltage value
    PRECISION: 2,                   // Decimal places for voltage values
    FORBIDDEN_VALUES: []            // Values that are not allowed
  },
  
  // Duration validation
  DURATION: {
    MIN: 0.1,                       // Minimum analysis duration (seconds)
    MAX: 300,                       // Maximum analysis duration (5 minutes)
    PRECISION: 3                    // Decimal places for duration values
  }
};

// Form Validation Rules
export const FORM_VALIDATION = {
  // Required fields
  REQUIRED_FIELDS: [
    'maschinentyp',                 // Machine type is always required
  ],
  
  // Optional but recommended fields
  RECOMMENDED_FIELDS: [
    'auftragsNr',
    'pruefer',
    'datum'
  ],
  
  // Field length limits
  FIELD_LENGTHS: {
    auftragsNr: { min: 1, max: 50 },
    pruefer: { min: 1, max: 100 },
    snParker: { min: 1, max: 50 }
  },
  
  // Date validation
  DATE: {
    MIN_YEAR: 2020,
    MAX_YEAR: 2030,
    FORMAT: 'YYYY-MM-DD'
  },
  
  // Numeric field validation
  NUMERIC_FIELDS: {
    ventilOffsetOriginal: { min: -10, max: 10, step: 0.01 },
    ventilOffsetKorrektur: { min: -100, max: 100, step: 0.1 },
    ventilOffsetNachKorrektur: { min: -10, max: 10, step: 0.01 },
    druckVentil: { min: 0, max: 1000, step: 0.1 },
    oeltemperatur: { min: 0, max: 100, step: 0.1 }
  }
};

// Analysis Validation Rules
export const ANALYSIS_VALIDATION = {
  // Slope detection validation
  SLOPE_DETECTION: {
    MIN_RAMP_DURATION: 5,           // Minimum ramp duration (seconds)
    MAX_RAMP_DURATION: 120,         // Maximum ramp duration (seconds)
    MIN_DISTANCE_BETWEEN_RAMPS: 5,  // Minimum time between ramps (seconds)
    MIN_VELOCITY_CHANGE: 0.01       // Minimum velocity change to be significant
  },
  
  // Regression validation
  REGRESSION: {
    MIN_POINTS: 2,                  // Minimum points for regression (including origin)
    MAX_POINTS: 100,                // Maximum points for regression
    MIN_R_SQUARED: 0.0,             // Minimum acceptable R² value (0 = no minimum)
    MAX_RESIDUAL: Infinity          // Maximum acceptable residual
  },
  
  // Speed check validation
  SPEED_CHECK: {
    MIN_SLOPE: 0.001,               // Minimum acceptable slope value
    MAX_SLOPE: 100,                 // Maximum acceptable slope value
    MIN_FACTOR: 0.5,                // Minimum slope adjustment factor
    MAX_FACTOR: 2.0,                // Maximum slope adjustment factor
    MAX_DEVIATION: 50               // Maximum acceptable deviation percentage
  },
  
  // Voltage assignment validation
  VOLTAGE_ASSIGNMENT: {
    MIN_ASSIGNMENTS: 1,             // Minimum voltage assignments needed
    MAX_ASSIGNMENTS: 16,            // Maximum voltage assignments allowed
    UNIQUE_VOLTAGES: true,          // Each voltage can only be assigned once
    REQUIRE_APPROVAL: true          // Assignments must be approved
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  // File validation errors
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type. Only CSV files are allowed',
  INSUFFICIENT_COLUMNS: 'CSV file must have at least 4 columns',
  INSUFFICIENT_DATA: 'File must contain at least 10 data points',
  INVALID_TIME_DATA: 'Time values must be numeric and increasing',
  INVALID_POSITION_DATA: 'Position values must be numeric',
  
  // Form validation errors
  REQUIRED_FIELD: 'This field is required',
  INVALID_DATE: 'Please enter a valid date',
  VALUE_TOO_SMALL: 'Value is below minimum allowed',
  VALUE_TOO_LARGE: 'Value exceeds maximum allowed',
  INVALID_NUMBER: 'Please enter a valid number',
  
  // Analysis validation errors
  RAMP_TOO_SHORT: 'Analysis ramp duration is too short',
  RAMP_TOO_LONG: 'Analysis ramp duration is too long',
  INSUFFICIENT_VELOCITY_CHANGE: 'Insufficient velocity change detected',
  INVALID_REGRESSION: 'Unable to calculate valid regression',
  SLOPE_OUT_OF_RANGE: 'Calculated slope is out of acceptable range',
  
  // Voltage assignment errors
  DUPLICATE_VOLTAGE: 'This voltage has already been assigned',
  NO_VOLTAGES_AVAILABLE: 'No voltage assignments available',
  APPROVAL_REQUIRED: 'File must be approved before voltage assignment'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  FILE_PROCESSED: 'File processed successfully',
  ANALYSIS_COMPLETE: 'Analysis completed successfully',
  VOLTAGE_ASSIGNED: 'Voltage assigned successfully',
  EXPORT_COMPLETE: 'Data exported successfully',
  FORM_SAVED: 'Form data saved successfully'
};

/**
 * Validate file data structure
 * @param {Array} data - Parsed CSV data
 * @param {string} fileName - Name of the file being validated
 * @returns {Object} Validation result {isValid: boolean, error: string}
 */
export const validateFileData = (data, fileName) => {
  if (!data || data.length === 0) {
    return { isValid: false, error: `No data found in ${fileName}` };
  }
  
  if (data.length < FILE_VALIDATION.MIN_DATA_POINTS) {
    return { 
      isValid: false, 
      error: `${fileName} must contain at least ${FILE_VALIDATION.MIN_DATA_POINTS} data points` 
    };
  }
  
  // Check first row has enough columns
  const firstRow = data[0];
  if (!Array.isArray(firstRow) || firstRow.length < FILE_VALIDATION.MIN_COLUMNS) {
    return { 
      isValid: false, 
      error: `${fileName} must have at least ${FILE_VALIDATION.MIN_COLUMNS} columns` 
    };
  }
  
  return { isValid: true };
};

/**
 * Validate numeric value within specified range
 * @param {number} value - Value to validate
 * @param {string} fieldType - Type of field being validated
 * @returns {Object} Validation result {isValid: boolean, error: string}
 */
export const validateNumericRange = (value, fieldType) => {
  const range = DATA_RANGES[fieldType.toUpperCase()];
  if (!range) {
    return { isValid: true }; // No validation rules for this field type
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
  }
  
  if (value < range.MIN) {
    return { isValid: false, error: `${ERROR_MESSAGES.VALUE_TOO_SMALL} (minimum: ${range.MIN})` };
  }
  
  if (value > range.MAX) {
    return { isValid: false, error: `${ERROR_MESSAGES.VALUE_TOO_LARGE} (maximum: ${range.MAX})` };
  }
  
  return { isValid: true };
};

/**
 * Validate form field value
 * @param {string} fieldName - Name of the form field
 * @param {any} value - Field value
 * @returns {Object} Validation result {isValid: boolean, error: string}
 */
export const validateFormField = (fieldName, value) => {
  // Check if field is required
  if (FORM_VALIDATION.REQUIRED_FIELDS.includes(fieldName)) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
    }
  }
  
  // Check field length limits
  const lengthLimits = FORM_VALIDATION.FIELD_LENGTHS[fieldName];
  if (lengthLimits && typeof value === 'string') {
    if (value.length < lengthLimits.min) {
      return { isValid: false, error: `Minimum ${lengthLimits.min} characters required` };
    }
    if (value.length > lengthLimits.max) {
      return { isValid: false, error: `Maximum ${lengthLimits.max} characters allowed` };
    }
  }
  
  // Check numeric field validation
  const numericRules = FORM_VALIDATION.NUMERIC_FIELDS[fieldName];
  if (numericRules && value !== '' && value !== null && value !== undefined) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
    }
    
    if (numValue < numericRules.min || numValue > numericRules.max) {
      return { 
        isValid: false, 
        error: `Value must be between ${numericRules.min} and ${numericRules.max}` 
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Check if value is within acceptable deviation limits
 * @param {number} deviation - Deviation percentage
 * @returns {boolean} True if deviation is acceptable
 */
export const isDeviationAcceptable = (deviation) => {
  return Math.abs(deviation) <= ANALYSIS_VALIDATION.SPEED_CHECK.MAX_DEVIATION;
};