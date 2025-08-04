/**
 * Simplified Dual Slope Detection Service
 * Uses fixed position thresholds (5mm and 25mm) for reliable detection
 */

import { SLOPE_DETECTION, FALLBACK_PERCENTAGES, DATA_VALIDATION } from '../constants/analysis';

// Fixed position thresholds for intersection detection
const POSITION_THRESHOLDS = {
  LOW: 5.0,    // 5mm threshold
  HIGH: 25.0   // 25mm threshold
};

export const detectDualSlopes = (data, fileName) => {
  if (!data || data.length < DATA_VALIDATION.MIN_DATA_POINTS) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  try {
    // Try fixed position threshold detection
    const result = detectByPositionThresholds(data, fileName);
    if (result) {
      return result;
    }
  } catch (error) {
    console.warn(`Position threshold detection failed for ${fileName}:`, error.message);
  }

  // Immediate fallback to percentage-based markers
  console.log(`Using fallback markers for ${fileName}`);
  return generateDualFallbackMarkers(data, fileName);
};

/**
 * Detect slopes using fixed position thresholds (5mm and 25mm)
 */
const detectByPositionThresholds = (data, fileName) => {
  const lowThreshold = POSITION_THRESHOLDS.LOW;
  const highThreshold = POSITION_THRESHOLDS.HIGH;
  
  // Find intersection points
  const intersections = findPositionIntersections(data, lowThreshold, highThreshold);
  if (!intersections) {
    return null;
  }
  
  // Validate that we have all 4 intersection points
  if (!intersections.upStart || !intersections.upEnd || 
      !intersections.downStart || !intersections.downEnd) {
    return null;
  }
  
  // Validate minimum distances and ordering
  if (!validateIntersectionOrder(intersections, data)) {
    return null;
  }
  
  // Calculate velocities for each ramp
  const upVelocity = calculateVelocity(data, {
    startIndex: intersections.upStart,
    endIndex: intersections.upEnd
  });
  
  const downVelocity = Math.abs(calculateVelocity(data, {
    startIndex: intersections.downStart,
    endIndex: intersections.downEnd
  }));
  
  return {
    fileName: fileName,
    rampUp: {
      startIndex: intersections.upStart,
      endIndex: intersections.upEnd,
      startTime: data[intersections.upStart].time,
      endTime: data[intersections.upEnd].time,
      startPosition: data[intersections.upStart].position,
      endPosition: data[intersections.upEnd].position,
      velocity: upVelocity,
      duration: data[intersections.upEnd].time - data[intersections.upStart].time
    },
    rampDown: {
      startIndex: intersections.downStart,
      endIndex: intersections.downEnd,
      startTime: data[intersections.downStart].time,
      endTime: data[intersections.downEnd].time,
      startPosition: data[intersections.downStart].position,
      endPosition: data[intersections.downEnd].position,
      velocity: downVelocity,
      duration: data[intersections.downEnd].time - data[intersections.downStart].time
    },
    detectionMethod: 'automatic'
  };
};

/**
 * Find position intersections with 5mm and 25mm thresholds
 */
const findPositionIntersections = (data, lowThreshold, highThreshold) => {
  let upStart = -1;    // First crossing of 5mm (going up)
  let upEnd = -1;      // First crossing of 25mm (going up)
  let downStart = -1;  // Second crossing of 25mm (going down)
  let downEnd = -1;    // Second crossing of 5mm (going down)
  
  let highCrossings = 0;  // Count crossings of 25mm threshold
  let lowCrossings = 0;   // Count crossings of 5mm threshold
  
  for (let i = 1; i < data.length; i++) {
    const prevPos = data[i-1].position;
    const currPos = data[i].position;
    
    // Check for 5mm threshold crossings
    if (prevPos < lowThreshold && currPos >= lowThreshold) {
      // Crossing 5mm upward
      lowCrossings++;
      if (lowCrossings === 1) {
        upStart = i; // First upward crossing = ramp up start
      }
    } else if (prevPos > lowThreshold && currPos <= lowThreshold) {
      // Crossing 5mm downward
      lowCrossings++;
      if (lowCrossings === 2) {
        downEnd = i; // Second downward crossing = ramp down end
        break; // We have all points we need
      }
    }
    
    // Check for 25mm threshold crossings
    if (prevPos < highThreshold && currPos >= highThreshold) {
      // Crossing 25mm upward
      highCrossings++;
      if (highCrossings === 1) {
        upEnd = i; // First upward crossing = ramp up end
      }
    } else if (prevPos > highThreshold && currPos <= highThreshold) {
      // Crossing 25mm downward
      highCrossings++;
      if (highCrossings === 2) {
        downStart = i; // Second downward crossing = ramp down start
      }
    }
  }
  
  // Return null if we didn't find all 4 intersection points
  if (upStart === -1 || upEnd === -1 || downStart === -1 || downEnd === -1) {
    return null;
  }
  
  return {
    upStart,
    upEnd,
    downStart,
    downEnd
  };
};

/**
 * Validate that intersection points are in correct order and have minimum distances
 */
const validateIntersectionOrder = (intersections, data) => {
  const { upStart, upEnd, downStart, downEnd } = intersections;
  
  // Check logical order: upStart < upEnd < downStart < downEnd
  if (!(upStart < upEnd && upEnd < downStart && downStart < downEnd)) {
    return false;
  }
  
  // Check minimum distances (convert to approximate data points)
  const avgTimeStep = (data[data.length-1].time - data[0].time) / data.length;
  const minPoints = Math.round(SLOPE_DETECTION.MIN_RAMP_SECONDS / avgTimeStep);
  
  // Check minimum ramp durations
  if ((upEnd - upStart) < minPoints || (downEnd - downStart) < minPoints) {
    return false;
  }
  
  // Check minimum gap between ramps
  const minGapPoints = Math.round(SLOPE_DETECTION.MIN_GAP_SECONDS / avgTimeStep);
  if ((downStart - upEnd) < minGapPoints) {
    return false;
  }
  
  return true;
};

/**
 * Generate fallback markers when detection fails
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