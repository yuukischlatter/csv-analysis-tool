import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { processCSVFile } from '../../services/csvProcessor';

const FileUpload = ({ onFilesProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsProcessing(true);
    const processedResults = [];
    const newUploadedFiles = [...uploadedFiles]; // Copy existing uploaded files

    try {
      for (const file of acceptedFiles) {
        // Check if file is already uploaded (by name)
        const isAlreadyUploaded = newUploadedFiles.some(f => f.name === file.name);
        
        if (isAlreadyUploaded) {
          console.log(`File ${file.name} already uploaded, skipping...`);
          continue; // Skip duplicate files
        }

        try {
          const result = await processCSVFile(file);
          processedResults.push(result);
          newUploadedFiles.push({ name: file.name, status: 'success' });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          newUploadedFiles.push({ name: file.name, status: 'error', error: error.message });
        }
      }

      setUploadedFiles(newUploadedFiles);

      if (processedResults.length > 0) {
        onFilesProcessed(processedResults);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onFilesProcessed, uploadedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.csv']
    },
    multiple: true
  });

  return (
    <div style={{ margin: '20px 0' }}>
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f0f0f0' : '#fafafa',
          marginBottom: '20px'
        }}
      >
        <input {...getInputProps()} />
        {isProcessing ? (
          <p>Processing files...</p>
        ) : isDragActive ? (
          <p>Drop CSV files here</p>
        ) : (
          <div>
            <p>Drag and drop CSV files here, or click to select</p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Multiple files supported
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;