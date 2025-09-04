import Papa from 'papaparse';
import { FILE_VALIDATION } from '../constants/validation';

/**
 * CSV Processor Service
 * Parses CSV files and extracts time (column 1) and position (column 4)
 * Now includes file creation timestamp for chronological sorting
 */

export const processCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    // Extract file creation timestamp
    const createdAt = file.lastModified || Date.now();
    const createdDate = new Date(createdAt);
    
    console.log(`Processing ${file.name} - Created: ${createdDate.toLocaleString()}`);
    
    Papa.parse(file, {
      complete: (results) => {
        try {
          const processedData = extractTimeAndPosition(results.data, file.name, createdAt, createdDate);
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

const extractTimeAndPosition = (rawData, fileName, createdAt, createdDate) => {
  if (!rawData || rawData.length === 0) {
    throw new Error(`No data found in ${fileName}`);
  }

  // Validate that we have at least required columns
  const firstRow = rawData[0];
  if (!Array.isArray(firstRow) || firstRow.length < FILE_VALIDATION.MIN_COLUMNS) {
    throw new Error(`Invalid CSV format in ${fileName}. Expected at least ${FILE_VALIDATION.MIN_COLUMNS} columns.`);
  }

  const timePositionData = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip rows that don't have enough columns
    if (!row || row.length < FILE_VALIDATION.MIN_COLUMNS) {
      continue;
    }

    const time = parseFloat(row[FILE_VALIDATION.TIME_COLUMN]);
    const position = parseFloat(row[FILE_VALIDATION.POSITION_COLUMN]) * FILE_VALIDATION.POSITION_MULTIPLIER;

    // Skip rows with invalid numbers
    if (isNaN(time) || isNaN(position)) {
      continue;
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
    fileSize: rawData.length        // Original CSV row count
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