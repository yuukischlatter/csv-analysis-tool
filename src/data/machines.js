/**
 * Machine Data
 * Consolidated machine definitions with speed parameters and categories
 * Merges data from ventilMapping.js and speedCheckConstants.js
 */

// Machine Definitions with Speed Parameters
export const MACHINE_DEFINITIONS = {
  'GAA100': {
    name: 'GAA100',
    category: 'Stationary',
    type: 'GAA',
    series: '100',
    speeds: {
      lower: 3.0,        // mm/s - lower speed limit
      middle: 3.5,       // mm/s - target speed
      upper: 4.0         // mm/s - upper speed limit
    },
    description: 'Stationary welding machine GAA series 100'
  },
  
  'GAAS80': {
    name: 'GAAS80',
    category: 'Stationary',
    type: 'GAAS',
    series: '80',
    speeds: {
      lower: 3.0,
      middle: 3.5,
      upper: 4.0
    },
    description: 'Stationary welding machine GAAS series 80'
  },
  
  'GAA60': {
    name: 'GAA60',
    category: 'Stationary',
    type: 'GAA',
    series: '60',
    speeds: {
      lower: 3.0,
      middle: 3.5,
      upper: 4.0
    },
    description: 'Stationary welding machine GAA series 60'
  },
  
  'AMS60': {
    name: 'AMS60',
    category: 'Mobile',
    type: 'AMS',
    series: '60',
    speeds: {
      lower: 1.0,        // Mobile machines have lower speed limits
      middle: 1.5,
      upper: 2.0
    },
    description: 'Mobile welding machine AMS series 60'
  },
  
  'AMS100': {
    name: 'AMS100',
    category: 'Mobile',
    type: 'AMS',
    series: '100',
    speeds: {
      lower: 1.0,
      middle: 1.5,
      upper: 2.0
    },
    description: 'Mobile welding machine AMS series 100'
  },
  
  'AMS200': {
    name: 'AMS200',
    category: 'Mobile',
    type: 'AMS',
    series: '200',
    speeds: {
      lower: 1.0,
      middle: 1.5,
      upper: 2.0
    },
    description: 'Mobile welding machine AMS series 200'
  }
};

// Machine Categories
export const MACHINE_CATEGORIES = {
  STATIONARY: {
    name: 'Stationary',
    description: 'Fixed position welding machines',
    defaultSpeeds: { lower: 3.0, middle: 3.5, upper: 4.0 },
    machines: ['GAA100', 'GAAS80', 'GAA60']
  },
  
  MOBILE: {
    name: 'Mobile',
    description: 'Portable welding machines',
    defaultSpeeds: { lower: 1.0, middle: 1.5, upper: 2.0 },
    machines: ['AMS60', 'AMS100', 'AMS200']
  }
};

// Machine Types (for compatibility with existing code)
export const MACHINE_TYPES = Object.keys(MACHINE_DEFINITIONS).reduce((acc, key) => {
  const machine = MACHINE_DEFINITIONS[key];
  acc[key] = {
    lower: machine.speeds.lower,
    middle: machine.speeds.middle,
    upper: machine.speeds.upper,
    type: machine.category
  };
  return acc;
}, {});

// Array of machine type names (for form dropdowns)
export const MACHINE_TYPE_NAMES = Object.keys(MACHINE_DEFINITIONS);

/**
 * Get machine definition by name
 * @param {string} machineType - Machine type identifier
 * @returns {Object|null} Machine definition or null if not found
 */
export const getMachineDefinition = (machineType) => {
  return MACHINE_DEFINITIONS[machineType] || null;
};

/**
 * Get machine parameters (legacy compatibility)
 * @param {string} machineType - Machine type identifier
 * @returns {Object|null} Machine parameters or null if not found
 */
export const getMachineParams = (machineType) => {
  const machine = MACHINE_DEFINITIONS[machineType];
  if (!machine) return null;
  
  return {
    lower: machine.speeds.lower,
    middle: machine.speeds.middle,
    upper: machine.speeds.upper,
    type: machine.category
  };
};

/**
 * Get machines by category
 * @param {string} category - Machine category ('Stationary' or 'Mobile')
 * @returns {Array} Array of machine definitions in category
 */
export const getMachinesByCategory = (category) => {
  return Object.values(MACHINE_DEFINITIONS).filter(
    machine => machine.category === category
  );
};

/**
 * Get all machine types (names only)
 * @returns {Array} Array of machine type names
 */
export const getMachineTypes = () => {
  return Object.keys(MACHINE_DEFINITIONS);
};

/**
 * Validate machine type
 * @param {string} machineType - Machine type to validate
 * @returns {boolean} True if valid machine type
 */
export const isValidMachineType = (machineType) => {
  return MACHINE_DEFINITIONS.hasOwnProperty(machineType);
};

/**
 * Get machine category by type
 * @param {string} machineType - Machine type
 * @returns {string|null} Machine category or null if not found
 */
export const getMachineCategory = (machineType) => {
  const machine = MACHINE_DEFINITIONS[machineType];
  return machine ? machine.category : null;
};

/**
 * Get default speeds for machine category
 * @param {string} category - Machine category
 * @returns {Object|null} Default speed configuration or null
 */
export const getDefaultSpeedsForCategory = (category) => {
  return MACHINE_CATEGORIES[category.toUpperCase()]?.defaultSpeeds || null;
};

/**
 * Get machine series information
 * @param {string} machineType - Machine type
 * @returns {Object} Series information {type, series, fullName}
 */
export const getMachineSeriesInfo = (machineType) => {
  const machine = MACHINE_DEFINITIONS[machineType];
  if (!machine) return null;
  
  return {
    type: machine.type,
    series: machine.series,
    fullName: machine.name,
    category: machine.category
  };
};