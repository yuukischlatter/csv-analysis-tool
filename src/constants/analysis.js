/**
 * Analysis Constants
 * Parameters and thresholds for slope detection and data analysis
 */

// Slope Detection Parameters
export const SLOPE_DETECTION = {
  BUFFER_SECONDS: 5,           // Move markers inward by 5 seconds
  MIN_RAMP_SECONDS: 5,         // Minimum 5 seconds per ramp
  MIN_GAP_SECONDS: 6,          // Minimum 6 seconds between ramps
  VELOCITY_THRESHOLD: 0.1,     // mm/s - velocity threshold for transitions
  SMOOTHING_WINDOW_SIZE: 5,    // Data points for moving average smoothing
  MIN_MARKER_DISTANCE: 5       // Minimum distance between markers (data points)
};

// Data Validation Parameters
export const DATA_VALIDATION = {
  MIN_DATA_POINTS: 10,         // Minimum data points required for analysis
  MIN_COLUMNS_REQUIRED: 4,     // Minimum CSV columns required
  MIN_REGRESSION_POINTS: 2,    // Minimum points for regression calculation
  TIME_COLUMN_INDEX: 0,        // CSV column index for time data
  POSITION_COLUMN_INDEX: 3,    // CSV column index for position data (0-based)
  POSITION_MULTIPLIER: 10      // Multiply position values by 10
};

// Speed Check Analysis Parameters
export const SPEED_CHECK = {
  TARGET_SPEEDS: [
    0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 
    5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0
  ],
  SLOPE_FACTOR_RANGE: {
    min: 0.5,
    max: 2.0,
    step: 0.01,
    default: 1.0
  },
  DEVIATION_THRESHOLDS: {
    GOOD: 2,        // ≤ 2% deviation is good (green)
    WARNING: 5,     // ≤ 5% deviation is warning (yellow)
    ERROR: Infinity // > 5% deviation is error (red)
  }
};

// Regression Analysis Parameters
export const REGRESSION = {
  MIN_POINTS_WITH_ORIGIN: 1,   // Minimum points needed (origin added automatically)
  REGRESSION_PRECISION: 4,      // Decimal places for slope calculation
  CURVE_INTERPOLATION_POINTS: 100, // Points for smooth curve generation
  DYNAMIC_Y_BUFFER: 2          // Buffer in mm/s for dynamic Y-scale
};

// Fallback Analysis Percentages (when auto-detection fails)
export const FALLBACK_PERCENTAGES = {
  RAMP_UP_START: 0.1,    // 10% of data length
  RAMP_UP_END: 0.4,      // 40% of data length
  RAMP_DOWN_START: 0.6,  // 60% of data length
  RAMP_DOWN_END: 0.9     // 90% of data length
};

// Analysis Precision Settings
export const PRECISION = {
  VELOCITY: 6,        // Decimal places for velocity values
  TIME: 3,           // Decimal places for time values
  POSITION: 3,       // Decimal places for position values
  PERCENTAGE: 1,     // Decimal places for percentage values
  REGRESSION_SLOPE: 4 // Decimal places for regression slopes
};

/**
 * Get analysis parameters for specific detection method
 * @param {string} method - Detection method ('automatic', 'manual', 'fallback')
 * @returns {Object} Analysis parameters
 */
export const getAnalysisParams = (method = 'automatic') => {
  const baseParams = {
    bufferSeconds: SLOPE_DETECTION.BUFFER_SECONDS,
    minRampSeconds: SLOPE_DETECTION.MIN_RAMP_SECONDS,
    velocityThreshold: SLOPE_DETECTION.VELOCITY_THRESHOLD
  };

  switch (method) {
    case 'fallback':
      return {
        ...baseParams,
        usePercentages: true,
        percentages: FALLBACK_PERCENTAGES
      };
    case 'manual':
      return {
        ...baseParams,
        allowManualAdjustment: true,
        minMarkerDistance: SLOPE_DETECTION.MIN_MARKER_DISTANCE
      };
    default:
      return baseParams;
  }
};

/**
 * Validate analysis result precision
 * @param {number} value - Value to format
 * @param {string} type - Type of value ('velocity', 'time', 'position', etc.)
 * @returns {string} Formatted value string
 */
export const formatAnalysisValue = (value, type) => {
  const precision = PRECISION[type.toUpperCase()] || 3;
  return parseFloat(value).toFixed(precision);
};

/**
 * Check if deviation is within acceptable limits
 * @param {number} deviation - Deviation percentage
 * @returns {string} Deviation category ('good', 'warning', 'error')
 */
export const getDeviationCategory = (deviation) => {
  const absDeviation = Math.abs(deviation);
  
  if (absDeviation <= SPEED_CHECK.DEVIATION_THRESHOLDS.GOOD) return 'good';
  if (absDeviation <= SPEED_CHECK.DEVIATION_THRESHOLDS.WARNING) return 'warning';
  return 'error';
};