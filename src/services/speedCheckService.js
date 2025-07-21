/**
 * Speed Check Service
 * Data processing and calculation logic for speed check analysis
 */

import { VOLTAGE_LIMIT, TARGET_SPEEDS, getMachineParams } from '../constants/speedCheckConstants';

/**
 * Calculate linear regression slope from filtered voltage range (0 to voltage_limit)
 * @param {Array} regressionData - Array of {voltage, velocity} objects
 * @param {number} voltageLimit - Maximum voltage for regression (default 4.0V)
 * @returns {Object} Regression results
 */
export const calculateRegressionSlope = (regressionData, voltageLimit = VOLTAGE_LIMIT) => {
  if (!regressionData || regressionData.length === 0) {
    throw new Error('No regression data provided');
  }

  // Filter data for regression (0 to voltage_limit only)
  const filteredData = regressionData.filter(point => 
    point.voltage >= 0 && point.voltage <= voltageLimit
  );

  if (filteredData.length < 2) {
    throw new Error(`Insufficient data points in 0-${voltageLimit}V range`);
  }

  const n = filteredData.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums
  filteredData.forEach(point => {
    sumX += point.voltage;
    sumY += point.velocity;
    sumXY += point.voltage * point.velocity;
    sumXX += point.voltage * point.voltage;
  });

  // Calculate slope (m) and y-intercept (b)
  const denominator = n * sumXX - sumX * sumX;
  
  if (denominator === 0) {
    throw new Error('Cannot calculate regression - division by zero');
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let totalSumSquares = 0;
  let residualSumSquares = 0;

  filteredData.forEach(point => {
    const predictedY = slope * point.voltage + intercept;
    totalSumSquares += Math.pow(point.velocity - meanY, 2);
    residualSumSquares += Math.pow(point.velocity - predictedY, 2);
  });

  const rSquared = totalSumSquares !== 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

  return {
    slope: slope,
    intercept: intercept,
    rSquared: rSquared,
    dataPointsUsed: filteredData.length,
    voltageRange: [0, voltageLimit]
  };
};

/**
 * Calculate manual slope from slope factor
 * @param {number} calculatedSlope - Original calculated slope
 * @param {number} manualSlopeFactor - User adjustment factor
 * @returns {number} Manual slope value
 */
export const getManualSlope = (calculatedSlope, manualSlopeFactor) => {
  return calculatedSlope * manualSlopeFactor;
};

/**
 * Forecast required voltage for target speed using manual slope
 * @param {number} targetSpeed - Desired speed in mm/s
 * @param {number} manualSlope - Manual adjusted slope
 * @returns {number} Required voltage
 */
export const forecastVoltageForSpeed = (targetSpeed, manualSlope) => {
  if (manualSlope === 0) {
    return 0;
  }
  return targetSpeed / manualSlope;
};

/**
 * Calculate percentage deviations for target speeds
 * @param {number} manualSlope - Manual adjusted slope
 * @param {Array} targetSpeeds - Array of target speeds (default from constants)
 * @returns {Array} Array of deviation analysis objects
 */
export const calculateDeviations = (manualSlope, targetSpeeds = TARGET_SPEEDS) => {
  const deviations = [];

  targetSpeeds.forEach(targetSpeed => {
    if (targetSpeed === 0) {
      deviations.push({
        targetSpeed: 0,
        forecastedVoltage: 0,
        actualSpeed: 0,
        deviation: 0
      });
    } else {
      const forecastedVoltage = forecastVoltageForSpeed(targetSpeed, manualSlope);
      const actualSpeed = manualSlope * forecastedVoltage;
      const deviation = ((actualSpeed / targetSpeed) - 1) * 100;

      deviations.push({
        targetSpeed: targetSpeed,
        forecastedVoltage: forecastedVoltage,
        actualSpeed: actualSpeed,
        deviation: deviation
      });
    }
  });

  return deviations;
};

/**
 * Validate speed check data
 * @param {Array} regressionData - Regression data to validate
 * @returns {Object} Validation result
 */
export const validateSpeedCheckData = (regressionData) => {
  if (!regressionData || !Array.isArray(regressionData)) {
    return { 
      isValid: false, 
      error: 'No regression data provided' 
    };
  }

  if (regressionData.length < 2) {
    return { 
      isValid: false, 
      error: 'At least 2 data points required for speed check analysis' 
    };
  }

  // Check for data in 0-4V range
  const filteredData = regressionData.filter(point => 
    point.voltage >= 0 && point.voltage <= VOLTAGE_LIMIT
  );

  if (filteredData.length < 2) {
    return { 
      isValid: false, 
      error: `Insufficient data points in 0-${VOLTAGE_LIMIT}V range for analysis` 
    };
  }

  // Check for valid numbers
  for (const point of filteredData) {
    if (typeof point.voltage !== 'number' || 
        typeof point.velocity !== 'number' ||
        isNaN(point.voltage) || 
        isNaN(point.velocity)) {
      return { 
        isValid: false, 
        error: 'Invalid voltage or velocity values in data' 
      };
    }
  }

  return { isValid: true };
};

/**
 * Prepare speed check analysis results
 * @param {Array} regressionData - Input regression data
 * @param {number} manualSlopeFactor - User adjustment factor
 * @param {string} machineType - Selected machine type
 * @returns {Object} Complete speed check analysis
 */
export const performSpeedCheckAnalysis = (regressionData, manualSlopeFactor, machineType) => {
  // Validate input data
  const validation = validateSpeedCheckData(regressionData);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Calculate regression
  const regression = calculateRegressionSlope(regressionData);
  
  // Get manual slope
  const manualSlope = getManualSlope(regression.slope, manualSlopeFactor);
  
  // Calculate deviations
  const deviations = calculateDeviations(manualSlope);
  
  // Get machine parameters
  const machineParams = getMachineParams(machineType);
  if (!machineParams) {
    throw new Error(`Invalid machine type: ${machineType}`);
  }

  return {
    calculatedSlope: regression.slope,
    manualSlopeFactor: manualSlopeFactor,
    manualSlope: manualSlope,
    intercept: regression.intercept,
    rSquared: regression.rSquared,
    dataPointsUsed: regression.dataPointsUsed,
    voltageRange: regression.voltageRange,
    deviations: deviations,
    machineType: machineType,
    machineParams: machineParams,
    targetSpeeds: TARGET_SPEEDS
  };
};

/**
 * Format speed check results for export
 * @param {Object} analysis - Speed check analysis results
 * @param {Object} testFormData - Test form data (optional)
 * @returns {Object} Formatted export data
 */
export const formatSpeedCheckExport = (analysis, testFormData = null) => {
  const exportData = {
    analysis: {
      machineType: analysis.machineType,
      machineCategory: analysis.machineParams.type,
      speedLimits: {
        lower: analysis.machineParams.lower,
        middle: analysis.machineParams.middle,
        upper: analysis.machineParams.upper
      },
      regression: {
        calculatedSlope: analysis.calculatedSlope,
        manualSlopeFactor: analysis.manualSlopeFactor,
        manualSlope: analysis.manualSlope,
        rSquared: analysis.rSquared,
        voltageRange: analysis.voltageRange,
        dataPointsUsed: analysis.dataPointsUsed
      },
      deviations: analysis.deviations
    },
    timestamp: new Date().toISOString()
  };

  if (testFormData) {
    exportData.testData = {
      auftragsNr: testFormData.auftragsNr || '',
      maschinentyp: testFormData.maschinentyp || '',
      pruefer: testFormData.pruefer || '',
      datum: testFormData.datum || ''
    };
  }

  return exportData;
};