/**
 * User-Controlled Voltage Mapper Service
 * Maps user-assigned voltages to CSV files instead of automatic sorting
 * Handles voltage pairs (±9V → both -9V and +9V entries)
 */

export const VOLTAGE_SCALE = [
  -10.00, -9.00, -7.00, -5.00, -4.00, -3.00, -2.50, -2.00,
  -1.50, -1.00, -0.75, -0.50, -0.40, -0.30, -0.20, -0.10,
  0.00,
  0.10, 0.20, 0.30, 0.40, 0.50, 0.75, 1.00,
  1.50, 2.00, 2.50, 3.00, 4.00, 5.00, 7.00, 9.00, 10.00
];

/**
 * Creates voltage mapping based on user assignments during approval
 * @param {Array} dualSlopeResults - Array of processed CSV results
 * @param {Object} voltageAssignments - Object mapping fileName -> voltage magnitude
 * @returns {Array} Mapped results with user-assigned voltages
 */
export const createUserAssignedVoltageMapping = (dualSlopeResults, voltageAssignments) => {
  if (!dualSlopeResults || dualSlopeResults.length === 0 || !voltageAssignments) {
    return [];
  }

  const mappedResults = [];

  // Add reference row (0V)
  mappedResults.push({
    fileName: 'REFERENCE',
    voltage: 0.00,
    velocity: 0.000000,
    rampType: 'reference',
    duration: 0,
    startTime: 0,
    endTime: 0,
    rank: 'REF'
  });

  // Process each file that has been assigned a voltage
  Object.entries(voltageAssignments).forEach(([fileName, voltageMagnitude]) => {
    const result = dualSlopeResults.find(r => r.fileName === fileName);
    
    if (!result) {
      console.warn(`No dual slope result found for ${fileName}`);
      return;
    }

    // Handle special case: 0V only creates one entry
    if (voltageMagnitude === 0) {
      mappedResults.push({
        fileName: fileName,
        voltage: 0.00,
        velocity: 0.000000, // 0V should be 0 velocity
        rampType: 'reference',
        duration: 0,
        startTime: 0,
        endTime: 0,
        rank: 'ZERO',
        detectionMethod: result.detectionMethod
      });
      return;
    }

    // Create positive voltage entry (ramp up)
    mappedResults.push({
      fileName: fileName,
      voltage: voltageMagnitude, // Positive voltage
      velocity: result.rampUp.velocity, // Positive velocity from ramp up
      rampType: 'up',
      duration: result.rampUp.duration,
      startTime: result.rampUp.startTime,
      endTime: result.rampUp.endTime,
      startIndex: result.rampUp.startIndex,
      endIndex: result.rampUp.endIndex,
      startPosition: result.rampUp.startPosition,
      endPosition: result.rampUp.endPosition,
      rank: `+${voltageMagnitude}V`,
      detectionMethod: result.detectionMethod
    });

    // Create negative voltage entry (ramp down)
    mappedResults.push({
      fileName: fileName,
      voltage: -voltageMagnitude, // Negative voltage
      velocity: -Math.abs(result.rampDown.velocity), // Negative velocity for regression
      rampType: 'down',
      duration: result.rampDown.duration,
      startTime: result.rampDown.startTime,
      endTime: result.rampDown.endTime,
      startIndex: result.rampDown.startIndex,
      endIndex: result.rampDown.endIndex,
      startPosition: result.rampDown.startPosition,
      endPosition: result.rampDown.endPosition,
      rank: `-${voltageMagnitude}V`,
      detectionMethod: result.detectionMethod
    });
  });

  // Sort by voltage (positive to negative) for display
  return mappedResults.sort((a, b) => b.voltage - a.voltage);
};

/**
 * Export user-assigned voltage data to CSV format
 */
