import React, { useState } from 'react';
import TestDataForm from './components/forms/TestDataForm';
import FileUploadContainer from './containers/FileUploadContainer';
import AnalysisContainer from './containers/AnalysisContainer';
import { COLORS } from './constants/ui';

function App() {
  // File processing state
  const [processedFiles, setProcessedFiles] = useState([]);
  const [dualSlopeResults, setDualSlopeResults] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Approval and voltage assignment state
  const [approvalStatus, setApprovalStatus] = useState({});
  const [manuallyAdjusted, setManuallyAdjusted] = useState({});
  const [voltageAssignments, setVoltageAssignments] = useState({});

  // Analysis state
  const [testFormData, setTestFormData] = useState(null);
  const [regressionData, setRegressionData] = useState([]);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [speedCheckResults, setSpeedCheckResults] = useState(null);

  const handleFormDataChange = (formData) => {
    setTestFormData(formData);
    console.log('Form data updated:', formData);
  };

  const handleToggleFormCollapse = () => {
    setIsFormCollapsed(!isFormCollapsed);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <header style={{ marginBottom: '30px', borderBottom: `1px solid ${COLORS.BORDER_DEFAULT}`, paddingBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>
          CSV Analysis Tool - Voltage Assignment System
        </h1>
        <p style={{ margin: '5px 0 0 0', color: COLORS.TEXT_SECONDARY }}>
          Schlatter Industries - User-Controlled Voltage/Velocity Analysis
        </p>
      </header>

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: COLORS.ERROR_BACKGROUND, 
          border: `1px solid ${COLORS.ERROR}`, 
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px',
          color: COLORS.ERROR,
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
              color: COLORS.ERROR, 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Failed Files Warning */}
      {failedFiles.length > 0 && (
        <div style={{ 
          background: COLORS.WARNING_BACKGROUND, 
          border: `1px solid ${COLORS.WARNING}`, 
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
      <TestDataForm 
        onFormDataChange={handleFormDataChange} 
        isCollapsed={isFormCollapsed}
        onToggleCollapse={handleToggleFormCollapse}
      />

      {/* File Upload */}
      <FileUploadContainer
        processedFiles={processedFiles}
        setProcessedFiles={setProcessedFiles}
        dualSlopeResults={dualSlopeResults}
        setDualSlopeResults={setDualSlopeResults}
        failedFiles={failedFiles}
        setFailedFiles={setFailedFiles}
        approvalStatus={approvalStatus}
        setApprovalStatus={setApprovalStatus}
        manuallyAdjusted={manuallyAdjusted}
        setManuallyAdjusted={setManuallyAdjusted}
        setSelectedFile={setSelectedFile}
        setError={setError}
        setIsAnalyzing={setIsAnalyzing}
      />

      {/* Analysis Status */}
      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '20px', color: COLORS.TEXT_SECONDARY }}>
          Analyzing dual slope data...
        </div>
      )}

      {/* Analysis Container */}
      <AnalysisContainer
        processedFiles={processedFiles}
        dualSlopeResults={dualSlopeResults}
        setDualSlopeResults={setDualSlopeResults}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        approvalStatus={approvalStatus}
        setApprovalStatus={setApprovalStatus}
        manuallyAdjusted={manuallyAdjusted}
        setManuallyAdjusted={setManuallyAdjusted}
        voltageAssignments={voltageAssignments}
        setVoltageAssignments={setVoltageAssignments}
        regressionData={regressionData}
        setRegressionData={setRegressionData}
        testFormData={testFormData}
        speedCheckResults={speedCheckResults}
        setSpeedCheckResults={setSpeedCheckResults}
        setError={setError}
      />

      {/* Empty State */}
      {processedFiles.length === 0 && !isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '40px', color: COLORS.TEXT_SECONDARY }}>
          Upload CSV files to begin voltage assignment analysis
        </div>
      )}
    </div>
  );
}

export default App;