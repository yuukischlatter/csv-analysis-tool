/**
 * Dual Voltage Mapper Service
 * Maps velocities to bidirectional voltage values (-10V to +10V)
 * Handles ramp up and ramp down pairs
 */

export const VOLTAGE_SCALE = [
  -10.00, -9.00, -7.00, -5.00, -4.00, -3.00, -2.50, -2.00,
  -1.50, -1.00, -0.75, -0.50, -0.40, -0.30, -0.20, -0.10,
  0.00,
  0.10, 0.20, 0.30, 0.40, 0.50, 0.75, 1.00,
  1.50, 2.00, 2.50, 3.00, 4.00, 5.00, 7.00, 9.00, 10.00
];

export const mapDualVelocitiesToVoltages = (dualSlopeResults) => {
  if (!dualSlopeResults || dualSlopeResults.length === 0) {
    return [];
  }

  // Create combined velocity array for sorting
  const velocityEntries = [];
  
  dualSlopeResults.forEach(result => {
    // Add ramp up entry
    velocityEntries.push({
      fileName: result.fileName,
      rampType: 'up',
      velocity: result.rampUp.velocity,
      rampData: result.rampUp,
      originalResult: result
    });
    
    // Add ramp down entry
    velocityEntries.push({
      fileName: result.fileName,
      rampType: 'down',
      velocity: result.rampDown.velocity,
      rampData: result.rampDown,
      originalResult: result
    });
  });

  // Sort by velocity (highest first)
  const sortedEntries = velocityEntries.sort((a, b) => b.velocity - a.velocity);

  // Assign voltages symmetrically
  const mappedResults = [];
  const positiveVoltages = VOLTAGE_SCALE.filter(v => v > 0).reverse(); // Start with highest positive
  const negativeVoltages = VOLTAGE_SCALE.filter(v => v < 0); // Start with highest negative (closest to 0)
  
  // Add zero voltage entry
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

  let positiveIndex = 0;
  let negativeIndex = 0;

  sortedEntries.forEach((entry, index) => {
    let assignedVoltage;
    
    if (entry.rampType === 'up') {
      // Assign positive voltage
      if (positiveIndex < positiveVoltages.length) {
        assignedVoltage = positiveVoltages[positiveIndex];
        positiveIndex++;
      } else {
        assignedVoltage = positiveVoltages[positiveVoltages.length - 1]; // Use highest if we run out
      }
    } else {
      // Assign negative voltage
      if (negativeIndex < negativeVoltages.length) {
        assignedVoltage = negativeVoltages[negativeIndex];
        negativeIndex++;
      } else {
        assignedVoltage = negativeVoltages[negativeVoltages.length - 1]; // Use lowest if we run out
      }
    }

    mappedResults.push({
      fileName: entry.fileName,
      voltage: assignedVoltage,
      velocity: entry.velocity,
      rampType: entry.rampType,
      duration: entry.rampData.duration,
      startTime: entry.rampData.startTime,
      endTime: entry.rampData.endTime,
      startIndex: entry.rampData.startIndex,
      endIndex: entry.rampData.endIndex,
      startPosition: entry.rampData.startPosition,
      endPosition: entry.rampData.endPosition,
      rank: index + 1,
      detectionMethod: entry.originalResult.detectionMethod
    });
  });

  // Sort final results by voltage (positive to negative)
  return mappedResults.sort((a, b) => b.voltage - a.voltage);
};