export const exportUserAssignedToCSV = (mappedResults, testFormData = null) => {
  if (!mappedResults || mappedResults.length === 0) {
    return '';
  }

  const csvLines = [];

  // Add test form data header if available
  if (testFormData) {
    csvLines.push('=== PRÜFDATEN ===');
    csvLines.push('');
    
    // Auftragsdaten
    csvLines.push('AUFTRAGSDATEN');
    csvLines.push(`Auftrags-Nr.,${testFormData.auftragsNr || ''}`);
    csvLines.push(`Maschinentyp,${testFormData.maschinentyp || ''}`);
    csvLines.push('');
    
    // Prüfung
    csvLines.push('PRÜFUNG');
    csvLines.push(`Prüfer,${testFormData.pruefer || ''}`);
    csvLines.push(`Datum,${testFormData.datum || ''}`);
    csvLines.push('');
    
    // Regelventil
    csvLines.push('REGELVENTIL');
    csvLines.push(`Art.-Nr. S-CH,${testFormData.artNrSCH || ''}`);
    csvLines.push(`Art.-Nr. Parker,${testFormData.artNrParker || ''}`);
    csvLines.push(`Nenndurchfluss,${testFormData.nenndurchfluss || ''}`);
    csvLines.push(`S/N Parker,${testFormData.snParker || ''}`);
    csvLines.push('');
    
    // Prüfbedingungen
    csvLines.push('PRÜFBEDINGUNGEN');
    csvLines.push(`Ventil-Offset UEQ (mit AQ60) Originalzustand,${testFormData.ventilOffsetOriginal || ''} V`);
    csvLines.push(`Ventil-Offset Korrekturen in Parker-Software,${testFormData.ventilOffsetKorrektur || ''} %`);
    csvLines.push(`Ventil-Offset UEQ nach Korrektur,${testFormData.ventilOffsetNachKorrektur || ''} V`);
    csvLines.push(`Druck am Ventil / an der Pumpe,${testFormData.druckVentil || ''} Bar`);
    csvLines.push(`Öltemperatur vor Start der Messung,${testFormData.oeltemperatur || ''} °C`);
    csvLines.push('');
    csvLines.push('=== MESSERGEBNISSE USER-ASSIGNED ===');
    csvLines.push('');
  }

  // Add measurement results header
  const headers = [
    'Eingangsspannung UE (V)',
    'Ramp Type',
    'File Name',
    'Velocity (mm/s)',
    'Duration (s)',
    'Start Time (s)',
    'End Time (s)',
    'Assignment'
  ];

  csvLines.push(headers.join(';'));

  // Add data rows (exclude reference)
  const dataRows = mappedResults.filter(result => result.rampType !== 'reference');
  dataRows.forEach(result => {
    const row = [
      result.voltage.toFixed(2),
      result.rampType === 'up' ? 'Ramp Up ↗️' : 'Ramp Down ↘️',
      result.fileName,
      result.velocity.toFixed(6),
      result.duration.toFixed(3),
      result.startTime.toFixed(3),
      result.endTime.toFixed(3),
      result.rank
    ];
    csvLines.push(row.join(';'));
  });

  // Add summary statistics
  if (testFormData && dataRows.length > 0) {
    csvLines.push('');
    csvLines.push('=== STATISTIK USER-ASSIGNED ===');
    csvLines.push('');
    
    const uniqueFiles = [...new Set(dataRows.map(r => r.fileName))];
    const upRamps = dataRows.filter(r => r.rampType === 'up');
    const downRamps = dataRows.filter(r => r.rampType === 'down');
    
    const allVelocities = dataRows.map(r => r.velocity);
    const voltages = dataRows.map(r => r.voltage);
    
    csvLines.push(`Anzahl CSV-Dateien (User-Assigned),${uniqueFiles.length}`);
    csvLines.push(`Anzahl Voltage Assignments,${dataRows.length}`);
    csvLines.push(`Anzahl Ramp Up Messungen,${upRamps.length}`);
    csvLines.push(`Anzahl Ramp Down Messungen,${downRamps.length}`);
    csvLines.push('');
    
    if (allVelocities.length > 0) {
      csvLines.push(`Geschwindigkeit Min,${Math.min(...allVelocities).toFixed(6)} mm/s`);
      csvLines.push(`Geschwindigkeit Max,${Math.max(...allVelocities).toFixed(6)} mm/s`);
      csvLines.push(`Geschwindigkeit Durchschnitt,${(allVelocities.reduce((sum, v) => sum + v, 0) / allVelocities.length).toFixed(6)} mm/s`);
    }
    
    csvLines.push(`Spannungsbereich,${Math.min(...voltages).toFixed(2)}V bis ${Math.max(...voltages).toFixed(2)}V`);
    csvLines.push(`User-Assignment Methode,Manual voltage selection during approval`);
    
    // Add timestamp
    const timestamp = new Date().toLocaleString('de-DE');
    csvLines.push('');
    csvLines.push(`Export Zeitstempel,${timestamp}`);
    csvLines.push(`Export Typ,User-Assigned Voltage Mapping`);
  }

  return csvLines.join('\n');
};

