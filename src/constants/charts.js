/**
 * Chart Constants
 * Dimensions, styling, and configuration for all chart components
 */

// Standard Chart Dimensions
export const CHART_DIMENSIONS = {
  // Default chart sizes
  DEFAULT: { width: 800, height: 400 },
  
  // Regression chart
  REGRESSION: { width: 800, height: 400 },
  
  // Speed check charts
  SPEED_CHECK_MAIN: { width: 1100, height: 500 },
  SPEED_CHECK_DUAL: { width: 1100, height: 550 },
  
  // Line chart (dual slope)
  DUAL_LINE: { width: 800, height: 400 },
  
  // Container chart
  CONTAINER: { width: 800, height: 400 }
};

// Chart Margins
export const CHART_MARGINS = {
  DEFAULT: { top: 20, right: 30, bottom: 40, left: 60 },
  LARGE: { top: 20, right: 30, bottom: 60, left: 80 },
  SPEED_CHECK: { top: 50, right: 20, bottom: 70, left: 80 },
  OVERVIEW: { top: 50, right: 20, bottom: 70, left: 60 }
};

// Chart Colors
export const CHART_COLORS = {
  // Line colors
  DATA_LINE: '#333',
  CALCULATED_LINE: 'blue',
  MANUAL_LINE: 'red',
  REGRESSION_LINE: 'red',
  SMOOTH_CURVE: 'black',
  
  // Ramp colors
  RAMP_UP: 'green',
  RAMP_DOWN: 'red',
  
  // Data points
  DATA_POINTS: 'black',
  DATA_POINTS_BORDER: 'white',
  OVERVIEW_POINTS: 'black',
  
  // Grid and axes
  GRID_LINES: '#ccc',
  AXES: 'black',
  
  // Speed limit lines
  SPEED_LIMIT_LOWER: 'lightgreen',
  SPEED_LIMIT_MIDDLE: 'green',
  SPEED_LIMIT_UPPER: 'lightgreen',
  
  // Reference lines
  ZERO_LINE: '#999',
  
  // Chart backgrounds
  CHART_BACKGROUND: 'white',
  RAMP_UP_AREA: 'green',
  RAMP_DOWN_AREA: 'red'
};

// Chart Stroke Widths
export const STROKE_WIDTHS = {
  DATA_LINE: 1.5,
  REGRESSION_LINES: 2,
  DATA_POINTS_BORDER: 1,
  GRID_LINES: 1,
  SPEED_LIMIT_LINES: 1,
  MARKER_LINES: 2,
  REFERENCE_LINES: 1,
  CHART_AXES: 1
};

// Chart Opacities
export const CHART_OPACITIES = {
  RAMP_AREAS: 0.1,
  MARKER_LINES: 0.8,
  REFERENCE_LINES: 0.5,
  GRID_LINES: 0.3,
  OVERVIEW_POINTS: 0.7,
  LEGEND_BACKGROUND: 0.9
};

// Chart Font Sizes
export const CHART_FONTS = {
  TITLE: '16px',
  AXIS_LABELS: '14px',
  TICK_LABELS: '12px',
  LEGEND_TEXT: '10px',
  DEVIATION_LABELS: '8px',
  SPEED_LIMIT_LABELS: '10px',
  MARKER_LABELS: '10px'
};

// Marker and Point Sizes
export const CHART_SIZES = {
  DATA_POINTS: 3,
  OVERVIEW_POINTS: 2,
  INTERSECTION_DOTS: 4,
  MARKER_DRAG_AREA: 20,
  LEGEND_LINE_LENGTH: 15,
  SYMBOL_SIZE: 64
};

// Chart Animation Settings
export const ANIMATION = {
  TRANSITION_DURATION: 200, // milliseconds
  MARKER_TRANSITION: '0.2s ease',
  HOVER_TRANSITION: 'background-color 0.2s'
};

// Grid Configuration
export const GRID_CONFIG = {
  STROKE_DASHARRAY: '3,3',
  MAJOR_TICK_SIZE: -10,
  MINOR_TICK_SIZE: -5,
  TICK_PADDING: 5
};

// Chart Responsive Breakpoints
export const RESPONSIVE = {
  MIN_CHART_WIDTH: 300,
  MIN_CHART_HEIGHT: 200,
  CONTAINER_PADDING: 20,
  MOBILE_WIDTH_THRESHOLD: 768
};

/**
 * Get chart dimensions for specific chart type
 * @param {string} chartType - Type of chart
 * @returns {Object} Chart dimensions {width, height}
 */
export const getChartDimensions = (chartType = 'DEFAULT') => {
  return CHART_DIMENSIONS[chartType] || CHART_DIMENSIONS.DEFAULT;
};

/**
 * Get chart margins for specific context
 * @param {string} marginType - Type of margins needed
 * @returns {Object} Margin object {top, right, bottom, left}
 */
export const getChartMargins = (marginType = 'DEFAULT') => {
  return CHART_MARGINS[marginType] || CHART_MARGINS.DEFAULT;
};

/**
 * Calculate responsive chart width
 * @param {number} containerWidth - Container width
 * @param {number} padding - Padding to subtract
 * @returns {number} Calculated chart width
 */
export const calculateResponsiveWidth = (containerWidth, padding = RESPONSIVE.CONTAINER_PADDING) => {
  const calculatedWidth = containerWidth - padding;
  return Math.max(calculatedWidth, RESPONSIVE.MIN_CHART_WIDTH);
};

/**
 * Get color for chart element type
 * @param {string} elementType - Type of chart element
 * @param {string} rampType - Ramp type ('up' or 'down') for ramp-specific colors
 * @returns {string} Color value
 */
export const getChartColor = (elementType, rampType = null) => {
  if (rampType && (elementType.includes('RAMP') || elementType.includes('ramp'))) {
    return rampType === 'up' ? CHART_COLORS.RAMP_UP : CHART_COLORS.RAMP_DOWN;
  }
  return CHART_COLORS[elementType] || CHART_COLORS.DATA_LINE;
};