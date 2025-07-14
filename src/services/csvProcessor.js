import Papa from 'papaparse';

/**
 * CSV Processor Service
 * Parses CSV files and extracts time (column 1) and position (column 4)
 */

export const processCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const processedData = extractTimeAndPosition(results.data, file.name);
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

const extractTimeAndPosition = (rawData, fileName) => {
  if (!rawData || rawData.length === 0) {
    throw new Error(`No data found in ${fileName}`);
  }

  // Validate that we have at least 4 columns
  const firstRow = rawData[0];
  if (!Array.isArray(firstRow) || firstRow.length < 4) {
    throw new Error(`Invalid CSV format in ${fileName}. Expected at least 4 columns.`);
  }

  const timePositionData = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Skip rows that don't have enough columns
    if (!row || row.length < 4) {
      continue;
    }

    const time = parseFloat(row[0]);
    const position = parseFloat(row[3]); // Column 4 (index 3)

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
    totalPoints: timePositionData.length
  };
};

export const validateCSVData = (processedData) => {
  if (!processedData || !processedData.data || processedData.data.length < 10) {
    throw new Error('Insufficient data points for analysis');
  }

  // Check if time values are increasing
  const timeValues = processedData.data.map(d => d.time);
  for (let i = 1; i < timeValues.length; i++) {
    if (timeValues[i] <= timeValues[i-1]) {
      throw new Error('Time values must be increasing');
    }
  }

  return true;
};