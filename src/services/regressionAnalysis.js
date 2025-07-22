/**
 * Regression Analysis Service
 * Calculates linear regression and smooth curves for UE vs velocity data
 */

import { REGRESSION, PRECISION } from '../constants/analysis';
import { VOLTAGE_RANGES } from '../constants/voltages';

export const prepareRegressionData = (mappedResults, approvalStatus) => {
  if (!mappedResults || !approvalStatus) {
    return [];
  }

  // Filter only approved data points (exclude reference row)
  const approvedData = mappedResults.filter(result => {
    return result.rampType !== 'reference' && 
           approvalStatus[result.fileName] === true;
  });

  // Convert to regression format
  return approvedData.map(result => ({
    voltage: result.voltage,
    velocity: result.velocity,
    fileName: result.fileName,
    rampType: result.rampType
  }));
};

export const calculateLinearRegression = (dataPoints) => {
  if (!dataPoints || dataPoints.length < REGRESSION.MIN_POINTS_WITH_ORIGIN) {
    return null;
  }

  const n = dataPoints.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums
  dataPoints.forEach(point => {
    sumX += point.voltage;
    sumY += point.velocity;
    sumXY += point.voltage * point.velocity;
    sumXX += point.voltage * point.voltage;
  });

  // Calculate slope (m) and y-intercept (b)
  const denominator = n * sumXX - sumX * sumX;
  
  if (denominator === 0) {
    return null; // Avoid division by zero
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const yIntercept = (sumY - slope * sumX) / n;

  return {
    slope: slope,
    yIntercept: yIntercept,
    equation: `y = ${slope.toFixed(REGRESSION.REGRESSION_PRECISION)}x + ${yIntercept.toFixed(REGRESSION.REGRESSION_PRECISION)}`
  };
};

export const generateRegressionLine = (regression, xMin = VOLTAGE_RANGES.FULL.min, xMax = VOLTAGE_RANGES.FULL.max) => {
  if (!regression) {
    return [];
  }

  const points = [];
  const step = (xMax - xMin) / REGRESSION.CURVE_INTERPOLATION_POINTS; // Points for smooth line

  for (let x = xMin; x <= xMax; x += step) {
    const y = regression.slope * x + regression.yIntercept;
    points.push({ voltage: x, velocity: y });
  }

  return points;
};

export const calculateSmoothCurve = (dataPoints) => {
  if (!dataPoints || dataPoints.length < 2) {
    return [];
  }

  // Sort points by voltage for proper curve interpolation
  const sortedPoints = [...dataPoints].sort((a, b) => a.voltage - b.voltage);

  // For smooth curve, we'll use the actual data points
  // D3 will handle the curve interpolation in the chart component
  return sortedPoints.map(point => ({
    voltage: point.voltage,
    velocity: point.velocity
  }));
};

export const calculateDynamicYScale = (dataPoints) => {
  if (!dataPoints || dataPoints.length === 0) {
    return { min: -2, max: 2 }; // Default range
  }

  const velocities = dataPoints.map(point => Math.abs(point.velocity));
  const maxVelocity = Math.max(...velocities);
  
  // Add buffer as specified
  const yMax = maxVelocity + REGRESSION.DYNAMIC_Y_BUFFER;
  const yMin = -yMax; // Symmetric range

  return {
    min: yMin,
    max: yMax
  };
};

export const getStatistics = (dataPoints, regression) => {
  if (!dataPoints || dataPoints.length === 0) {
    return null;
  }

  const velocities = dataPoints.map(point => point.velocity);
  const voltages = dataPoints.map(point => point.voltage);
  
  const upRamps = dataPoints.filter(point => point.rampType === 'up');
  const downRamps = dataPoints.filter(point => point.rampType === 'down');

  return {
    totalPoints: dataPoints.length,
    upRampCount: upRamps.length,
    downRampCount: downRamps.length,
    velocityRange: {
      min: Math.min(...velocities),
      max: Math.max(...velocities),
      average: velocities.reduce((sum, v) => sum + v, 0) / velocities.length
    },
    voltageRange: {
      min: Math.min(...voltages),
      max: Math.max(...voltages)
    },
    regression: regression
  };
};

export const validateRegressionData = (dataPoints) => {
  if (!dataPoints || !Array.isArray(dataPoints)) {
    return { isValid: false, error: 'No data points provided' };
  }

  if (dataPoints.length < REGRESSION.MIN_POINTS_WITH_ORIGIN) {
    return { isValid: false, error: `At least ${REGRESSION.MIN_POINTS_WITH_ORIGIN} data point required for regression (origin added automatically)` };
  }

  // Check for valid numbers
  for (const point of dataPoints) {
    if (typeof point.voltage !== 'number' || 
        typeof point.velocity !== 'number' ||
        isNaN(point.voltage) || 
        isNaN(point.velocity)) {
      return { isValid: false, error: 'Invalid voltage or velocity values' };
    }
  }

  // Check voltage range
  const voltages = dataPoints.map(p => p.voltage);
  const minVoltage = Math.min(...voltages);
  const maxVoltage = Math.max(...voltages);
  
  if (minVoltage < VOLTAGE_RANGES.FULL.min || maxVoltage > VOLTAGE_RANGES.FULL.max) {
    return { isValid: false, error: `Voltage values out of expected range (${VOLTAGE_RANGES.FULL.min}V to ${VOLTAGE_RANGES.FULL.max}V)` };
  }

  return { isValid: true };
};