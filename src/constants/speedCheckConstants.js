/**
 * Speed Check Analysis Constants
 * Machine types, speed limits, and analysis parameters
 */

// Machine type parameters (speed limits in mm/s)
export const MACHINE_TYPES = {
  'GAA100': { lower: 3.0, middle: 3.5, upper: 4.0, type: 'Stationary' },
  'GAAS80': { lower: 3.0, middle: 3.5, upper: 4.0, type: 'Stationary' },
  'GAA60': { lower: 3.0, middle: 3.5, upper: 4.0, type: 'Stationary' },
  'AMS60': { lower: 1.0, middle: 1.5, upper: 2.0, type: 'Mobile' },
  'AMS100': { lower: 1.0, middle: 1.5, upper: 2.0, type: 'Mobile' },
  'AMS200': { lower: 1.0, middle: 1.5, upper: 2.0, type: 'Mobile' }
};

// Target speeds for deviation analysis (0 to 10 mm/s in 0.5 steps)
export const TARGET_SPEEDS = [
  0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 
  5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0
];

// Voltage limit for regression analysis (B71 value)
export const VOLTAGE_LIMIT = 4.0;

// Manual slope factor range for UI controls
export const SLOPE_FACTOR_RANGE = {
  min: 0.5,
  max: 2.0,
  step: 0.01,
  default: 1.0
};

/**
 * Get machine parameters by type
 * @param {string} machineType - Machine type key
 * @returns {Object} Machine parameters or null
 */
export const getMachineParams = (machineType) => {
  return MACHINE_TYPES[machineType] || null;
};

/**
 * Get all available machine types
 * @returns {Array} Array of machine type keys
 */
export const getMachineTypes = () => {
  return Object.keys(MACHINE_TYPES);
};

/**
 * Get target speeds array
 * @returns {Array} Array of target speeds for analysis
 */
export const getTargetSpeeds = () => {
  return [...TARGET_SPEEDS];
};

/**
 * Validate machine type
 * @param {string} machineType - Machine type to validate
 * @returns {boolean} True if valid machine type
 */
export const isValidMachineType = (machineType) => {
  return MACHINE_TYPES.hasOwnProperty(machineType);
};