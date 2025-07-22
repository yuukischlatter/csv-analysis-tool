/**
 * Ventil Data
 * Parker valve mappings and specifications
 * Moved from ventilMapping.js for better organization
 */

// Ventil to Parker Part Number Mappings
export const VENTIL_MAPPINGS = {
  '1225853': {
    schArtNr: '1225853',
    label: '1225853 (Unterdeckung)',
    parkerArtNr: 'D1FP E55M H 9 N B 7 0',
    nenndurchfluss: 'Qn = 32 l/min',
    flowRate: 32,              // l/min (numeric for calculations)
    series: 'D1FP',
    size: 'E55M',
    variant: 'Unterdeckung',
    description: 'Parker D1FP valve with 32 l/min flow rate'
  },
  
  '1109774': {
    schArtNr: '1109774',
    label: '1109774',
    parkerArtNr: 'D1FP E50F H 9 N B 7 0',
    nenndurchfluss: 'Qn = 12 l/min',
    flowRate: 12,
    series: 'D1FP',
    size: 'E50F',
    variant: 'Standard',
    description: 'Parker D1FP valve with 12 l/min flow rate'
  },
  
  '1103015': {
    schArtNr: '1103015',
    label: '1103015',
    parkerArtNr: 'D1FP E50H J 9 N B 7 0',
    nenndurchfluss: 'Qn = 25 l/min',
    flowRate: 25,
    series: 'D1FP',
    size: 'E50H',
    variant: 'Standard',
    description: 'Parker D1FP valve with 25 l/min flow rate'
  },
  
  '1102710': {
    schArtNr: '1102710',
    label: '1102710',
    parkerArtNr: 'D1FP E50H H 9 N B 7 0',
    nenndurchfluss: 'Qn = 25 l/min',
    flowRate: 25,
    series: 'D1FP',
    size: 'E50H',
    variant: 'Alternative',
    description: 'Parker D1FP valve with 25 l/min flow rate (alternative)'
  },
  
  '1022508': {
    schArtNr: '1022508',
    label: '1022508',
    parkerArtNr: 'D1FP E50M H 9 N B 7 0',
    nenndurchfluss: 'Qn = 32 l/min',
    flowRate: 32,
    series: 'D1FP',
    size: 'E50M',
    variant: 'Standard',
    description: 'Parker D1FP valve with 32 l/min flow rate'
  }
};

// Flow Rate Categories
export const FLOW_RATE_CATEGORIES = {
  LOW: {
    range: [0, 15],
    description: 'Low flow rate valves',
    ventils: ['1109774']
  },
  
  MEDIUM: {
    range: [16, 30],
    description: 'Medium flow rate valves',
    ventils: ['1103015', '1102710']
  },
  
  HIGH: {
    range: [31, 50],
    description: 'High flow rate valves',
    ventils: ['1225853', '1022508']
  }
};

// Parker Series Information
export const PARKER_SERIES = {
  'D1FP': {
    name: 'D1FP',
    description: 'Parker D1FP Proportional Valve Series',
    manufacturer: 'Parker Hannifin',
    type: 'Proportional Flow Control Valve',
    application: 'Welding machine flow control'
  }
};

/**
 * Get ventil options for form dropdown
 * @returns {Array} Array of ventil options {value, label}
 */
export const getVentilOptions = () => {
  return Object.keys(VENTIL_MAPPINGS).map(key => ({
    value: key,
    label: VENTIL_MAPPINGS[key].label
  }));
};

/**
 * Get Parker data by S-CH Art.-Nr.
 * @param {string} schArtNr - S-CH article number
 * @returns {Object} Parker data {parkerArtNr, nenndurchfluss} or empty if not found
 */
export const getParkerData = (schArtNr) => {
  const mapping = VENTIL_MAPPINGS[schArtNr];
  if (!mapping) {
    return {
      parkerArtNr: '',
      nenndurchfluss: ''
    };
  }
  
  return {
    parkerArtNr: mapping.parkerArtNr,
    nenndurchfluss: mapping.nenndurchfluss
  };
};

/**
 * Get complete ventil information
 * @param {string} schArtNr - S-CH article number
 * @returns {Object|null} Complete ventil information or null if not found
 */
export const getVentilInfo = (schArtNr) => {
  return VENTIL_MAPPINGS[schArtNr] || null;
};

/**
 * Get ventils by flow rate range
 * @param {number} minFlow - Minimum flow rate
 * @param {number} maxFlow - Maximum flow rate
 * @returns {Array} Array of matching ventils
 */
export const getVentilsByFlowRate = (minFlow, maxFlow) => {
  return Object.values(VENTIL_MAPPINGS).filter(
    ventil => ventil.flowRate >= minFlow && ventil.flowRate <= maxFlow
  );
};

/**
 * Get flow rate category for a ventil
 * @param {string} schArtNr - S-CH article number
 * @returns {string|null} Flow rate category name or null
 */
export const getFlowRateCategory = (schArtNr) => {
  const ventil = VENTIL_MAPPINGS[schArtNr];
  if (!ventil) return null;
  
  for (const [category, info] of Object.entries(FLOW_RATE_CATEGORIES)) {
    const [min, max] = info.range;
    if (ventil.flowRate >= min && ventil.flowRate <= max) {
      return category;
    }
  }
  
  return null;
};

/**
 * Validate S-CH Art.-Nr. selection
 * @param {string} schArtNr - S-CH article number
 * @returns {boolean} True if valid selection
 */
export const validateVentilSelection = (schArtNr) => {
  return VENTIL_MAPPINGS.hasOwnProperty(schArtNr);
};

/**
 * Get all available S-CH Art.-Nr. values
 * @returns {Array} Array of S-CH article numbers
 */
export const getAvailableVentilNumbers = () => {
  return Object.keys(VENTIL_MAPPINGS);
};

/**
 * Get ventil by Parker Art.-Nr.
 * @param {string} parkerArtNr - Parker article number
 * @returns {Object|null} Ventil information or null if not found
 */
export const getVentilByParkerNumber = (parkerArtNr) => {
  return Object.values(VENTIL_MAPPINGS).find(
    ventil => ventil.parkerArtNr === parkerArtNr
  ) || null;
};

/**
 * Get summary statistics for all ventils
 * @returns {Object} Statistics summary
 */
export const getVentilStatistics = () => {
  const ventils = Object.values(VENTIL_MAPPINGS);
  const flowRates = ventils.map(v => v.flowRate);
  
  return {
    totalVentils: ventils.length,
    flowRateRange: {
      min: Math.min(...flowRates),
      max: Math.max(...flowRates),
      average: flowRates.reduce((sum, rate) => sum + rate, 0) / flowRates.length
    },
    seriesCount: {
      D1FP: ventils.filter(v => v.series === 'D1FP').length
    },
    categoryDistribution: Object.keys(FLOW_RATE_CATEGORIES).reduce((acc, category) => {
      acc[category] = FLOW_RATE_CATEGORIES[category].ventils.length;
      return acc;
    }, {})
  };
};