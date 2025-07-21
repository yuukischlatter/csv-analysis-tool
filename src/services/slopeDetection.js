/**
 * Simplified Dual Slope Detection Service
 * Finds positive (ramp up) and negative (ramp down) linear movements
 * Uses simple transition detection with buffers
 */

export const detectDualSlopes = (data, fileName) => {
  if (!data || data.length < 20) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  try {
    // Try simple automatic detection
    const result = detectSimpleSlopes(data, fileName);
    if (result) {
      return result;
    }
  } catch (error) {
    console.warn(`Simple slope detection failed for ${fileName}:`, error.message);
  }

  // Immediate fallback to percentage-based markers
  console.log(`Using fallback markers for ${fileName}`);
  return generateDualFallbackMarkers(data, fileName);
};

/**
 * Simple slope detection using transition finding
 */
const detectSimpleSlopes = (data, fileName) => {
  // Step 1: Smooth the data
  const smoothedData = smoothData(data);
  
  // Step 2: Calculate velocities
  const velocities = calculateVelocities(smoothedData);
  
  // Step 3: Find transitions
  const transitions = findTransitions(smoothedData, velocities);
  if (!transitions) {
    return null;
  }
  
  // Step 4: Apply buffers (move inward)
  const bufferedIndices = applyBuffers(transitions, smoothedData);
  if (!bufferedIndices) {
    return null;
  }
  
  // Step 5: Validate minimum distances
  if (!validateDistances(bufferedIndices, smoothedData)) {
    return null;
  }
  
  // Step 6: Calculate final velocities
  const upVelocity = calculateVelocity(smoothedData, {
    startIndex: bufferedIndices.upStart,
    endIndex: bufferedIndices.upEnd
  });
  
  const downVelocity = Math.abs(calculateVelocity(smoothedData, {
    startIndex: bufferedIndices.downStart,
    endIndex: bufferedIndices.downEnd
  }));
  
  return {
    fileName: fileName,
    rampUp: {
      startIndex: bufferedIndices.upStart,
      endIndex: bufferedIndices.upEnd,
      startTime: smoothedData[bufferedIndices.upStart].time,
      endTime: smoothedData[bufferedIndices.upEnd].time,
      startPosition: smoothedData[bufferedIndices.upStart].position,
      endPosition: smoothedData[bufferedIndices.upEnd].position,
      velocity: upVelocity,
      duration: smoothedData[bufferedIndices.upEnd].time - smoothedData[bufferedIndices.upStart].time
    },
    rampDown: {
      startIndex: bufferedIndices.downStart,
      endIndex: bufferedIndices.downEnd,
      startTime: smoothedData[bufferedIndices.downStart].time,
      endTime: smoothedData[bufferedIndices.downEnd].time,
      startPosition: smoothedData[bufferedIndices.downStart].position,
      endPosition: smoothedData[bufferedIndices.downEnd].position,
      velocity: downVelocity,
      duration: smoothedData[bufferedIndices.downEnd].time - smoothedData[bufferedIndices.downStart].time
    },
    detectionMethod: 'automatic'
  };
};

/**
 * Smooth data using simple moving average
 */
const smoothData = (data, windowSize = 5) => {
  const smoothed = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length - 1, i + Math.floor(windowSize / 2));
    
    let sumPosition = 0;
    let count = 0;
    
    for (let j = start; j <= end; j++) {
      sumPosition += data[j].position;
      count++;
    }
    
    smoothed.push({
      time: data[i].time,
      position: sumPosition / count
    });
  }
  
  return smoothed;
};

/**
 * Calculate velocities between consecutive points
 */
const calculateVelocities = (data) => {
  const velocities = [];
  
  for (let i = 1; i < data.length; i++) {
    const deltaPosition = data[i].position - data[i-1].position;
    const deltaTime = data[i].time - data[i-1].time;
    
    if (deltaTime > 0) {
      velocities.push(deltaPosition / deltaTime);
    } else {
      velocities.push(0);
    }
  }
  
  return velocities;
};

