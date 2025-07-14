import React, { useState } from 'react';
import FileUpload from './components/upload/FileUpload';
import DualResultsTable from './components/export/ResultsTable';
import ChartContainer from './components/charts/ChartContainer';
import ApprovalButton from './components/common/ApprovalButton';
import TestDataForm from './components/forms/TestDataForm';
import { detectDualSlopes, recalculateDualVelocity } from './services/slopeDetection';
import { mapDualVelocitiesToVoltages, downloadDualCSV } from './services/voltageMapper';
import { createDualLineChart } from './components/charts/LineChart';

function App() {
  const [processedFiles, setProcessedFiles] = useState([]);
  const [dualSlopeResults, setDualSlopeResults] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState({});
  const [manuallyAdjusted, setManuallyAdjusted] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [testFormData, setTestFormData] = useState(null);

  const handleFormDataChange = (formData) => {
    setTestFormData(formData);
    console.log('Form data updated:', formData);
  };

  const handleFilesProcessed = async (files) => {
    setProcessedFiles(files);
    setIsAnalyzing(true);
    setError(null);
    setFailedFiles([]);
    setApprovalStatus({}); // Reset approval status
    setManuallyAdjusted({}); // Reset manual adjustment tracking

    try {
      const results = [];
      const failed = [];
      
      for (const file of files) {
        try {
          const dualSlopeResult = detectDualSlopes(file.data, file.fileName);
          results.push(dualSlopeResult);
          console.log(`✓ Processed ${file.fileName}:`, dualSlopeResult.detectionMethod);
        } catch (error) {
          console.error(`✗ Failed to process ${file.fileName}:`, error);
          failed.push({
            fileName: file.fileName,
            error: error.message
          });
        }
      }

      if (results.length === 0) {
        throw new Error('No files could be processed successfully');
      }

      setDualSlopeResults(results);
      setFailedFiles(failed);
      
      // Initialize approval status for all files
      const initialApprovalStatus = {};
      const initialManualAdjustment = {};
      results.forEach(result => {
        initialApprovalStatus[result.fileName] = false;
        initialManualAdjustment[result.fileName] = result.detectionMethod !== 'automatic';
      });
      setApprovalStatus(initialApprovalStatus);
      setManuallyAdjusted(initialManualAdjustment);
      
      // Auto-select first file for chart display
      if (results.length > 0) {
        const firstFile = files.find(f => f.fileName === results[0].fileName);
        setSelectedFile({
          data: firstFile,
          dualSlope: results[0]
        });
      }

      // Show summary
      console.log(`Processed ${results.length}/${files.length} files successfully`);
      if (failed.length > 0) {
        console.warn(`Failed files:`, failed.map(f => f.fileName));
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (result) => {
    const fileName = result.fileName;
    const fileData = processedFiles.find(f => f.fileName === fileName);
    const dualSlope = dualSlopeResults.find(ds => ds.fileName === fileName);
    
    if (fileData && dualSlope) {
      setSelectedFile({
        data: fileData,
        dualSlope: dualSlope
      });
    }
  };

  const handleDualMarkerMove = (markerType, rampType, newIndex) => {
    if (!selectedFile) return;

    try {
      const data = selectedFile.data.data;
      const currentDualSlope = selectedFile.dualSlope;
      
      // Determine which indices to update based on marker type and ramp type
      let newRampUpIndices = {
        startIndex: currentDualSlope.rampUp.startIndex,
        endIndex: currentDualSlope.rampUp.endIndex
      };
      
      let newRampDownIndices = {
        startIndex: currentDualSlope.rampDown.startIndex,
        endIndex: currentDualSlope.rampDown.endIndex
      };

      // Update the appropriate index
      if (rampType === 'up') {
        if (markerType === 'upStart') {
          newRampUpIndices.startIndex = newIndex;
        } else if (markerType === 'upEnd') {
          newRampUpIndices.endIndex = newIndex;
        }
      } else if (rampType === 'down') {
        if (markerType === 'downStart') {
          newRampDownIndices.startIndex = newIndex;
        } else if (markerType === 'downEnd') {
          newRampDownIndices.endIndex = newIndex;
        }
      }

      // Validate ranges
      if (newRampUpIndices.startIndex >= newRampUpIndices.endIndex || 
          newRampDownIndices.startIndex >= newRampDownIndices.endIndex ||
          newRampUpIndices.endIndex - newRampUpIndices.startIndex < 5 ||
          newRampDownIndices.endIndex - newRampDownIndices.startIndex < 5) {
        return;
      }

      // Recalculate velocities for both ramps
      const recalculated = recalculateDualVelocity(data, newRampUpIndices, newRampDownIndices);
      
      const updatedDualSlope = {
        ...currentDualSlope,
        rampUp: {
          ...currentDualSlope.rampUp,
          ...recalculated.rampUp
        },
        rampDown: {
          ...currentDualSlope.rampDown,
          ...recalculated.rampDown
        },
        detectionMethod: 'manual' // Mark as manually adjusted
      };

      // Update local state
      setSelectedFile({
        ...selectedFile,
        dualSlope: updatedDualSlope
      });

      // Update global dual slope results
      setDualSlopeResults(prev => 
        prev.map(result => 
          result.fileName === updatedDualSlope.fileName ? updatedDualSlope : result
        )
      );

      // Mark as manually adjusted and unapprove
      const fileName = updatedDualSlope.fileName;
      setManuallyAdjusted(prev => ({
        ...prev,
        [fileName]: true
      }));

      // Auto-unapprove when user makes changes
      setApprovalStatus(prev => ({
        ...prev,
        [fileName]: false
      }));

      console.log(`Updated ${fileName}: rampUp = ${updatedDualSlope.rampUp.velocity.toFixed(6)}, rampDown = ${updatedDualSlope.rampDown.velocity.toFixed(6)} (auto-unapproved due to manual adjustment)`);

    } catch (error) {
      console.error('Error updating dual marker:', error);
      setError(`Dual marker update failed: ${error.message}`);
    }
  };

  const handleApproval = (fileName) => {
    // Mark current file as approved
    setApprovalStatus(prev => ({
      ...prev,
      [fileName]: true
    }));

    console.log(`✓ Approved: ${fileName} (both ramps)`);

    // Auto-navigate to next unapproved file
    const nextFile = getNextUnapprovedFile(fileName);
    if (nextFile) {
      const fileData = processedFiles.find(f => f.fileName === nextFile.fileName);
      const dualSlope = dualSlopeResults.find(ds => ds.fileName === nextFile.fileName);
      if (fileData && dualSlope) {
        setSelectedFile({
          data: fileData,
          dualSlope: dualSlope
        });
        console.log(`→ Switched to: ${nextFile.fileName}`);
      }
    } else {
      console.log('🎉 All files approved!');
    }
  };

  const getNextUnapprovedFile = (currentFileName) => {
    const mappedResults = mapDualVelocitiesToVoltages(dualSlopeResults);
    
    // Get unique file names from mapped results
    const uniqueFiles = [...new Set(mappedResults
      .filter(r => r.rampType !== 'reference')
      .map(r => r.fileName))];
    
    const currentIndex = uniqueFiles.findIndex(fileName => fileName === currentFileName);
    
    // Look for next unapproved file starting from current position
    for (let i = currentIndex + 1; i < uniqueFiles.length; i++) {
      if (!approvalStatus[uniqueFiles[i]]) {
        return { fileName: uniqueFiles[i] };
      }
    }
    
    // If no next file found, look from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (!approvalStatus[uniqueFiles[i]]) {
        return { fileName: uniqueFiles[i] };
      }
    }
    
    return null; // All files approved
  };

  const handleExport = () => {
    if (dualSlopeResults.length === 0) {
      alert('No results to export');
      return;
    }

    try {
      const mappedResults = mapDualVelocitiesToVoltages(dualSlopeResults);
      // Pass test form data to export function
      downloadDualCSV(mappedResults, testFormData);
      console.log('Dual export successful');
    } catch (error) {
      console.error('Export failed:', error);
      setError(`Export failed: ${error.message}`);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const mappedResults = dualSlopeResults.length > 0 ? mapDualVelocitiesToVoltages(dualSlopeResults) : [];
  const isCurrentFileApproved = selectedFile ? approvalStatus[selectedFile.dualSlope.fileName] : false;
  const isCurrentFileManuallyAdjusted = selectedFile ? manuallyAdjusted[selectedFile.dualSlope.fileName] : false;

  React.useEffect(() => {
    if (selectedFile && selectedFile.data && selectedFile.dualSlope) {
      const chartElement = document.querySelector('#chart-svg');
      if (chartElement) {
        try {
          // Get container width for responsive chart
          const container = chartElement.parentElement;
          const containerWidth = container ? container.offsetWidth - 20 : 800; // 20px padding
          
          createDualLineChart(
            chartElement,
            selectedFile.data.data,
            selectedFile.dualSlope,
            handleDualMarkerMove,
            containerWidth,
            400
          );
        } catch (error) {
          console.error('Dual chart rendering failed:', error);
        }
      }
    }
  }, [selectedFile]);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>
          CSV Analysis Tool - Bidirectional
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
          Schlatter Industries - Dual Ramp Voltage/Velocity Analysis
        </p>
      </header>

      {error && (
        <div style={{ 
          background: '#ffebee', 
          border: '1px solid #f44336', 
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px',
          color: '#d32f2f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Error: {error}</span>
          <button 
            onClick={clearError}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#d32f2f', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {failedFiles.length > 0 && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffc107', 
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px',
          color: '#856404'
        }}>
          <strong>Warning:</strong> {failedFiles.length} file(s) could not be processed automatically:
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            {failedFiles.map((file, index) => (
              <li key={index} style={{ fontSize: '12px' }}>
                {file.fileName}: {file.error}
              </li>
            ))}
          </ul>
          <em style={{ fontSize: '12px' }}>
            These files will use fallback markers that you can adjust manually.
          </em>
        </div>
      )}

      {/* Test Data Form */}
      <TestDataForm onFormDataChange={handleFormDataChange} />

      <FileUpload onFilesProcessed={handleFilesProcessed} />

      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Analyzing dual slope data...
        </div>
      )}

      {mappedResults.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
            <div>
              <h2 style={{ margin: '0' }}>Bidirectional Results</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                {dualSlopeResults.length} files analyzed ({mappedResults.filter(r => r.rampType !== 'reference').length} ramp measurements)
                {failedFiles.length > 0 && ` (${failedFiles.length} with fallback markers)`}
              </p>
            </div>
            <button 
              onClick={handleExport}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Export Dual CSV
            </button>
          </div>

          <DualResultsTable 
            results={mappedResults} 
            approvalStatus={approvalStatus}
            manuallyAdjusted={manuallyAdjusted}
            onFileSelect={handleFileSelect}
          />

          {selectedFile && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: '0' }}>Dual Chart View: {selectedFile.data.fileName}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isCurrentFileApproved && (
                    <span style={{ 
                      color: isCurrentFileManuallyAdjusted ? 'orange' : 'green', 
                      fontWeight: 'bold', 
                      fontSize: '14px' 
                    }}>
                      ✓ Approved {isCurrentFileManuallyAdjusted ? '(manually adjusted)' : ''}
                    </span>
                  )}
                  <span style={{ 
                    fontSize: '12px', 
                    color: selectedFile.dualSlope.detectionMethod === 'automatic' ? 'green' : 'orange',
                    fontWeight: 'bold'
                  }}>
                    {selectedFile.dualSlope.detectionMethod === 'automatic' ? 'Auto-detected' : 
                     selectedFile.dualSlope.detectionMethod === 'fallback' ? 'Fallback markers' : 'Manually adjusted'}
                  </span>
                </div>
              </div>
              
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                <svg
                  id="chart-svg"
                  width="100%"
                  height="400"
                  style={{ backgroundColor: 'white', display: 'block' }}
                />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  <p>
                    <strong>Green area/markers:</strong> Ramp Up analysis section. 
                    <strong>Red area/markers:</strong> Ramp Down analysis section.
                    <strong>Drag the colored vertical lines</strong> to adjust analysis ranges.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                    <div>
                      <strong style={{ color: 'green' }}>Ramp Up:</strong> {selectedFile.dualSlope.rampUp.velocity.toFixed(6)} mm/s 
                      over {selectedFile.dualSlope.rampUp.duration.toFixed(3)}s
                    </div>
                    <div>
                      <strong style={{ color: 'red' }}>Ramp Down:</strong> {selectedFile.dualSlope.rampDown.velocity.toFixed(6)} mm/s 
                      over {selectedFile.dualSlope.rampDown.duration.toFixed(3)}s
                    </div>
                  </div>
                  {!isCurrentFileApproved && isCurrentFileManuallyAdjusted && (
                    <p style={{ color: 'orange', fontWeight: 'bold', marginTop: '10px' }}>
                      (Requires re-approval after manual adjustment)
                    </p>
                  )}
                </div>
                
                <ApprovalButton
                  fileName={selectedFile.dualSlope.fileName}
                  isApproved={isCurrentFileApproved}
                  onApprove={handleApproval}
                />
              </div>
            </div>
          )}
        </>
      )}

      {processedFiles.length === 0 && !isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Upload CSV files to begin dual ramp analysis
        </div>
      )}
    </div>
  );
}

export default App;