import React from 'react';
import FileUpload from '../components/upload/FileUpload';
import { detectDualSlopes } from '../services/slopeDetection';
import { sortFilesByTimestamp } from '../services/csvProcessor';

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
  setIsAnalyzing,
  setHasChanges,
  testFormData  // NEW: Accept testFormData prop
}) => {

  // NEW: Calculate calibration data from form inputs
  const getCalibrationData = () => {
    if (!testFormData) return null;
    
    const { calibrationOffset, calibrationMaxPosition, calibrationMaxVoltage } = testFormData;
    
    // Check if all calibration fields are filled
    if (!calibrationOffset || !calibrationMaxPosition || !calibrationMaxVoltage) {
      return null;  // Use default behavior
    }
    
    const offset = parseFloat(calibrationOffset);
    const maxPos = parseFloat(calibrationMaxPosition);
    const maxVolt = parseFloat(calibrationMaxVoltage);
    
    if (isNaN(offset) || isNaN(maxPos) || isNaN(maxVolt)) {
      return null;
    }
    
    const adjustedVoltage = maxVolt - offset;
    const mmPerVolt = maxPos / adjustedVoltage;
    
    return {
      offset: offset,
      mmPerVolt: mmPerVolt
    };
  };

  const checkForDuplicateFiles = (newFiles, existingFiles) => {
    const existingFileNames = new Set(existingFiles.map(f => f.fileName));
    return newFiles.filter(file => !existingFileNames.has(file.fileName));
  };

  const handleFilesProcessed = async (files) => {
    console.log(`Received ${files.length} files from folder selection`);
    
    // Sort files by creation timestamp (oldest to newest)
    const chronologicalFiles = sortFilesByTimestamp(files);
    
    console.log('Processing files in chronological order:');
    chronologicalFiles.forEach((file, index) => {
      const suggestedVoltage = index === 0 ? '0.1V' : 
                              index === chronologicalFiles.length - 1 ? '10.0V' : 
                              `${(0.1 + (index / (chronologicalFiles.length - 1)) * 9.9).toFixed(1)}V`;
      console.log(`  ${index + 1}. ${file.fileName} (${file.createdDate.toLocaleString()}) → suggested: ${suggestedVoltage}`);
    });

    // Silent duplicate check - only process new files
    const uniqueFiles = checkForDuplicateFiles(chronologicalFiles, processedFiles);
    
    if (uniqueFiles.length === 0) {
      console.log('All files already processed, skipping...');
      return;
    }

    // Mark as changed when new files are added
    setHasChanges(true);

    // Maintain chronological order in final file list
    const allFiles = [...processedFiles, ...uniqueFiles].sort((a, b) => a.createdAt - b.createdAt);
    setProcessedFiles(allFiles);
    setIsAnalyzing(true);
    setError(null);

    try {
      const newResults = [];
      const failed = [];
      
      // Process files in chronological order
      for (const file of uniqueFiles) {
        try {
          const dualSlopeResult = detectDualSlopes(file.data, file.fileName);
          // Add timestamp metadata to dual slope result
          dualSlopeResult.createdAt = file.createdAt;
          dualSlopeResult.createdDate = file.createdDate;
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

      // Sort dual slope results by timestamp as well
      const allResults = [...dualSlopeResults, ...newResults].sort((a, b) => a.createdAt - b.createdAt);
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
      
      // Auto-select first unapproved file for chart display (chronologically first)
      const getFirstUnapprovedFile = (results) => {
        // Sort by timestamp, then find first unapproved
        const sortedResults = [...results].sort((a, b) => a.createdAt - b.createdAt);
        return sortedResults.find(result => !newApprovalStatus[result.fileName]);
      };

      const firstUnapprovedFile = getFirstUnapprovedFile(allResults);
      if (firstUnapprovedFile) {
        const fileData = allFiles.find(f => f.fileName === firstUnapprovedFile.fileName);
        if (fileData) {
          setSelectedFile({
            data: fileData,
            dualSlope: firstUnapprovedFile
          });
          console.log(`Auto-switched to chronologically first unapproved file: ${firstUnapprovedFile.fileName} (${firstUnapprovedFile.createdDate?.toLocaleString()})`);
        }
      }

      console.log(`✅ Processed ${newResults.length} new files in chronological order (${failed.length} failed)`);
      if (chronologicalFiles.length > 0) {
        const oldest = chronologicalFiles[0];
        const newest = chronologicalFiles[chronologicalFiles.length - 1];
        console.log(`📅 Chronological range: ${oldest.fileName} (${oldest.createdDate.toLocaleString()}) → ${newest.fileName} (${newest.createdDate.toLocaleString()})`);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <FileUpload 
      onFilesProcessed={handleFilesProcessed}
      calibrationData={getCalibrationData()}  // NEW: Pass calibration data
    />
  );
};

export default FileUploadContainer;