export const exportDualToCSV = (mappedResults, testFormData = null) => {
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
    csvLines.push('=== MESSERGEBNISSE BIDIREKTIONAL ===');
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
    'Rank'
  ];

  csvLines.push(headers.join(','));

  // Add data rows
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
    csvLines.push(row.join(','));
  });

  // Add summary statistics if test data is available
  if (testFormData && dataRows.length > 0) {
    csvLines.push('');
    csvLines.push('=== STATISTIK BIDIREKTIONAL ===');
    csvLines.push('');
    
    const upRamps = dataRows.filter(r => r.rampType === 'up');
    const downRamps = dataRows.filter(r => r.rampType === 'down');
    
    const allVelocities = dataRows.map(r => r.velocity);
    const upVelocities = upRamps.map(r => r.velocity);
    const downVelocities = downRamps.map(r => r.velocity);
    
    csvLines.push(`Anzahl CSV-Dateien,${mappedResults.filter(r => r.rampType !== 'reference').length / 2}`);
    csvLines.push(`Anzahl Ramp Up Messungen,${upRamps.length}`);
    csvLines.push(`Anzahl Ramp Down Messungen,${downRamps.length}`);
    csvLines.push('');
    
    if (allVelocities.length > 0) {
      csvLines.push(`Geschwindigkeit Min (gesamt),${Math.min(...allVelocities).toFixed(6)} mm/s`);
      csvLines.push(`Geschwindigkeit Max (gesamt),${Math.max(...allVelocities).toFixed(6)} mm/s`);
      csvLines.push(`Geschwindigkeit Durchschnitt (gesamt),${(allVelocities.reduce((sum, v) => sum + v, 0) / allVelocities.length).toFixed(6)} mm/s`);
    }
    
    if (upVelocities.length > 0) {
      csvLines.push(`Geschwindigkeit Durchschnitt (Up),${(upVelocities.reduce((sum, v) => sum + v, 0) / upVelocities.length).toFixed(6)} mm/s`);
    }
    
    if (downVelocities.length > 0) {
      csvLines.push(`Geschwindigkeit Durchschnitt (Down),${(downVelocities.reduce((sum, v) => sum + v, 0) / downVelocities.length).toFixed(6)} mm/s`);
    }
    
    const voltageRange = dataRows.map(r => r.voltage);
    csvLines.push(`Spannungsbereich,${Math.min(...voltageRange).toFixed(2)}V bis ${Math.max(...voltageRange).toFixed(2)}V`);
    
    // Add timestamp
    const timestamp = new Date().toLocaleString('de-DE');
    csvLines.push('');
    csvLines.push(`Export Zeitstempel,${timestamp}`);
  }

  return csvLines.join('\n');
};

export const downloadDualCSV = (mappedResults, testFormData = null, filename = null) => {
  const csvContent = exportDualToCSV(mappedResults, testFormData);
  
  if (!csvContent) {
    console.error('No data to export');
    return;
  }

  // Generate filename with test data if available
  let finalFilename = filename;
  if (!finalFilename) {
    if (testFormData && testFormData.auftragsNr) {
      finalFilename = `Ventil_Analyse_Bidirektional_${testFormData.auftragsNr}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      finalFilename = `dual_voltage_velocity_mapping_${new Date().toISOString().split('T')[0]}.csv`;
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

  console.log(`Dual export completed: ${finalFilename}`);
  if (testFormData) {
    console.log('Export includes test form data and bidirectional statistics');
  }
};

export const validateDualMapping = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    throw new Error('No results to validate');
  }

  const dataRows = mappedResults.filter(r => r.rampType !== 'reference');
  
  // Check for duplicate voltages
  const voltages = dataRows.map(r => r.voltage);
  const uniqueVoltages = new Set(voltages);
  
  if (voltages.length !== uniqueVoltages.size) {
    throw new Error('Duplicate voltage assignments detected');
  }

  // Check voltage range
  const maxVoltage = Math.max(...voltages);
  const minVoltage = Math.min(...voltages);
  
  if (maxVoltage > 10 || minVoltage < -10) {
    throw new Error(`Voltage out of range: ${minVoltage}V - ${maxVoltage}V (should be -10V to +10V)`);
  }

  // Check that we have both up and down ramps
  const upRamps = dataRows.filter(r => r.rampType === 'up');
  const downRamps = dataRows.filter(r => r.rampType === 'down');
  
  if (upRamps.length === 0 || downRamps.length === 0) {
    throw new Error('Missing ramp up or ramp down measurements');
  }

  return true;
};

export const getDualVoltageStatistics = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    return null;
  }

  const dataRows = mappedResults.filter(r => r.rampType !== 'reference');
  const upRamps = dataRows.filter(r => r.rampType === 'up');
  const downRamps = dataRows.filter(r => r.rampType === 'down');
  
  const allVelocities = dataRows.map(r => r.velocity);
  const upVelocities = upRamps.map(r => r.velocity);
  const downVelocities = downRamps.map(r => r.velocity);
  const voltages = dataRows.map(r => r.voltage);

  return {
    totalFiles: dataRows.length / 2,
    totalMeasurements: dataRows.length,
    upRampCount: upRamps.length,
    downRampCount: downRamps.length,
    velocityRange: {
      min: Math.min(...allVelocities),
      max: Math.max(...allVelocities),
      average: allVelocities.reduce((sum, v) => sum + v, 0) / allVelocities.length,
      upAverage: upVelocities.length > 0 ? upVelocities.reduce((sum, v) => sum + v, 0) / upVelocities.length : 0,
      downAverage: downVelocities.length > 0 ? downVelocities.reduce((sum, v) => sum + v, 0) / downVelocities.length : 0
    },
    voltageRange: {
      min: Math.min(...voltages),
      max: Math.max(...voltages),
      positiveCount: voltages.filter(v => v > 0).length,
      negativeCount: voltages.filter(v => v < 0).length
    }
  };
};