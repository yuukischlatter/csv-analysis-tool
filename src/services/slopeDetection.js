/**
 * Dual Slope Detection Service
 * Finds positive (ramp up) and negative (ramp down) linear movements
 * Calculates velocities for both ramps
 */

export const detectDualSlopes = (data, fileName) => {
  if (!data || data.length < 20) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  try {
    // Try automatic detection for both ramps
    const rampUp = findRampUp(data);
    const rampDown = findRampDown(data);
    
    if (rampUp && rampDown) {
      const upVelocity = calculateVelocity(data, rampUp);
      const downVelocity = Math.abs(calculateVelocity(data, rampDown)); // Absolute value for down ramp
      
      return {
        fileName: fileName,
        rampUp: {
          startIndex: rampUp.startIndex,
          endIndex: rampUp.endIndex,
          startTime: data[rampUp.startIndex].time,
          endTime: data[rampUp.endIndex].time,
          startPosition: data[rampUp.startIndex].position,
          endPosition: data[rampUp.endIndex].position,
          velocity: upVelocity,
          duration: data[rampUp.endIndex].time - data[rampUp.startIndex].time
        },
        rampDown: {
          startIndex: rampDown.startIndex,
          endIndex: rampDown.endIndex,
          startTime: data[rampDown.startIndex].time,
          endTime: data[rampDown.endIndex].time,
          startPosition: data[rampDown.startIndex].position,
          endPosition: data[rampDown.endIndex].position,
          velocity: downVelocity,
          duration: data[rampDown.endIndex].time - data[rampDown.startIndex].time
        },
        detectionMethod: 'automatic'
      };
    }
  } catch (error) {
    console.warn(`Automatic dual slope detection failed for ${fileName}:`, error.message);
  }

  // Fallback: Generate default markers
  console.log(`Using dual fallback markers for ${fileName}`);
  return generateDualFallbackMarkers(data, fileName);
};

export const findRampUp = (data) => {
  // Look for positive slope in first half of data (roughly)
  const searchEnd = Math.floor(data.length * 0.6); // Search up to 60%
  
  let startIndex = -1;
  let consecutivePositive = 0;
  const minConsecutivePoints = 5;

  for (let i = 1; i < searchEnd; i++) {
    const slope = (data[i].position - data[i-1].position) / (data[i].time - data[i-1].time);
    
    if (slope > 0) {
      if (startIndex === -1) {
        startIndex = i - 1;
      }
      consecutivePositive++;
      
      // Found enough consecutive positive points
      if (consecutivePositive >= minConsecutivePoints) {
        // Continue until slope becomes negative or we reach search limit
        let endIndex = i;
        for (let j = i + 1; j < searchEnd; j++) {
          const nextSlope = (data[j].position - data[j-1].position) / (data[j].time - data[j-1].time);
          if (nextSlope <= 0) {
            break;
          }
          endIndex = j;
        }
        
        // Validate minimum section length
        if (endIndex - startIndex >= 10) {
          return findBestLinearSection(data, startIndex, endIndex);
        }
      }
    } else {
      // Reset if we hit a negative slope
      startIndex = -1;
      consecutivePositive = 0;
    }
  }

  return null;
};

export const findRampDown = (data) => {
  // Look for negative slope in second half of data
  const searchStart = Math.floor(data.length * 0.4); // Start search from 40%
  
  let startIndex = -1;
  let consecutiveNegative = 0;
  const minConsecutivePoints = 5;

  for (let i = searchStart + 1; i < data.length; i++) {
    const slope = (data[i].position - data[i-1].position) / (data[i].time - data[i-1].time);
    
    if (slope < 0) {
      if (startIndex === -1) {
        startIndex = i - 1;
      }
      consecutiveNegative++;
      
      // Found enough consecutive negative points
      if (consecutiveNegative >= minConsecutivePoints) {
        // Continue until slope becomes positive or end
        let endIndex = i;
        for (let j = i + 1; j < data.length; j++) {
          const nextSlope = (data[j].position - data[j-1].position) / (data[j].time - data[j-1].time);
          if (nextSlope >= 0) {
            break;
          }
          endIndex = j;
        }
        
        // Validate minimum section length
        if (endIndex - startIndex >= 10) {
          return findBestLinearSection(data, startIndex, endIndex);
        }
      }
    } else {
      // Reset if we hit a positive slope
      startIndex = -1;
      consecutiveNegative = 0;
    }
  }

  return null;
};

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

const findBestLinearSection = (data, startIndex, endIndex) => {
  const sectionLength = endIndex - startIndex;
  
  if (sectionLength < 10) {
    return { startIndex, endIndex };
  }

  // Try to find the most linear subsection
  let bestSection = { startIndex, endIndex };
  let bestR2 = 0;
  const minLength = 10;

  for (let start = startIndex; start <= endIndex - minLength; start++) {
    for (let end = start + minLength; end <= endIndex; end++) {
      const r2 = calculateR2(data, start, end);
      if (r2 > bestR2) {
        bestR2 = r2;
        bestSection = { startIndex: start, endIndex: end };
      }
    }
  }

  // Only return improved section if R² is significantly better
  if (bestR2 > 0.95) {
    return bestSection;
  }

  return { startIndex, endIndex };
};

const calculateR2 = (data, startIndex, endIndex) => {
  const points = data.slice(startIndex, endIndex + 1);
  const n = points.length;
  
  if (n < 3) return 0;

  // Calculate means
  const meanTime = points.reduce((sum, p) => sum + p.time, 0) / n;
  const meanPosition = points.reduce((sum, p) => sum + p.position, 0) / n;

  // Calculate correlation coefficient
  let numerator = 0;
  let denomTime = 0;
  let denomPosition = 0;

  for (const point of points) {
    const timeDeviation = point.time - meanTime;
    const positionDeviation = point.position - meanPosition;
    
    numerator += timeDeviation * positionDeviation;
    denomTime += timeDeviation * timeDeviation;
    denomPosition += positionDeviation * positionDeviation;
  }

  if (denomTime === 0 || denomPosition === 0) return 0;

  const r = numerator / Math.sqrt(denomTime * denomPosition);
  return r * r; // R-squared
};

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