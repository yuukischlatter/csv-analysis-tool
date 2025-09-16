import React, { useEffect } from 'react';
import DualResultsTable from '../components/export/ResultsTable';
import ApprovalButton from '../components/common/ApprovalButton';
import RegressionChart from '../components/charts/RegressionChart';
import VoltageOverview from '../components/charts/VoltageOverview';
import SpeedCheckAnalysis from '../components/analysis/SpeedCheckAnalysis';
import ExportContainer from './ExportContainer';
import { recalculateDualVelocity } from '../services/slopeDetection';
import { createUserAssignedVoltageMapping } from '../services/voltageMapper';
import { prepareRegressionData } from '../services/regressionAnalysis';
import { createDualLineChart } from '../components/charts/LineChart';
import { AVAILABLE_VOLTAGES } from '../constants/voltages';
import { CHART_DIMENSIONS } from '../constants/charts';

const AnalysisContainer = ({
  processedFiles,
  dualSlopeResults,
  setDualSlopeResults,
  selectedFile,
  setSelectedFile,
  approvalStatus,
  setApprovalStatus,
  manuallyAdjusted,
  setManuallyAdjusted,
  voltageAssignments,
  setVoltageAssignments,
  regressionData,
  setRegressionData,
  testFormData,
  speedCheckResults,
  setSpeedCheckResults,
  setError,
  loadedSpeedCheckResults,
  setHasChanges,
  loadedProjectId,
  loadedFolderName,
  hasChanges
}) => {

  const updateRegressionData = () => {
    if (Object.keys(voltageAssignments).length > 0) {
      const mappedResults = createUserAssignedVoltageMapping(dualSlopeResults, voltageAssignments);
      const approvedData = prepareRegressionData(mappedResults, approvalStatus);
      setRegressionData(approvedData);
      console.log(`Regression data updated: ${approvedData.length} approved points`);
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
      
      // Only set manuallyAdjusted to true when user actually drags markers (detectionMethod becomes 'manual')
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

      // Mark as changed
      setHasChanges(true);

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

    // Mark as changed
    setHasChanges(true);

    console.log(`✓ Approved: ${fileName} for ±${selectedVoltage}V`);

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

  const mappedResults = Object.keys(voltageAssignments).length > 0 ? 
    createUserAssignedVoltageMapping(dualSlopeResults, voltageAssignments) : [];
  const isCurrentFileApproved = selectedFile ? approvalStatus[selectedFile.dualSlope.fileName] : false;
  const isCurrentFileManuallyAdjusted = selectedFile ? manuallyAdjusted[selectedFile.dualSlope.fileName] : false;

  // Chart rendering effect
  useEffect(() => {
    if (selectedFile && selectedFile.data && selectedFile.dualSlope) {
      const chartElement = document.querySelector('#chart-svg');
      if (chartElement) {
        try {
          const container = chartElement.parentElement;
          const containerWidth = container ? container.offsetWidth - 20 : CHART_DIMENSIONS.DEFAULT.width;
          
          createDualLineChart(
            chartElement,
            selectedFile.data.data,
            selectedFile.dualSlope,
            handleDualMarkerMove,
            containerWidth,
            CHART_DIMENSIONS.DEFAULT.height
          );
        } catch (error) {
          console.error('Dual chart rendering failed:', error);
        }
      }
    }
  }, [selectedFile]);

  // Update regression data when assignments change
  useEffect(() => {
    updateRegressionData();
  }, [voltageAssignments, approvalStatus]);

  // Don't render anything if no results
  if (!dualSlopeResults || dualSlopeResults.length === 0) {
    return null;
  }

  return (
    <>
      <DualResultsTable 
        results={mappedResults}
        dualSlopeResults={dualSlopeResults}
        voltageAssignments={voltageAssignments}
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
                color: selectedFile.dualSlope.detectionMethod === 'automatic' ? 'green' : 
                       selectedFile.dualSlope.detectionMethod === 'fallback' ? 'orange' : 'red',
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
              height={CHART_DIMENSIONS.DEFAULT.height}
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

            {false && ( // Just add "false &&" 
            <RegressionChart 
              data={regressionData}
              width={CHART_DIMENSIONS.REGRESSION.width}
              height={CHART_DIMENSIONS.REGRESSION.height}
              manualSlope={speedCheckResults?.manualSlope}
            />
            )}

            {regressionData.length > 0 && (
              <SpeedCheckAnalysis 
                regressionData={regressionData}
                testFormData={testFormData}
                onAnalysisUpdate={setSpeedCheckResults}
                initialAnalysis={loadedSpeedCheckResults}
                onManualChange={() => setHasChanges(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* Export Container - now with project tracking */}
      <ExportContainer
        dualSlopeResults={dualSlopeResults}
        voltageAssignments={voltageAssignments}
        testFormData={testFormData}
        speedCheckResults={speedCheckResults}
        regressionData={regressionData}
        processedFiles={processedFiles}      
        approvalStatus={approvalStatus}       
        manuallyAdjusted={manuallyAdjusted}   
        setError={setError}
        loadedProjectId={loadedProjectId}
        loadedFolderName={loadedFolderName}
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
      />
    </>
  );
};

export default AnalysisContainer;