/**
 * Voltage Mapper Service
 * Maps velocities to voltage values (1-24V)
 */

export const mapVelocitiesToVoltages = (slopeResults) => {
  if (!slopeResults || slopeResults.length === 0) {
    return [];
  }

  // Sort by velocity (highest first)
  const sortedResults = [...slopeResults].sort((a, b) => b.velocity - a.velocity);

  // Assign voltages
  const mappedResults = sortedResults.map((result, index) => {
    const voltage = Math.min(24, sortedResults.length - index); // Ensure max 24V
    
    return {
      ...result,
      voltage: voltage,
      rank: index + 1
    };
  });

  return mappedResults;
};

export const generateVoltageTable = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    return [];
  }

  return mappedResults.map(result => ({
    voltage: result.voltage,
    fileName: result.fileName,
    velocity: result.velocity,
    duration: result.duration,
    startTime: result.startTime,
    endTime: result.endTime,
    rank: result.rank
  }));
};

export const exportToCSV = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    return '';
  }

  const headers = [
    'Voltage (V)',
    'File Name',
    'Velocity (mm/s)',
    'Duration (s)',
    'Start Time (s)',
    'End Time (s)',
    'Rank'
  ];

  const rows = mappedResults.map(result => [
    result.voltage,
    result.fileName,
    result.velocity.toFixed(6),
    result.duration.toFixed(3),
    result.startTime.toFixed(3),
    result.endTime.toFixed(3),
    result.rank
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

export const downloadCSV = (mappedResults, filename = 'voltage_velocity_mapping.csv') => {
  const csvContent = exportToCSV(mappedResults);
  
  if (!csvContent) {
    console.error('No data to export');
    return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const validateMapping = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    throw new Error('No results to validate');
  }

  // Check for duplicate voltages
  const voltages = mappedResults.map(r => r.voltage);
  const uniqueVoltages = new Set(voltages);
  
  if (voltages.length !== uniqueVoltages.size) {
    throw new Error('Duplicate voltage assignments detected');
  }

  // Check voltage range
  const maxVoltage = Math.max(...voltages);
  const minVoltage = Math.min(...voltages);
  
  if (maxVoltage > 24 || minVoltage < 1) {
    throw new Error(`Voltage out of range: ${minVoltage}V - ${maxVoltage}V`);
  }

  // Check velocity ordering
  for (let i = 1; i < mappedResults.length; i++) {
    if (mappedResults[i].velocity > mappedResults[i-1].velocity) {
      throw new Error('Results not properly sorted by velocity');
    }
  }

  return true;
};

export const getVoltageStatistics = (mappedResults) => {
  if (!mappedResults || mappedResults.length === 0) {
    return null;
  }

  const velocities = mappedResults.map(r => r.velocity);
  const voltages = mappedResults.map(r => r.voltage);

  return {
    totalFiles: mappedResults.length,
    velocityRange: {
      min: Math.min(...velocities),
      max: Math.max(...velocities),
      average: velocities.reduce((sum, v) => sum + v, 0) / velocities.length
    },
    voltageRange: {
      min: Math.min(...voltages),
      max: Math.max(...voltages)
    },
    velocityPerVolt: (Math.max(...velocities) - Math.min(...velocities)) / (Math.max(...voltages) - Math.min(...voltages))
  };
};