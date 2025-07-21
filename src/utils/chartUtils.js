/**
 * Chart Utilities for Speed Check Analysis
 * Reusable D3.js helper functions for chart rendering
 */

import * as d3 from 'd3';

/**
 * Create D3 scale
 * @param {Array} domain - Scale domain [min, max]
 * @param {Array} range - Scale range [min, max]
 * @param {string} type - Scale type ('linear', 'ordinal')
 * @returns {Function} D3 scale function
 */
export const createScale = (domain, range, type = 'linear') => {
  switch (type) {
    case 'linear':
      return d3.scaleLinear().domain(domain).range(range);
    case 'ordinal':
      return d3.scaleOrdinal().domain(domain).range(range);
    default:
      return d3.scaleLinear().domain(domain).range(range);
  }
};

/**
 * Add grid lines to chart
 * @param {Object} g - D3 group element
 * @param {Function} xScale - X scale function
 * @param {Function} yScale - Y scale function
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 */
export const addGridLines = (g, xScale, yScale, width, height) => {
  // Vertical grid lines
  g.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .tickSize(-height)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.3)
    .style("stroke", "#ccc");

  // Horizontal grid lines
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.3)
    .style("stroke", "#ccc");
};

/**
 * Add speed limit horizontal lines to chart
 * @param {Object} g - D3 group element
 * @param {Object} machineParams - Machine parameters with speed limits
 * @param {Function} yScale - Y scale function
 * @param {number} width - Chart width
 */
export const addSpeedLimitLines = (g, machineParams, yScale, width) => {
  const limits = [
    { value: machineParams.lower, label: 'untere Grenze', color: 'lightgreen' },
    { value: machineParams.middle, label: 'mittig', color: 'green' },
    { value: machineParams.upper, label: 'obere Grenze', color: 'lightgreen' }
  ];

  limits.forEach(limit => {
    // Add horizontal line
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(limit.value))
      .attr("y2", yScale(limit.value))
      .attr("stroke", limit.color)
      .attr("stroke-dasharray", "5,5")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    // Add label
    g.append("text")
      .attr("x", width - 10)
      .attr("y", yScale(limit.value) - 5)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("fill", limit.color === 'green' ? 'green' : 'darkgreen')
      .attr("font-weight", "bold")
      .text(`relev. Brenngeschwindigkeit (${limit.label}): ${limit.value} mm/s`);
  });
};

/**
 * Add regression lines to chart
 * @param {Object} g - D3 group element
 * @param {Object} analysis - Analysis results
 * @param {Function} xScale - X scale function
 * @param {Function} yScale - Y scale function
 * @param {Array} voltageRange - Voltage range for line [min, max]
 */
export const addRegressionLines = (g, analysis, xScale, yScale, voltageRange) => {
  const [minVoltage, maxVoltage] = voltageRange;
  
  // Generate line data points
  const calculatedLineData = [];
  const manualLineData = [];
  
  for (let v = minVoltage; v <= maxVoltage; v += 0.1) {
    calculatedLineData.push({
      voltage: v,
      velocity: analysis.calculatedSlope * v + analysis.intercept
    });
    
    manualLineData.push({
      voltage: v,
      velocity: analysis.manualSlope * v
    });
  }

  // Line generator
  const line = d3.line()
    .x(d => xScale(d.voltage))
    .y(d => yScale(d.velocity));

  // Add calculated regression line (blue)
  g.append("path")
    .datum(calculatedLineData)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add manual regression line (red)
  g.append("path")
    .datum(manualLineData)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", line);
};

/**
 * Add measured data points to chart
 * @param {Object} g - D3 group element
 * @param {Array} data - Measurement data points
 * @param {Function} xScale - X scale function
 * @param {Function} yScale - Y scale function
 */
