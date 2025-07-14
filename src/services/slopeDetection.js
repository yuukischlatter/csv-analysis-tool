/**
 * Slope Detection Service
 * Finds first positive linear movement and calculates velocity
 * Includes fallback for manual marker placement
 */

export const detectSlope = (data, fileName) => {
  if (!data || data.length < 10) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  try {
    // Try automatic detection first
    const positiveRegion = findFirstPositiveRegion(data);
    if (positiveRegion) {
      const linearSection = findLinearSection(data, positiveRegion);
      if (linearSection) {
        const velocity = calculateVelocity(data, linearSection);
        return {
          fileName: fileName,
          startIndex: linearSection.startIndex,
          endIndex: linearSection.endIndex,
          startTime: data[linearSection.startIndex].time,
          endTime: data[linearSection.endIndex].time,
          startPosition: data[linearSection.startIndex].position,
          endPosition: data[linearSection.endIndex].position,
          velocity: velocity,
          duration: data[linearSection.endIndex].time - data[linearSection.startIndex].time,
          detectionMethod: 'automatic'
        };
      }
    }
  } catch (error) {
    console.warn(`Automatic slope detection failed for ${fileName}:`, error.message);
  }

  // Fallback: Generate default markers
  console.log(`Using fallback markers for ${fileName}`);
  return generateDefaultMarkers(data, fileName);
};

export const generateDefaultMarkers = (data, fileName) => {
  if (!data || data.length < 10) {
    throw new Error(`Insufficient data points in ${fileName}`);
  }

  // Place markers at 10% and 90% of the data range
  const startIndex = Math.floor(data.length * 0.1);
  const endIndex = Math.floor(data.length * 0.9);

  // Ensure minimum distance between markers
  const finalEndIndex = Math.max(endIndex, startIndex + 10);

  const velocity = calculateVelocity(data, { startIndex, endIndex: finalEndIndex });

  return {
    fileName: fileName,
    startIndex: startIndex,
    endIndex: finalEndIndex,
    startTime: data[startIndex].time,
    endTime: data[finalEndIndex].time,
    startPosition: data[startIndex].position,
    endPosition: data[finalEndIndex].position,
    velocity: velocity,
    duration: data[finalEndIndex].time - data[startIndex].time,
    detectionMethod: 'fallback'
  };
};

export const recalculateVelocity = (data, startIndex, endIndex) => {
  if (!data || startIndex >= endIndex || startIndex < 0 || endIndex >= data.length) {
    throw new Error('Invalid indices for velocity calculation');
  }

  const velocity = calculateVelocity(data, { startIndex, endIndex });
  
  return {
    startIndex: startIndex,
    endIndex: endIndex,
    startTime: data[startIndex].time,
    endTime: data[endIndex].time,
    startPosition: data[startIndex].position,
    endPosition: data[endIndex].position,
    velocity: velocity,
    duration: data[endIndex].time - data[startIndex].time
  };
};

const findFirstPositiveRegion = (data) => {
  let startIndex = -1;
  let consecutivePositive = 0;
  const minConsecutivePoints = 5;

  for (let i = 1; i < data.length; i++) {
    const slope = (data[i].position - data[i-1].position) / (data[i].time - data[i-1].time);
    
    if (slope > 0) {
      if (startIndex === -1) {
        startIndex = i - 1;
      }
      consecutivePositive++;
      
      // Found enough consecutive positive points
      if (consecutivePositive >= minConsecutivePoints) {
        // Continue until slope becomes negative or end
        let endIndex = i;
        for (let j = i + 1; j < data.length; j++) {
          const nextSlope = (data[j].position - data[j-1].position) / (data[j].time - data[j-1].time);
          if (nextSlope <= 0) {
            break;
          }
          endIndex = j;
        }
        
        return { startIndex, endIndex };
      }
    } else {
      // Reset if we hit a negative slope
      startIndex = -1;
      consecutivePositive = 0;
    }
  }

  return null;
};

const findLinearSection = (data, region) => {
  const { startIndex, endIndex } = region;
  const sectionLength = endIndex - startIndex;
  
  if (sectionLength < 10) {
    return null;
  }

  // Try to find a 5-second linear section within the positive region
  const targetDuration = 5.0; // 5 seconds
  let bestSection = null;
  let bestR2 = 0;

  // Scan through the region looking for the most linear 5-second section
  for (let start = startIndex; start < endIndex - 5; start++) {
    for (let end = start + 5; end <= endIndex; end++) {
      const duration = data[end].time - data[start].time;
      
      // Look for sections close to 5 seconds
      if (Math.abs(duration - targetDuration) < 2.0) {
        const r2 = calculateR2(data, start, end);
        
        if (r2 > bestR2 && r2 > 0.95) { // High linearity threshold
          bestR2 = r2;
          bestSection = { startIndex: start, endIndex: end };
        }
      }
    }
  }

  // If no good 5-second section found, use the most linear part
  if (!bestSection && sectionLength >= 10) {
    bestSection = findMostLinearSubsection(data, startIndex, endIndex);
  }

  return bestSection;
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

const findMostLinearSubsection = (data, startIndex, endIndex) => {
  let bestR2 = 0;
  let bestSection = null;
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

  return bestSection;
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

export const validateSlopeResult = (result) => {
  if (!result || typeof result.velocity !== 'number' || isNaN(result.velocity)) {
    throw new Error('Invalid slope detection result');
  }
  
  if (result.duration <= 0) {
    throw new Error('Analysis duration must be positive');
  }
  
  return true;
};