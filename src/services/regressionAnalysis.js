/**
 * Regression Analysis Service
 * Calculates linear regression and smooth curves for UE vs velocity data
 */

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
  if (!dataPoints || dataPoints.length < 2) {
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

  // Calculate R-squared
  const meanY = sumY / n;
  let totalSumSquares = 0;
  let residualSumSquares = 0;

  dataPoints.forEach(point => {
    const predictedY = slope * point.voltage + yIntercept;
    totalSumSquares += Math.pow(point.velocity - meanY, 2);
    residualSumSquares += Math.pow(point.velocity - predictedY, 2);
  });

  const rSquared = totalSumSquares !== 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

  return {
    slope: slope,
    yIntercept: yIntercept,
    rSquared: rSquared,
    equation: `y = ${slope.toFixed(4)}x + ${yIntercept.toFixed(4)}`,
    rSquaredText: `R² = ${rSquared.toFixed(4)}`
  };
};

export const generateRegressionLine = (regression, xMin = -10, xMax = 10) => {
  if (!regression) {
    return [];
  }

  const points = [];
  const step = (xMax - xMin) / 100; // 100 points for smooth line

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
  
  // Add 2mm/s buffer as specified
  const buffer = 2;
  const yMax = maxVelocity + buffer;
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

  if (dataPoints.length < 2) {
    return { isValid: false, error: 'At least 2 data points required for regression' };
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
  
  if (minVoltage < -10 || maxVoltage > 10) {
    return { isValid: false, error: 'Voltage values out of expected range (-10V to +10V)' };
  }

  return { isValid: true };
};