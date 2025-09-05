import React, { useCallback, useState, useRef } from 'react';
import { processCSVFile } from '../../services/csvProcessor';

const FileUpload = ({ onFilesProcessed, calibrationData }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const csvFiles = Array.from(files);
    console.log(`Selected ${csvFiles.length} CSV files`);
    
    // Log calibration status
    if (calibrationData) {
      console.log('Using voltage-to-position calibration for file processing');
      console.log(`Calibration: offset=${calibrationData.offset}, mmPerVolt=${calibrationData.mmPerVolt}`);
    } else {
      console.log('Using default multiplier (×10) for file processing');
    }

    setIsProcessing(true);
    const processedResults = [];

    try {
      for (const file of csvFiles) {
        try {
          // Pass calibration data to processor
          const result = await processCSVFile(file, calibrationData);
          processedResults.push(result);
          console.log(`✓ Processed ${file.name} (created: ${result.createdDate.toLocaleString()})`);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
        }
      }

      if (processedResults.length > 0) {
        console.log(`Sending ${processedResults.length} files for chronological sorting and processing`);
        onFilesProcessed(processedResults);
      }
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onFilesProcessed, calibrationData]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Check if calibration is complete
  const isCalibrationComplete = calibrationData && 
                                calibrationData.offset !== undefined && 
                                calibrationData.mmPerVolt !== undefined;

  // Hide upload if calibration not complete
  if (!isCalibrationComplete) {
    return (
      <div style={{ 
        margin: '20px 0',
        padding: '40px',
        textAlign: 'center',
        border: '2px dashed #ccc',
        borderRadius: '4px',
        backgroundColor: '#fafafa',
        color: '#666'
      }}>
        <p style={{ margin: '0', fontSize: '16px' }}>
          Add calibration first then upload CSV
        </p>
      </div>
    );
  }

  return (
    <div style={{ margin: '20px 0' }}>
      {/* Hidden file input - only shows CSV files in explorer */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {/* File selection button */}
      <div
        onClick={handleButtonClick}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isProcessing ? '#f0f0f0' : '#fafafa',
          marginBottom: '20px',
          transition: 'background-color 0.2s ease'
        }}
      >
        {isProcessing ? (
          <div>
            <p>Processing CSV files...</p>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Extracting timestamps and sorting chronologically...
            </div>
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Select CSV Measurement Files
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;