export const addDataPoints = (g, data, xScale, yScale) => {
  // Add line connecting points
  const line = d3.line()
    .x(d => xScale(d.voltage))
    .y(d => yScale(d.velocity));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Add data points
  g.selectAll(".data-point")
    .data(data)
    .enter().append("path")
    .attr("class", "data-point")
    .attr("d", d3.symbol().type(d3.symbolDiamond).size(64))
    .attr("transform", d => `translate(${xScale(d.voltage)},${yScale(d.velocity)})`)
    .attr("fill", "black")
    .attr("stroke", "white")
    .attr("stroke-width", 1);
};

/**
 * Add deviation percentage annotations
 * @param {Object} g - D3 group element
 * @param {Array} deviations - Deviation analysis data
 * @param {Function} xScale - X scale function
 * @param {Function} yScale - Y scale function
 * @param {Array} visibleRange - Visible voltage/speed range [[minV, maxV], [minS, maxS]]
 */
export const addDeviationAnnotations = (g, deviations, xScale, yScale, visibleRange) => {
  const [[minVoltage, maxVoltage], [minSpeed, maxSpeed]] = visibleRange;

  deviations.forEach(deviation => {
    const { targetSpeed, forecastedVoltage, deviation: devPercent } = deviation;
    
    // Only show annotations in visible range and for non-zero speeds
    if (targetSpeed > 0 && 
        forecastedVoltage >= minVoltage && forecastedVoltage <= maxVoltage &&
        targetSpeed >= minSpeed && targetSpeed <= maxSpeed) {
      
      g.append("text")
        .attr("x", xScale(forecastedVoltage))
        .attr("y", yScale(targetSpeed) - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("fill", "gray")
        .attr("font-weight", "bold")
        .text(`${devPercent.toFixed(1)}%`);
    }
  });
};

/**
 * Add overview chart with simplified rendering
 * @param {Object} g - D3 group element
 * @param {Array} fullData - Complete measurement data including negative values
 * @param {Object} analysis - Analysis results
 * @param {Function} xScale - X scale function
 * @param {Function} yScale - Y scale function
 * @param {Array} voltageRange - Full voltage range [min, max]
 */
export const addOverviewChart = (g, fullData, analysis, xScale, yScale, voltageRange) => {
  // Add data points (simplified - just circles)
  g.selectAll(".overview-point")
    .data(fullData)
    .enter().append("circle")
    .attr("class", "overview-point")
    .attr("cx", d => xScale(d.voltage))
    .attr("cy", d => yScale(d.velocity))
    .attr("r", 2)
    .attr("fill", "black")
    .attr("opacity", 0.7);

  // Add manual regression line across full range
  const [minVoltage, maxVoltage] = voltageRange;
  const manualLineData = [];
  
  for (let v = minVoltage; v <= maxVoltage; v += 0.2) {
    if (v >= 0) { // Only positive voltages for regression
      manualLineData.push({
        voltage: v,
        velocity: analysis.manualSlope * v
      });
    }
  }

  const line = d3.line()
    .x(d => xScale(d.voltage))
    .y(d => yScale(d.velocity));

  g.append("path")
    .datum(manualLineData)
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", line);
};

/**
 * Filter voltage data by range
 * @param {Array} data - Input data array
 * @param {number} minVoltage - Minimum voltage (inclusive)
 * @param {number} maxVoltage - Maximum voltage (inclusive)
 * @returns {Array} Filtered data array
 */
export const filterVoltageRange = (data, minVoltage, maxVoltage) => {
  return data.filter(point => 
    point.voltage >= minVoltage && point.voltage <= maxVoltage
  );
};

/**
 * Generate measurement data for specific voltage range
 * @param {string} range - 'filtered' for 0-4.5V, 'full' for complete range
 * @returns {Array} Measurement data points
 */
export const generateMeasurementData = (range = 'filtered') => {
  if (range === 'filtered') {
    // Filtered data for main chart - only 0 to 4.5V range
    const voltages = [
      0.00, 0.10, 0.20, 0.30, 0.40, 0.50, 0.75, 1.00, 1.50, 2.00, 2.50, 3.00, 4.00
    ];
    
    const speeds = [
      0.00, 0.42, 0.74, 1.05, 1.36, 1.64, 2.37, 3.07, 4.49, 5.84, 7.09, 8.40, 10.60
    ];

    return voltages.map((voltage, index) => ({
      voltage: voltage,
      velocity: speeds[index]
    }));
  } else {
    // Full measurement data including negative values
    const voltages = [
      -10.00, -9.00, -7.00, -5.00, -4.00, -3.00, -2.50, -2.00, -1.50, -1.00, 
      -0.75, -0.50, -0.40, -0.30, -0.20, -0.10, 0.00, 0.10, 0.20, 0.30, 
      0.40, 0.50, 0.75, 1.00, 1.50, 2.00, 2.50, 3.00, 4.00, 5.00, 7.00, 9.00, 10.00
    ];
    
    const speeds = [
      12.57, 13.67, 14.00, 11.00, 9.31, 7.46, 6.29, 5.16, 3.98, 2.74, 
      2.14, 1.48, 1.24, 0.96, 0.67, 0.37, 0.00, 0.42, 0.74, 1.05, 
      1.36, 1.64, 2.37, 3.07, 4.49, 5.84, 7.09, 8.40, 10.60, 12.79, 14.37, 13.30, 11.94
    ];

    return voltages.map((voltage, index) => ({
      voltage: voltage,
      velocity: speeds[index]
    }));
  }
};

/**
 * Format deviation label text
 * @param {number} deviation - Deviation percentage
 * @returns {string} Formatted label
 */
export const formatDeviationLabel = (deviation) => {
  const sign = deviation >= 0 ? '+' : '';
  return `${sign}${deviation.toFixed(1)}%`;
};

/**
 * Get color for deviation based on magnitude
 * @param {number} deviation - Deviation percentage
 * @returns {string} Color code
 */
export const getDeviationColor = (deviation) => {
  const absDeviation = Math.abs(deviation);
  
  if (absDeviation <= 2) return '#28a745'; // Green - good
  if (absDeviation <= 5) return '#ffc107'; // Yellow - warning
  return '#dc3545'; // Red - problematic
};

/**
 * Add chart axes with labels
 * @param {Object} g - D3 group element
 * @param {Function} xScale - X scale function
 * @param {Function} yScale - Y scale function
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @param {Object} labels - Axis labels {x: string, y: string}
 */
export const addAxes = (g, xScale, yScale, width, height, labels) => {
  // X axis
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .style("stroke", "black")
    .style("stroke-width", "1px");

  // Y axis
  g.append("g")
    .call(d3.axisLeft(yScale))
    .style("stroke", "black")
    .style("stroke-width", "1px");

  // X axis label
  g.append("text")
    .attr("transform", `translate(${width / 2}, ${height + 40})`)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", "black")
    .text(labels.x || "Eingangsspannung UE [V]");

  // Y axis label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", "black")
    .text(labels.y || "Schlittengeschwindigkeit [mm/s]");
};

/**
 * Add chart title
 * @param {Object} g - D3 group element
 * @param {string} title - Chart title
 * @param {number} width - Chart width
 */
export const addChartTitle = (g, title, width) => {
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "black")
    .text(title);
};

/**
 * Chart styling constants
 */
export const CHART_STYLES = {
  colors: {
    calculatedLine: 'blue',
    manualLine: 'red',
    dataPoints: 'black',
    dataPointsBorder: 'white',
    gridLines: '#ccc',
    speedLimits: {
      lower: 'lightgreen',
      middle: 'green',
      upper: 'lightgreen'
    }
  },
  strokeWidths: {
    regressionLines: 2,
    dataLines: 2,
    dataPointsBorder: 1,
    gridLines: 1,
    speedLimitLines: 1
  },
  fontSizes: {
    title: '14px',
    axisLabels: '12px',
    deviationLabels: '8px',
    speedLimitLabels: '10px'
  }
};