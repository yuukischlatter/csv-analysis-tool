/**
 * Voltage Constants
 * All voltage-related constants and configurations
 */

// Available voltage magnitudes for assignment (removed 0V)
export const AVAILABLE_VOLTAGES = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 9.0, 10.0
];

// Complete voltage scale for mapping (includes negative values)
export const VOLTAGE_SCALE = [
  -10.00, -9.00, -7.00, -5.00, -4.00, -3.00, -2.50, -2.00,
  -1.50, -1.00, -0.75, -0.50, -0.40, -0.30, -0.20, -0.10,
  0.00,
  0.10, 0.20, 0.30, 0.40, 0.50, 0.75, 1.00,
  1.50, 2.00, 2.50, 3.00, 4.00, 5.00, 7.00, 9.00, 10.00
];

// Voltage ranges for different analysis contexts
export const VOLTAGE_RANGES = {
  FULL: { min: -10.0, max: 10.0 },
  REGRESSION: { min: 0.0, max: 4.0 },
  SPEED_CHECK: { min: 0.0, max: 4.5 },
  OVERVIEW: { min: 0.0, max: 11.0 }
};

// Voltage limit for regression analysis (B71 value)
export const VOLTAGE_LIMIT = 4.0;

// Voltage precision for formatting
export const VOLTAGE_PRECISION = 2;

/**
 * Format voltage for display
 * @param {number} voltage - Voltage value
 * @returns {string} Formatted voltage string
 */
export const formatVoltage = (voltage) => {
  if (voltage === 0) {
    return '0V';
  }
  return voltage > 0 ? `+${voltage.toFixed(VOLTAGE_PRECISION)}V` : `${voltage.toFixed(VOLTAGE_PRECISION)}V`;
};

/**
 * Format voltage magnitude for display (always shows ± for non-zero)
 * @param {number} voltage - Voltage magnitude
 * @returns {string} Formatted voltage string
 */
export const formatVoltageMagnitude = (voltage) => {
  if (voltage === 0) {
    return '0V';
  }
  return `±${voltage}V`;
};

/**
 * Get available voltage magnitudes excluding already assigned ones
 * @param {Set} assignedVoltages - Set of already assigned voltage magnitudes
 * @returns {Array} Array of available voltage magnitudes
 */
export const getAvailableVoltages = (assignedVoltages = new Set()) => {
  return AVAILABLE_VOLTAGES.filter(voltage => !assignedVoltages.has(voltage));
};

/**
 * Validate voltage value is within acceptable range
 * @param {number} voltage - Voltage to validate
 * @returns {boolean} True if voltage is valid
 */
export const isValidVoltage = (voltage) => {
  return voltage >= VOLTAGE_RANGES.FULL.min && voltage <= VOLTAGE_RANGES.FULL.max;
};