import React, { useCallback, useState, useRef } from 'react';
import { processCSVFile } from '../../services/csvProcessor';

const FileUpload = ({ onFilesProcessed }) => {
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

    setIsProcessing(true);
    const processedResults = [];

    try {
      for (const file of csvFiles) {
        try {
          const result = await processCSVFile(file);
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
  }, [onFilesProcessed]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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