/**
 * Find transition points in the data
 */
const findTransitions = (data, velocities) => {
  const VELOCITY_THRESHOLD = 0.1; // mm/s - adjust as needed
  
  let flatToUpIndex = -1;
  let peakIndex = -1;
  let downToFlatIndex = -1;
  
  // Find flat → up transition (velocity becomes positive)
  for (let i = 0; i < velocities.length; i++) {
    if (velocities[i] > VELOCITY_THRESHOLD) {
      flatToUpIndex = i;
      break;
    }
  }
  
  if (flatToUpIndex === -1) return null;
  
  // Find peak (maximum position)
  let maxPosition = data[0].position;
  peakIndex = 0;
  
  for (let i = flatToUpIndex; i < data.length; i++) {
    if (data[i].position > maxPosition) {
      maxPosition = data[i].position;
      peakIndex = i;
    }
  }
  
  // Find down → flat transition (velocity becomes ~0 after peak)
  for (let i = peakIndex; i < velocities.length; i++) {
    if (Math.abs(velocities[i]) < VELOCITY_THRESHOLD) {
      downToFlatIndex = i;
      break;
    }
  }
  
  if (downToFlatIndex === -1) return null;
  
  return {
    flatToUp: flatToUpIndex,
    peak: peakIndex,
    downToFlat: downToFlatIndex
  };
};

/**
 * Apply buffers - move markers inward by specified time
 */
const applyBuffers = (transitions, data) => {
  const BUFFER_SECONDS = 5; // Move inward by 5 seconds
  
  // Convert seconds to approximate data points
  const avgTimeStep = (data[data.length-1].time - data[0].time) / data.length;
  const bufferPoints = Math.round(BUFFER_SECONDS / avgTimeStep);
  
  const upStart = transitions.flatToUp + bufferPoints;
  const upEnd = transitions.peak - bufferPoints;
  const downStart = transitions.peak + bufferPoints;
  const downEnd = transitions.downToFlat - bufferPoints;
  
  // Check bounds
  if (upStart >= upEnd || downStart >= downEnd ||
      upStart < 0 || upEnd >= data.length ||
      downStart < 0 || downEnd >= data.length) {
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
 * Validate minimum distances between markers
 */
const validateDistances = (indices, data) => {
  const MIN_RAMP_SECONDS = 5; // Minimum 5 seconds per ramp
  const MIN_GAP_SECONDS = 6;  // Minimum 6 seconds between ramps
  
  // Calculate actual time durations
  const upDuration = data[indices.upEnd].time - data[indices.upStart].time;
  const downDuration = data[indices.downEnd].time - data[indices.downStart].time;
  const gapDuration = data[indices.downStart].time - data[indices.upEnd].time;
  
  return upDuration >= MIN_RAMP_SECONDS &&
         downDuration >= MIN_RAMP_SECONDS &&
         gapDuration >= MIN_GAP_SECONDS;
};

/**
 * Generate fallback markers when detection fails
 */
export const generateDualFallbackMarkers = (data, fileName) => {
  if (!data || data.length < 20) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  const dataLength = data.length;

  // Ramp Up Fallback (10% - 40%)
  const upStartIndex = Math.floor(dataLength * 0.1);
  const upEndIndex = Math.floor(dataLength * 0.4);

  // Ramp Down Fallback (60% - 90%)
  const downStartIndex = Math.floor(dataLength * 0.6);
  const downEndIndex = Math.floor(dataLength * 0.9);

  // Ensure minimum distances
  const finalUpEndIndex = Math.max(upEndIndex, upStartIndex + 10);
  const finalDownEndIndex = Math.max(downEndIndex, downStartIndex + 10);

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
  if (upEnd - upStart < 5 || downEnd - downStart < 5) {
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