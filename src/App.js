import React, { useState } from 'react';
import FileUpload from './components/upload/FileUpload';
import DualResultsTable from './components/export/ResultsTable';
import ChartContainer from './components/charts/ChartContainer';
import ApprovalButton from './components/common/ApprovalButton';
import TestDataForm from './components/forms/TestDataForm';
import RegressionChart from './components/charts/RegressionChart';
import VoltageOverview from './components/charts/VoltageOverview';
import PDFExportButton from './components/export/PDFExportButton';
import SpeedCheckAnalysis from './components/analysis/SpeedCheckAnalysis';
import { detectDualSlopes, recalculateDualVelocity } from './services/slopeDetection';
import { createUserAssignedVoltageMapping, downloadDualCSV } from './services/voltageMapper';
import { prepareRegressionData } from './services/regressionAnalysis';
import { createDualLineChart } from './components/charts/LineChart';

// Available voltage magnitudes for assignment (removed 0V)
const AVAILABLE_VOLTAGES = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 9.0, 10.0
];

function App() {
  const [processedFiles, setProcessedFiles] = useState([]);
  const [dualSlopeResults, setDualSlopeResults] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState({});
  const [manuallyAdjusted, setManuallyAdjusted] = useState({});
  const [voltageAssignments, setVoltageAssignments] = useState({}); // fileName -> voltage magnitude
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [testFormData, setTestFormData] = useState(null);
  const [regressionData, setRegressionData] = useState([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(true); // New state for form collapse
  const [speedCheckResults, setSpeedCheckResults] = useState(null);

  const handleFormDataChange = (formData) => {
    setTestFormData(formData);
    console.log('Form data updated:', formData);
  };

  const handleToggleFormCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const updateRegressionData = () => {
    if (Object.keys(voltageAssignments).length > 0) {
      const mappedResults = createUserAssignedVoltageMapping(dualSlopeResults, voltageAssignments);
      const approvedData = prepareRegressionData(mappedResults, approvalStatus);
      setRegressionData(approvedData);
      console.log(`Regression data updated: ${approvedData.length} approved points`);
    }
  };

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
      
      let newRampUpIndices = {
        startIndex: currentDualSlope.rampUp.startIndex,
        endIndex: currentDualSlope.rampUp.endIndex
      };
      
      let newRampDownIndices = {
        startIndex: currentDualSlope.rampDown.startIndex,
        endIndex: currentDualSlope.rampDown.endIndex
      };

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

      if (newRampUpIndices.startIndex >= newRampUpIndices.endIndex || 
          newRampDownIndices.startIndex >= newRampDownIndices.endIndex ||
          newRampUpIndices.endIndex - newRampUpIndices.startIndex < 5 ||
          newRampDownIndices.endIndex - newRampDownIndices.startIndex < 5) {
        return;
      }

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
        detectionMethod: 'manual'
      };

      setSelectedFile({
        ...selectedFile,
        dualSlope: updatedDualSlope
      });

      setDualSlopeResults(prev => 
        prev.map(result => 
          result.fileName === updatedDualSlope.fileName ? updatedDualSlope : result
        )
      );

      const fileName = updatedDualSlope.fileName;
      setManuallyAdjusted(prev => ({
        ...prev,
        [fileName]: true
      }));

      // Auto-unapprove when user makes changes
      const newApprovalStatus = {
        ...approvalStatus,
        [fileName]: false
      };
      setApprovalStatus(newApprovalStatus);

      // Remove voltage assignment if file was unapproved
      if (voltageAssignments[fileName]) {
        const newVoltageAssignments = { ...voltageAssignments };
        delete newVoltageAssignments[fileName];
        setVoltageAssignments(newVoltageAssignments);
      }

      setTimeout(() => updateRegressionData(), 100);

      console.log(`Updated ${fileName}: auto-unapproved due to manual adjustment`);

    } catch (error) {
      console.error('Error updating dual marker:', error);
      setError(`Dual marker update failed: ${error.message}`);
    }
  };

  const getAvailableVoltages = () => {
    const assignedVoltages = new Set(Object.values(voltageAssignments));
    return AVAILABLE_VOLTAGES.filter(voltage => !assignedVoltages.has(voltage));
  };

  const getAssignedVoltages = () => {
    return new Set(Object.values(voltageAssignments));
  };

  const handleApprovalWithVoltage = (fileName, selectedVoltage) => {
    // Mark current file as approved
    const newApprovalStatus = {
      ...approvalStatus,
      [fileName]: true
    };
    setApprovalStatus(newApprovalStatus);

    // Assign voltage to this file
    const newVoltageAssignments = {
      ...voltageAssignments,
      [fileName]: selectedVoltage
    };
    setVoltageAssignments(newVoltageAssignments);

    console.log(`✓ Approved: ${fileName} for ±${selectedVoltage}V`);

    // Update regression data with new approval
    setTimeout(() => updateRegressionData(), 100);

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
    const unapprovedFiles = dualSlopeResults.filter(result => !approvalStatus[result.fileName]);
    const currentIndex = unapprovedFiles.findIndex(result => result.fileName === currentFileName);
    
    // Look for next unapproved file
    if (currentIndex >= 0 && currentIndex < unapprovedFiles.length - 1) {
      return unapprovedFiles[currentIndex + 1];
    }
    
    // If no next file, return first unapproved file (excluding current)
    const otherUnapproved = unapprovedFiles.filter(result => result.fileName !== currentFileName);
    return otherUnapproved.length > 0 ? otherUnapproved[0] : null;
  };

  const handleCSVExport = () => {
    if (Object.keys(voltageAssignments).length === 0) {
      alert('No voltage assignments to export');
      return;
    }

    try {
      const mappedResults = createUserAssignedVoltageMapping(dualSlopeResults, voltageAssignments);
      downloadDualCSV(mappedResults, testFormData);
      console.log('User-assigned voltage CSV export successful');
    } catch (error) {
      console.error('CSV Export failed:', error);
      setError(`CSV Export failed: ${error.message}`);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const mappedResults = Object.keys(voltageAssignments).length > 0 ? 
    createUserAssignedVoltageMapping(dualSlopeResults, voltageAssignments) : [];
  const isCurrentFileApproved = selectedFile ? approvalStatus[selectedFile.dualSlope.fileName] : false;
  const isCurrentFileManuallyAdjusted = selectedFile ? manuallyAdjusted[selectedFile.dualSlope.fileName] : false;

  React.useEffect(() => {
    if (selectedFile && selectedFile.data && selectedFile.dualSlope) {
      const chartElement = document.querySelector('#chart-svg');
      if (chartElement) {
        try {
          const container = chartElement.parentElement;
          const containerWidth = container ? container.offsetWidth - 20 : 800;
          
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

  React.useEffect(() => {
    updateRegressionData();
  }, [voltageAssignments, approvalStatus]);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>
          CSV Analysis Tool - Voltage Assignment System
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
          Schlatter Industries - User-Controlled Voltage/Velocity Analysis
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

      <TestDataForm 
        onFormDataChange={handleFormDataChange} 
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleFormCollapse}
      />

      <FileUpload onFilesProcessed={handleFilesProcessed} />

      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Analyzing dual slope data...
        </div>
      )}

      {dualSlopeResults.length > 0 && (
        <>
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
                      ✓ Approved for ±{voltageAssignments[selectedFile.dualSlope.fileName]}V {isCurrentFileManuallyAdjusted ? '(manually adjusted)' : ''}
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
                      (Requires re-approval with voltage selection after manual adjustment)
                    </p>
                  )}
                </div>
                
                <ApprovalButton
                  fileName={selectedFile.dualSlope.fileName}
                  isApproved={isCurrentFileApproved}
                  onApproveWithVoltage={handleApprovalWithVoltage}
                  availableVoltages={getAvailableVoltages()}
                  assignedVoltage={voltageAssignments[selectedFile.dualSlope.fileName]}
                />

                <VoltageOverview 
                  availableVoltages={AVAILABLE_VOLTAGES}
                  assignedVoltages={getAssignedVoltages()}
                />

                <RegressionChart 
                  data={regressionData}
                  width={800}
                  height={400}
                />

                {regressionData.length > 0 && (
                  <SpeedCheckAnalysis 
                    regressionData={regressionData}
                    selectedMachineType={testFormData?.maschinentyp || 'GAA100'}
                    onAnalysisUpdate={setSpeedCheckResults}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Export Section */}
      {Object.keys(voltageAssignments).length > 0 && (
        <div style={{ 
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #ddd',
          display: 'flex',
          gap: '15px',
          justifyContent: 'flex-start'
        }}>
          <button
            onClick={handleCSVExport}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: '#f8f9fa',
              color: '#333'
            }}
          >
            Export CSV
          </button>
        </div>
      )}

      {processedFiles.length === 0 && !isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Upload CSV files to begin voltage assignment analysis
        </div>
      )}
    </div>
  );
}

export default App;