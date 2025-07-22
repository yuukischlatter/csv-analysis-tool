/**
 * UI Constants
 * Colors, spacing, typography, and styling constants for consistent UI
 */

// Color Palette
export const COLORS = {
  // Primary colors
  PRIMARY: '#007bff',
  SECONDARY: '#6c757d',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  ERROR: '#f44336',
  INFO: '#17a2b8',
  
  // Text colors
  TEXT_PRIMARY: '#333',
  TEXT_SECONDARY: '#666',
  TEXT_MUTED: '#999',
  TEXT_DISABLED: '#ccc',
  
  // Background colors
  BACKGROUND_PRIMARY: '#fff',
  BACKGROUND_SECONDARY: '#f8f9fa',
  BACKGROUND_LIGHT: '#fafafa',
  BACKGROUND_GRAY: '#f0f0f0',
  BACKGROUND_DARK: '#e8e8e8',
  
  // Border colors
  BORDER_DEFAULT: '#ddd',
  BORDER_LIGHT: '#eee',
  BORDER_FOCUS: '#007bff',
  
  // Status colors
  APPROVED: '#4CAF50',
  PENDING: '#666',
  MANUAL: 'orange',
  AUTOMATIC: 'green',
  FALLBACK: 'orange',
  
  // Alert backgrounds
  ERROR_BACKGROUND: '#ffebee',
  WARNING_BACKGROUND: '#fff3cd',
  SUCCESS_BACKGROUND: '#e8f5e8',
  INFO_BACKGROUND: '#e3f2fd',
  
  // Special UI colors
  DRAG_AREA: 'transparent',
  HOVER_BACKGROUND: '#e3f2fd',
  SELECTED_BACKGROUND: '#e3f2fd',
  
  // Voltage assignment colors
  VOLTAGE_POSITIVE: 'green',
  VOLTAGE_NEGATIVE: 'red',
  VOLTAGE_ZERO: '#333'
};

// Font Sizes
export const FONT_SIZES = {
  // Headers
  HEADER_LARGE: '24px',
  HEADER_MEDIUM: '18px',
  HEADER_SMALL: '16px',
  
  // Body text
  BODY_LARGE: '16px',
  BODY_DEFAULT: '14px',
  BODY_SMALL: '12px',
  BODY_TINY: '10px',
  
  // Form elements
  INPUT: '14px',
  LABEL: '14px',
  BUTTON: '14px',
  
  // Special contexts
  MONOSPACE: '14px',
  TABLE_HEADER: '14px',
  TABLE_CELL: '14px',
  TOOLTIP: '12px'
};

// Spacing (Padding & Margin)
export const SPACING = {
  // Base spacing units
  TINY: '5px',
  SMALL: '10px',
  MEDIUM: '15px',
  DEFAULT: '20px',
  LARGE: '30px',
  XLARGE: '40px',
  
  // Component-specific spacing
  CONTAINER_PADDING: '20px',
  SECTION_MARGIN: '30px',
  ELEMENT_MARGIN: '20px',
  INPUT_PADDING: '8px',
  BUTTON_PADDING: '10px 20px',
  HEADER_BOTTOM: '20px',
  
  // Grid spacing
  GRID_GAP: '15px',
  GRID_GAP_LARGE: '20px',
  
  // Form spacing
  FORM_ELEMENT_MARGIN: '15px',
  FORM_SECTION_MARGIN: '15px'
};

// Border Radius
export const BORDER_RADIUS = {
  SMALL: '3px',
  DEFAULT: '4px',
  LARGE: '8px',
  ROUND: '50%',
  PILL: '999px'
};

// Box Shadows
export const SHADOWS = {
  NONE: 'none',
  LIGHT: '0 1px 3px rgba(0,0,0,0.1)',
  DEFAULT: '0 2px 4px rgba(0,0,0,0.1)',
  MEDIUM: '0 4px 8px rgba(0,0,0,0.1)',
  HEAVY: '0 8px 16px rgba(0,0,0,0.1)'
};

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1010,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070
};

// Transitions
export const TRANSITIONS = {
  FAST: '0.1s ease',
  DEFAULT: '0.2s ease',
  SLOW: '0.3s ease',
  
  // Specific transitions
  COLOR: 'color 0.2s ease',
  BACKGROUND: 'background-color 0.2s ease',
  BORDER: 'border-color 0.2s ease',
  TRANSFORM: 'transform 0.2s ease',
  OPACITY: 'opacity 0.2s ease'
};

// Breakpoints (for responsive design)
export const BREAKPOINTS = {
  MOBILE: '480px',
  TABLET: '768px',
  DESKTOP: '1024px',
  LARGE: '1200px'
};

// Component-Specific Styles
export const COMPONENT_STYLES = {
  // Buttons
  BUTTON_DEFAULT: {
    padding: SPACING.BUTTON_PADDING,
    fontSize: FONT_SIZES.BUTTON,
    borderRadius: BORDER_RADIUS.DEFAULT,
    border: `1px solid ${COLORS.BORDER_DEFAULT}`,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    color: COLORS.TEXT_PRIMARY,
    cursor: 'pointer'
  },
  
  // Form inputs
  INPUT_DEFAULT: {
    padding: SPACING.INPUT_PADDING,
    fontSize: FONT_SIZES.INPUT,
    borderRadius: BORDER_RADIUS.DEFAULT,
    border: `1px solid ${COLORS.BORDER_DEFAULT}`,
    backgroundColor: COLORS.BACKGROUND_PRIMARY
  },
  
  // Cards/Containers
  CARD_DEFAULT: {
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    border: `1px solid ${COLORS.BORDER_DEFAULT}`,
    borderRadius: BORDER_RADIUS.DEFAULT,
    padding: SPACING.MEDIUM
  }
};

/**
 * Get color by semantic name or status
 * @param {string} colorName - Color identifier
 * @param {string} variant - Color variant (e.g., 'background', 'border')
 * @returns {string} Color value
 */
export const getColor = (colorName, variant = null) => {
  if (variant) {
    const variantKey = `${colorName.toUpperCase()}_${variant.toUpperCase()}`;
    return COLORS[variantKey] || COLORS[colorName.toUpperCase()] || COLORS.TEXT_PRIMARY;
  }
  return COLORS[colorName.toUpperCase()] || COLORS.TEXT_PRIMARY;
};

/**
 * Get spacing value by size name
 * @param {string} sizeName - Spacing size identifier
 * @returns {string} Spacing value
 */
export const getSpacing = (sizeName = 'DEFAULT') => {
  return SPACING[sizeName.toUpperCase()] || SPACING.DEFAULT;
};

/**
 * Generate status-based styling
 * @param {boolean} isApproved - Approval status
 * @param {boolean} isManual - Manual adjustment status
 * @returns {Object} Style object
 */
export const getStatusStyles = (isApproved = false, isManual = false) => {
  let color = COLORS.PENDING;
  
  if (isApproved) {
    color = isManual ? COLORS.MANUAL : COLORS.APPROVED;
  }
  
  return {
    color,
    fontWeight: 'bold'
  };
};

/**
 * Generate hover styles for interactive elements
 * @param {string} baseColor - Base background color
 * @returns {Object} Hover styles
 */
export const getHoverStyles = (baseColor = COLORS.BACKGROUND_SECONDARY) => {
  return {
    backgroundColor: baseColor,
    transition: TRANSITIONS.BACKGROUND,
    ':hover': {
      backgroundColor: COLORS.HOVER_BACKGROUND
    }
  };
};