/**
 * Download user-assigned voltage mapping as CSV
 */
export const downloadDualCSV = (mappedResults, testFormData = null, filename = null) => {
  const csvContent = exportUserAssignedToCSV(mappedResults, testFormData);
  
  if (!csvContent) {
    console.error('No data to export');
    return;
  }

  // Generate filename with test data if available
  let finalFilename = filename;
  if (!finalFilename) {
    if (testFormData && testFormData.auftragsNr) {
      finalFilename = `Ventil_Analyse_UserAssigned_${testFormData.auftragsNr}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      finalFilename = `user_assigned_voltage_mapping_${new Date().toISOString().split('T')[0]}.csv`;
    }
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  console.log(`User-assigned export completed: ${finalFilename}`);
  if (testFormData) {
    console.log('Export includes test form data and user-assignment statistics');
  }
};

/**
 * Validate user-assigned voltage mapping
 */
export const validateUserAssignedMapping = (mappedResults, voltageAssignments) => {
  if (!mappedResults || mappedResults.length === 0) {
    throw new Error('No results to validate');
  }

  const dataRows = mappedResults.filter(r => r.rampType !== 'reference');
  
  // Check that we have voltage assignments
  if (!voltageAssignments || Object.keys(voltageAssignments).length === 0) {
    throw new Error('No voltage assignments found');
  }

  // Check for expected voltage pairs (except 0V)
  const assignedMagnitudes = Object.values(voltageAssignments);
  assignedMagnitudes.forEach(magnitude => {
    if (magnitude === 0) return; // 0V is special case
    
    const positiveEntry = dataRows.find(r => r.voltage === magnitude);
    const negativeEntry = dataRows.find(r => r.voltage === -magnitude);
    
    if (!positiveEntry || !negativeEntry) {
      throw new Error(`Missing voltage pair for ±${magnitude}V`);
    }
  });

  // Check voltage range
  const voltages = dataRows.map(r => r.voltage);
  const maxVoltage = Math.max(...voltages);
  const minVoltage = Math.min(...voltages);
  
  if (maxVoltage > 10 || minVoltage < -10) {
    throw new Error(`Voltage out of range: ${minVoltage}V - ${maxVoltage}V (should be -10V to +10V)`);
  }

  return true;
};

/**
 * Get statistics for user-assigned voltage mapping
 */
export const getUserAssignedStatistics = (mappedResults, voltageAssignments) => {
  if (!mappedResults || mappedResults.length === 0 || !voltageAssignments) {
    return null;
  }

  const dataRows = mappedResults.filter(r => r.rampType !== 'reference');
  const uniqueFiles = [...new Set(dataRows.map(r => r.fileName))];
  const upRamps = dataRows.filter(r => r.rampType === 'up');
  const downRamps = dataRows.filter(r => r.rampType === 'down');
  
  const allVelocities = dataRows.map(r => r.velocity);
  const voltages = dataRows.map(r => r.voltage);
  const assignedMagnitudes = Object.values(voltageAssignments);

  return {
    totalFiles: uniqueFiles.length,
    totalAssignments: Object.keys(voltageAssignments).length,
    totalVoltageEntries: dataRows.length,
    upRampCount: upRamps.length,
    downRampCount: downRamps.length,
    assignedVoltageMagnitudes: assignedMagnitudes.sort((a, b) => b - a),
    velocityRange: {
      min: allVelocities.length > 0 ? Math.min(...allVelocities) : 0,
      max: allVelocities.length > 0 ? Math.max(...allVelocities) : 0,
      average: allVelocities.length > 0 ? allVelocities.reduce((sum, v) => sum + v, 0) / allVelocities.length : 0
    },
    voltageRange: {
      min: voltages.length > 0 ? Math.min(...voltages) : 0,
      max: voltages.length > 0 ? Math.max(...voltages) : 0,
      positiveCount: voltages.filter(v => v > 0).length,
      negativeCount: voltages.filter(v => v < 0).length,
      zeroCount: voltages.filter(v => v === 0).length
    }
  };
};