import React, { useState } from 'react';
import FileUpload from './components/upload/FileUpload';
import ResultsTable from './components/export/ResultsTable';
import ChartContainer from './components/charts/ChartContainer';
import ApprovalButton from './components/common/ApprovalButton';
import { detectSlope, recalculateVelocity } from './services/slopeDetection';
import { mapVelocitiesToVoltages, downloadCSV } from './services/voltageMapper';
import { createLineChart } from './components/charts/LineChart';

function App() {
  const [processedFiles, setProcessedFiles] = useState([]);
  const [slopeResults, setSlopeResults] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState({});
  const [manuallyAdjusted, setManuallyAdjusted] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

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
          const slopeResult = detectSlope(file.data, file.fileName);
          results.push(slopeResult);
          console.log(`✓ Processed ${file.fileName}:`, slopeResult.detectionMethod);
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

      setSlopeResults(results);
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
          slope: results[0]
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
    const fileData = processedFiles.find(f => f.fileName === result.fileName);
    if (fileData) {
      setSelectedFile({
        data: fileData,
        slope: result
      });
    }
  };

  const handleMarkerMove = (markerType, newIndex) => {
    if (!selectedFile) return;

    try {
      const data = selectedFile.data.data;
      const currentSlope = selectedFile.slope;
      
      // Update the appropriate index
      const newStartIndex = markerType === 'start' ? newIndex : currentSlope.startIndex;
      const newEndIndex = markerType === 'end' ? newIndex : currentSlope.endIndex;

      // Ensure valid range
      if (newStartIndex >= newEndIndex || newEndIndex - newStartIndex < 5) {
        return;
      }

      // Recalculate velocity with new indices
      const recalculated = recalculateVelocity(data, newStartIndex, newEndIndex);
      
      const updatedSlope = {
        ...currentSlope,
        ...recalculated,
        detectionMethod: 'manual' // Mark as manually adjusted
      };

      // Update local state
      setSelectedFile({
        ...selectedFile,
        slope: updatedSlope
      });

      // Update global slope results
      setSlopeResults(prev => 
        prev.map(result => 
          result.fileName === updatedSlope.fileName ? updatedSlope : result
        )
      );

      // Mark as manually adjusted and unapprove
      const fileName = updatedSlope.fileName;
      setManuallyAdjusted(prev => ({
        ...prev,
        [fileName]: true
      }));

      // Auto-unapprove when user makes changes
      setApprovalStatus(prev => ({
        ...prev,
        [fileName]: false
      }));

      console.log(`Updated ${fileName}: velocity = ${updatedSlope.velocity.toFixed(6)} (auto-unapproved due to manual adjustment)`);

    } catch (error) {
      console.error('Error updating marker:', error);
      setError(`Marker update failed: ${error.message}`);
    }
  };

  const handleApproval = (fileName) => {
    // Mark current file as approved
    setApprovalStatus(prev => ({
      ...prev,
      [fileName]: true
    }));

    console.log(`✓ Approved: ${fileName}`);

    // Auto-navigate to next unapproved file
    const nextFile = getNextUnapprovedFile(fileName);
    if (nextFile) {
      const fileData = processedFiles.find(f => f.fileName === nextFile.fileName);
      if (fileData) {
        setSelectedFile({
          data: fileData,
          slope: nextFile
        });
        console.log(`→ Switched to: ${nextFile.fileName}`);
      }
    } else {
      console.log('🎉 All files approved!');
    }
  };

  const getNextUnapprovedFile = (currentFileName) => {
    const mappedResults = mapVelocitiesToVoltages(slopeResults);
    const currentIndex = mappedResults.findIndex(r => r.fileName === currentFileName);
    
    // Look for next unapproved file starting from current position
    for (let i = currentIndex + 1; i < mappedResults.length; i++) {
      if (!approvalStatus[mappedResults[i].fileName]) {
        return mappedResults[i];
      }
    }
    
    // If no next file found, look from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (!approvalStatus[mappedResults[i].fileName]) {
        return mappedResults[i];
      }
    }
    
    return null; // All files approved
  };

  const handleExport = () => {
    if (slopeResults.length === 0) {
      alert('No results to export');
      return;
    }

    try {
      const mappedResults = mapVelocitiesToVoltages(slopeResults);
      downloadCSV(mappedResults);
      console.log('Export successful');
    } catch (error) {
      console.error('Export failed:', error);
      setError(`Export failed: ${error.message}`);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const mappedResults = slopeResults.length > 0 ? mapVelocitiesToVoltages(slopeResults) : [];
  const isCurrentFileApproved = selectedFile ? approvalStatus[selectedFile.slope.fileName] : false;
  const isCurrentFileManuallyAdjusted = selectedFile ? manuallyAdjusted[selectedFile.slope.fileName] : false;

  React.useEffect(() => {
    if (selectedFile && selectedFile.data) {
      const chartElement = document.querySelector('#chart-svg');
      if (chartElement) {
        try {
          // Get container width for responsive chart
          const container = chartElement.parentElement;
          const containerWidth = container ? container.offsetWidth - 20 : 800; // 20px padding
          
          createLineChart(
            chartElement,
            selectedFile.data.data,
            selectedFile.slope,
            handleMarkerMove,
            containerWidth,
            400
          );
        } catch (error) {
          console.error('Chart rendering failed:', error);
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
          CSV Analysis Tool
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
          Schlatter Industries - Voltage/Velocity Analysis
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

      <FileUpload onFilesProcessed={handleFilesProcessed} />

      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Analyzing slope data...
        </div>
      )}

      {mappedResults.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
            <div>
              <h2 style={{ margin: '0' }}>Results</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                {slopeResults.length} files analyzed
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
              Export CSV
            </button>
          </div>

          <ResultsTable 
            results={mappedResults} 
            approvalStatus={approvalStatus}
            manuallyAdjusted={manuallyAdjusted}
            onFileSelect={handleFileSelect}
          />

          {selectedFile && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: '0' }}>Chart View: {selectedFile.data.fileName}</h3>
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
                    color: selectedFile.slope.detectionMethod === 'automatic' ? 'green' : 'orange',
                    fontWeight: 'bold'
                  }}>
                    {selectedFile.slope.detectionMethod === 'automatic' ? 'Auto-detected' : 
                     selectedFile.slope.detectionMethod === 'fallback' ? 'Fallback markers' : 'Manually adjusted'}
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
                    <strong>Red area</strong> shows the analyzed section. 
                    <strong>Drag the red vertical lines</strong> to adjust the analysis range.
                    Red dots show intersection points with the data.
                  </p>
                  <p>
                    Current velocity: <strong>{selectedFile.slope.velocity.toFixed(6)} mm/s</strong> 
                    over <strong>{selectedFile.slope.duration.toFixed(3)}s</strong>
                    {!isCurrentFileApproved && isCurrentFileManuallyAdjusted && (
                      <span style={{ color: 'orange', fontWeight: 'bold', marginLeft: '10px' }}>
                        (Requires re-approval after manual adjustment)
                      </span>
                    )}
                  </p>
                </div>
                
                <ApprovalButton
                  fileName={selectedFile.slope.fileName}
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
          Upload CSV files to begin analysis
        </div>
      )}
    </div>
  );
}

export default App;