/**
 * Triangle-Based Dual Slope Detection Service
 * Uses triangle peak detection with adaptive thresholds for reliable detection
 */

import { SLOPE_DETECTION, FALLBACK_PERCENTAGES, DATA_VALIDATION } from '../constants/analysis';

// Triangle detection thresholds (percentages of total range)
const TRIANGLE_THRESHOLDS = {
  UPPER_PERCENT: 0.8,  // 90% of range from minimum (where slopes end/start near peak)  
  LOWER_PERCENT: 0.2   // 10% of range from minimum (baseline level)
};

export const detectDualSlopes = (data, fileName) => {
  if (!data || data.length < DATA_VALIDATION.MIN_DATA_POINTS) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  try {
    // Try triangle-based detection
    const result = detectTriangleBasedMarkers(data, fileName);
    if (result) {
      return result;
    }
  } catch (error) {
    console.warn(`Triangle detection failed for ${fileName}:`, error.message);
  }

  // Fallback to percentage-based markers
  console.log(`Using fallback markers for ${fileName}`);
  return generateDualFallbackMarkers(data, fileName);
};

/**
 * Triangle-based detection - find markers based on peak and slopes
 */
const detectTriangleBasedMarkers = (data, fileName) => {
  // Find global maximum and minimum
  const positions = data.map(d => d.position);
  const maxPos = Math.max(...positions);
  const minPos = Math.min(...positions);
  const maxIndex = positions.indexOf(maxPos);
  
  const totalRange = maxPos - minPos;
  console.log(`Triangle detection: peak at index ${maxIndex}, range ${minPos.toFixed(1)} to ${maxPos.toFixed(1)} mm`);
  
  if (totalRange < 1.0) {
    console.log(`Insufficient range for triangle detection: ${totalRange.toFixed(1)}mm`);
    return null;
  }
  
  // Calculate thresholds based on position range
  const upperThreshold = minPos + totalRange * TRIANGLE_THRESHOLDS.UPPER_PERCENT;
  const lowerThreshold = minPos + totalRange * TRIANGLE_THRESHOLDS.LOWER_PERCENT;
  
  console.log(`Thresholds: lower=${lowerThreshold.toFixed(1)}mm, upper=${upperThreshold.toFixed(1)}mm`);
  
  // RAMP UP: Go left from peak
  let upEnd = -1;  // Where we drop below 90% (end of ramp up)
  let upStart = -1; // Where we reach baseline (start of ramp up)
  
  for (let i = maxIndex; i >= 0; i--) {
    if (upEnd === -1 && data[i].position < upperThreshold) {
      upEnd = i;
      console.log(`Ramp up ends at index ${i}, pos=${data[i].position.toFixed(3)}mm`);
    }
    
    if (upEnd !== -1 && data[i].position < lowerThreshold) {
      upStart = i;
      console.log(`Ramp up starts at index ${i}, pos=${data[i].position.toFixed(3)}mm`);
      break;
    }
  }
  
  // RAMP DOWN: Go right from peak
  let downStart = -1; // Where we drop below 90% (start of ramp down)
  let downEnd = -1;   // Where we reach baseline (end of ramp down)
  
  for (let i = maxIndex; i < data.length; i++) {
    if (downStart === -1 && data[i].position < upperThreshold) {
      downStart = i;
      console.log(`Ramp down starts at index ${i}, pos=${data[i].position.toFixed(3)}mm`);
    }
    
    if (downStart !== -1 && data[i].position < lowerThreshold) {
      downEnd = i;
      console.log(`Ramp down ends at index ${i}, pos=${data[i].position.toFixed(3)}mm`);
      break;
    }
  }
  
  // Check if we found all markers
  if (upStart === -1 || upEnd === -1 || downStart === -1 || downEnd === -1) {
    console.log(`Failed to find all triangle markers: upStart=${upStart}, upEnd=${upEnd}, downStart=${downStart}, downEnd=${downEnd}`);
    return null;
  }
  
  // Apply small buffer (1% of total duration)
  const bufferSize = Math.max(3, Math.floor(data.length * 0.01));
  
  upStart = Math.max(0, upStart - bufferSize);
  upEnd = Math.min(data.length - 1, upEnd + bufferSize);
  downStart = Math.max(0, downStart - bufferSize);
  downEnd = Math.min(data.length - 1, downEnd + bufferSize);
  
  // Final validation
  if (!(upStart < upEnd && upEnd < downStart && downStart < downEnd)) {
    console.log(`Invalid triangle marker order: ${upStart} < ${upEnd} < ${downStart} < ${downEnd}`);
    return null;
  }
  
  console.log(`Triangle markers found:`);
  console.log(`  upStart: idx=${upStart}, pos=${data[upStart].position.toFixed(3)}mm`);
  console.log(`  upEnd: idx=${upEnd}, pos=${data[upEnd].position.toFixed(3)}mm`);
  console.log(`  downStart: idx=${downStart}, pos=${data[downStart].position.toFixed(3)}mm`);
  console.log(`  downEnd: idx=${downEnd}, pos=${data[downEnd].position.toFixed(3)}mm`);
  
  // Calculate velocities for each ramp
  const upVelocity = calculateVelocity(data, { startIndex: upStart, endIndex: upEnd });
  const downVelocity = Math.abs(calculateVelocity(data, { startIndex: downStart, endIndex: downEnd }));
  
  return {
    fileName: fileName,
    rampUp: {
      startIndex: upStart,
      endIndex: upEnd,
      startTime: data[upStart].time,
      endTime: data[upEnd].time,
      startPosition: data[upStart].position,
      endPosition: data[upEnd].position,
      velocity: upVelocity,
      duration: data[upEnd].time - data[upStart].time
    },
    rampDown: {
      startIndex: downStart,
      endIndex: downEnd,
      startTime: data[downStart].time,
      endTime: data[downEnd].time,
      startPosition: data[downStart].position,
      endPosition: data[downEnd].position,
      velocity: downVelocity,
      duration: data[downEnd].time - data[downStart].time
    },
    detectionMethod: 'triangle_based'
  };
};

