import Papa from 'papaparse';
import { FILE_VALIDATION } from '../constants/validation';

/**
 * CSV Processor Service
 * Parses CSV files and extracts time (column 1) and position (column 4)
 * Now includes file creation timestamp for chronological sorting
 * Supports voltage-to-position calibration conversion
 */

export const processCSVFile = (file, calibrationData = null) => {
  return new Promise((resolve, reject) => {
    // Extract file creation timestamp
    const createdAt = file.lastModified || Date.now();
    const createdDate = new Date(createdAt);
    
    console.log(`Processing ${file.name} - Created: ${createdDate.toLocaleString()}`);
    
    // Log calibration if provided
    if (calibrationData) {
      console.log(`Using calibration: offset=${calibrationData.offset}, mmPerVolt=${calibrationData.mmPerVolt}`);
    }
    
    Papa.parse(file, {
      complete: (results) => {
        try {
          const processedData = extractTimeAndPosition(
            results.data, 
            file.name, 
            createdAt, 
            createdDate,
            calibrationData  // Pass calibration data
          );
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
      skipEmptyLines: true,
      dynamicTyping: true
    });
  });
};

const extractTimeAndPosition = (rawData, fileName, createdAt, createdDate, calibrationData) => {
  if (!rawData || rawData.length === 0) {
    throw new Error(`No data found in ${fileName}`);
  }

  // Validate that we have at least required columns
  const firstRow = rawData[0];
  if (!Array.isArray(firstRow) || firstRow.length < FILE_VALIDATION.MIN_COLUMNS) {
    throw new Error(`Invalid CSV format in ${fileName}. Expected at least ${FILE_VALIDATION.MIN_COLUMNS} columns.`);
  }

  const timePositionData = [];
  
  // Determine if we should use calibration or default multiplier
  const useCalibration = calibrationData && 
                        calibrationData.offset !== undefined && 
                        calibrationData.mmPerVolt !== undefined;

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip rows that don't have enough columns
    if (!row || row.length < FILE_VALIDATION.MIN_COLUMNS) {
      continue;
    }

    const time = parseFloat(row[FILE_VALIDATION.TIME_COLUMN]);
    const rawValue = parseFloat(row[FILE_VALIDATION.POSITION_COLUMN]);

    // Skip rows with invalid numbers
    if (isNaN(time) || isNaN(rawValue)) {
      continue;
    }

    let position;
    if (useCalibration) {
      // New calibrated conversion: treat as voltage, convert to position
      const voltage = rawValue;
      position = (voltage - calibrationData.offset) * calibrationData.mmPerVolt;
    } else {
      // Legacy behavior: multiply by 10
      position = rawValue * FILE_VALIDATION.POSITION_MULTIPLIER;
    }

    timePositionData.push({
      time: time,
      position: position
    });
  }

  if (timePositionData.length === 0) {
    throw new Error(`No valid time/position data found in ${fileName}`);
  }

  return {
    fileName: fileName,
    data: timePositionData,
    totalPoints: timePositionData.length,
    createdAt: createdAt,           // Timestamp for sorting
    createdDate: createdDate,       // Human-readable date
    fileSize: rawData.length,       // Original CSV row count
    calibrationUsed: useCalibration  // Track if calibration was used
  };
};

export const validateCSVData = (processedData) => {
  if (!processedData || !processedData.data || processedData.data.length < FILE_VALIDATION.MIN_DATA_POINTS) {
    throw new Error('Insufficient data points for analysis');
  }

  // Check if time values are increasing
  const timeValues = processedData.data.map(d => d.time);
  for (let i = 1; i < timeValues.length; i++) {
    if (timeValues[i] <= timeValues[i-1]) {
      throw new Error('Time values must be increasing');
    }
  }

  // Validate timestamp
  if (!processedData.createdAt || !processedData.createdDate) {
    throw new Error('Missing file creation timestamp');
  }

  return true;
};

/**
 * Sort processed files by creation timestamp (oldest first)
 * @param {Array} processedFiles - Array of processed CSV results
 * @returns {Array} Sorted array (oldest to newest)
 */
export const sortFilesByTimestamp = (processedFiles) => {
  if (!processedFiles || processedFiles.length === 0) {
    return [];
  }

  const sorted = [...processedFiles].sort((a, b) => a.createdAt - b.createdAt);
  
  console.log('Files sorted by creation date (oldest to newest):');
  sorted.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.fileName} - ${file.createdDate.toLocaleString()}`);
  });

  return sorted;
};