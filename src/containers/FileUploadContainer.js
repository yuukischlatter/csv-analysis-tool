import React from 'react';
import FileUpload from '../components/upload/FileUpload';
import { detectDualSlopes } from '../services/slopeDetection';

const FileUploadContainer = ({ 
  processedFiles, 
  setProcessedFiles,
  dualSlopeResults, 
  setDualSlopeResults,
  failedFiles,
  setFailedFiles,
  approvalStatus,
  setApprovalStatus,
  manuallyAdjusted,
  setManuallyAdjusted,
  setSelectedFile,
  setError,
  setIsAnalyzing
}) => {

  const checkForDuplicateFiles = (newFiles, existingFiles) => {
    const existingFileNames = new Set(existingFiles.map(f => f.fileName));
    return newFiles.filter(file => !existingFileNames.has(file.fileName));
  };

  const handleFilesProcessed = async (files) => {
    // Silent duplicate check - only process new files
    const uniqueFiles = checkForDuplicateFiles(files, processedFiles);
    
    if (uniqueFiles.length === 0) {
      console.log('All files already processed, skipping...');
      return;
    }

    const allFiles = [...processedFiles, ...uniqueFiles];
    setProcessedFiles(allFiles);
    setIsAnalyzing(true);
    setError(null);

    try {
      const newResults = [];
      const failed = [];
      
      for (const file of uniqueFiles) {
        try {
          const dualSlopeResult = detectDualSlopes(file.data, file.fileName);
          newResults.push(dualSlopeResult);
          console.log(`✓ Processed ${file.fileName}:`, dualSlopeResult.detectionMethod);
        } catch (error) {
          console.error(`✗ Failed to process ${file.fileName}:`, error);
          failed.push({
            fileName: file.fileName,
            error: error.message
          });
        }
      }

      if (newResults.length === 0 && dualSlopeResults.length === 0) {
        throw new Error('No files could be processed successfully');
      }

      const allResults = [...dualSlopeResults, ...newResults];
      setDualSlopeResults(allResults);
      setFailedFiles([...failedFiles, ...failed]);
      
      // Initialize approval status and manual adjustment tracking for new files
      const newApprovalStatus = { ...approvalStatus };
      const newManualAdjustment = { ...manuallyAdjusted };
      
      newResults.forEach(result => {
        newApprovalStatus[result.fileName] = false;
        newManualAdjustment[result.fileName] = result.detectionMethod !== 'automatic';
      });
      
      setApprovalStatus(newApprovalStatus);
      setManuallyAdjusted(newManualAdjustment);
      
      // Auto-select first unapproved file for chart display
      const getFirstUnapprovedFile = (results) => {
        return results.find(result => !newApprovalStatus[result.fileName]);
      };

      const firstUnapprovedFile = getFirstUnapprovedFile(allResults);
      if (firstUnapprovedFile) {
        const fileData = allFiles.find(f => f.fileName === firstUnapprovedFile.fileName);
        if (fileData) {
          setSelectedFile({
            data: fileData,
            dualSlope: firstUnapprovedFile
          });
          console.log(`Auto-switched to unapproved file: ${firstUnapprovedFile.fileName}`);
        }
      }

      console.log(`Processed ${newResults.length} new files (${failed.length} failed)`);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <FileUpload onFilesProcessed={handleFilesProcessed} />
  );
};

export default FileUploadContainer;