/**
 * Generate fallback markers when triangle detection fails
 */
export const generateDualFallbackMarkers = (data, fileName) => {
  if (!data || data.length < DATA_VALIDATION.MIN_DATA_POINTS) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  const dataLength = data.length;

  // Ramp Up Fallback
  const upStartIndex = Math.floor(dataLength * FALLBACK_PERCENTAGES.RAMP_UP_START);
  const upEndIndex = Math.floor(dataLength * FALLBACK_PERCENTAGES.RAMP_UP_END);

  // Ramp Down Fallback
  const downStartIndex = Math.floor(dataLength * FALLBACK_PERCENTAGES.RAMP_DOWN_START);
  const downEndIndex = Math.floor(dataLength * FALLBACK_PERCENTAGES.RAMP_DOWN_END);

  // Ensure minimum distances
  const finalUpEndIndex = Math.max(upEndIndex, upStartIndex + SLOPE_DETECTION.MIN_MARKER_DISTANCE);
  const finalDownEndIndex = Math.max(downEndIndex, downStartIndex + SLOPE_DETECTION.MIN_MARKER_DISTANCE);

  const upVelocity = calculateVelocity(data, { startIndex: upStartIndex, endIndex: finalUpEndIndex });
  const downVelocity = Math.abs(calculateVelocity(data, { startIndex: downStartIndex, endIndex: finalDownEndIndex }));

  return {
    fileName: fileName,
    rampUp: {
      startIndex: upStartIndex,
      endIndex: finalUpEndIndex,
      startTime: data[upStartIndex].time,
      endTime: data[finalUpEndIndex].time,
      startPosition: data[upStartIndex].position,
      endPosition: data[finalUpEndIndex].position,
      velocity: upVelocity,
      duration: data[finalUpEndIndex].time - data[upStartIndex].time
    },
    rampDown: {
      startIndex: downStartIndex,
      endIndex: finalDownEndIndex,
      startTime: data[downStartIndex].time,
      endTime: data[finalDownEndIndex].time,
      startPosition: data[downStartIndex].position,
      endPosition: data[finalDownEndIndex].position,
      velocity: downVelocity,
      duration: data[finalDownEndIndex].time - data[downStartIndex].time
    },
    detectionMethod: 'fallback'
  };
};

/**
 * Recalculate velocities when user manually adjusts markers
 */
export const recalculateDualVelocity = (data, rampUpIndices, rampDownIndices) => {
  if (!data || !rampUpIndices || !rampDownIndices) {
    throw new Error('Invalid data or indices for dual velocity calculation');
  }

  // Validate indices
  const { startIndex: upStart, endIndex: upEnd } = rampUpIndices;
  const { startIndex: downStart, endIndex: downEnd } = rampDownIndices;

  if (upStart >= upEnd || downStart >= downEnd || 
      upStart < 0 || upEnd >= data.length || 
      downStart < 0 || downEnd >= data.length) {
    throw new Error('Invalid indices for dual velocity calculation');
  }

  // Ensure minimum distances
  const minDistance = SLOPE_DETECTION.MIN_MARKER_DISTANCE;
  if (upEnd - upStart < minDistance || downEnd - downStart < minDistance) {
    throw new Error('Insufficient distance between markers');
  }

  const upVelocity = calculateVelocity(data, { startIndex: upStart, endIndex: upEnd });
  const downVelocity = Math.abs(calculateVelocity(data, { startIndex: downStart, endIndex: downEnd }));

  return {
    rampUp: {
      startIndex: upStart,
      endIndex: upEnd,
      startTime: data[upStart].time,
      endTime: data[upEnd].time,
      startPosition: data[upStart].position,
      endPosition: data[upEnd].position,
      velocity: upVelocity,
      duration: data[upEnd].time - data[upStart].time
    },
    rampDown: {
      startIndex: downStart,
      endIndex: downEnd,
      startTime: data[downStart].time,
      endTime: data[downEnd].time,
      startPosition: data[downStart].position,
      endPosition: data[downEnd].position,
      velocity: downVelocity,
      duration: data[downEnd].time - data[downStart].time
    }
  };
};

/**
 * Calculate velocity between two points
 */
const calculateVelocity = (data, section) => {
  const { startIndex, endIndex } = section;
  const startPoint = data[startIndex];
  const endPoint = data[endIndex];
  
  const deltaPosition = endPoint.position - startPoint.position;
  const deltaTime = endPoint.time - startPoint.time;
  
  if (deltaTime === 0) {
    throw new Error('Zero time interval for velocity calculation');
  }
  
  return deltaPosition / deltaTime;
};

/**
 * Validate dual slope detection result
 */
export const validateDualSlopeResult = (result) => {
  if (!result || !result.rampUp || !result.rampDown) {
    throw new Error('Invalid dual slope detection result');
  }
  
  if (typeof result.rampUp.velocity !== 'number' || isNaN(result.rampUp.velocity) ||
      typeof result.rampDown.velocity !== 'number' || isNaN(result.rampDown.velocity)) {
    throw new Error('Invalid velocity values in dual slope result');
  }
  
  if (result.rampUp.duration <= 0 || result.rampDown.duration <= 0) {
    throw new Error('Analysis duration must be positive for both ramps');
  }
  
  return true;
};