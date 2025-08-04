/**
 * Chart Utilities for Speed Check Analysis
 * Reusable D3.js helper functions for chart rendering
 */

import * as d3 from 'd3';
import { CHART_COLORS, STROKE_WIDTHS, CHART_FONTS, CHART_SIZES, GRID_CONFIG } from '../constants/charts';

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
    .style("stroke-dasharray", GRID_CONFIG.STROKE_DASHARRAY)
    .style("opacity", 0.3)
    .style("stroke", CHART_COLORS.GRID_LINES);

  // Horizontal grid lines
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat("")
    )
    .style("stroke-dasharray", GRID_CONFIG.STROKE_DASHARRAY)
    .style("opacity", 0.3)
    .style("stroke", CHART_COLORS.GRID_LINES);
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
    { value: machineParams.lower, label: 'untere Grenze', color: CHART_COLORS.SPEED_LIMIT_LOWER },
    { value: machineParams.middle, label: 'mittig', color: CHART_COLORS.SPEED_LIMIT_MIDDLE },
    { value: machineParams.upper, label: 'obere Grenze', color: CHART_COLORS.SPEED_LIMIT_UPPER }
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
      .attr("stroke-width", STROKE_WIDTHS.SPEED_LIMIT_LINES)
      .attr("opacity", 0.8);

    // Add label
    g.append("text")
      .attr("x", width - 10)
      .attr("y", yScale(limit.value) - 5)
      .attr("text-anchor", "end")
      .attr("font-size", CHART_FONTS.SPEED_LIMIT_LABELS)
      .attr("fill", limit.color === CHART_COLORS.SPEED_LIMIT_MIDDLE ? CHART_COLORS.SPEED_LIMIT_MIDDLE : 'darkgreen')
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
    .attr("stroke", CHART_COLORS.CALCULATED_LINE)
    .attr("stroke-width", STROKE_WIDTHS.REGRESSION_LINES)
    .attr("d", line);

  // Add manual regression line (red)
  g.append("path")
    .datum(manualLineData)
    .attr("fill", "none")
    .attr("stroke", CHART_COLORS.MANUAL_LINE)
    .attr("stroke-width", STROKE_WIDTHS.REGRESSION_LINES)
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
    .attr("stroke", CHART_COLORS.DATA_POINTS)
    .attr("stroke-width", STROKE_WIDTHS.REGRESSION_LINES)
    .attr("d", line);

  // Add data points
  g.selectAll(".data-point")
    .data(data)
    .enter().append("path")
    .attr("class", "data-point")
    .attr("d", d3.symbol().type(d3.symbolDiamond).size(CHART_SIZES.SYMBOL_SIZE))
    .attr("transform", d => `translate(${xScale(d.voltage)},${yScale(d.velocity)})`)
    .attr("fill", CHART_COLORS.DATA_POINTS)
    .attr("stroke", CHART_COLORS.DATA_POINTS_BORDER)
    .attr("stroke-width", STROKE_WIDTHS.DATA_POINTS_BORDER);
};

/**
 * Add deviation percentage annotations near measured data points
 * @param {Object} g - D3 group element
 * @param {Array} deviations - Deviation analysis data with measured points
 * @param {Function} xScale - X scale function
 * @param {Function} yScale - Y scale function
 * @param {Array} visibleRange - Visible voltage/speed range [[minV, maxV], [minS, maxS]]
 */
export const addDeviationAnnotations = (g, deviations, xScale, yScale, visibleRange) => {
  const [[minVoltage, maxVoltage], [minSpeed, maxSpeed]] = visibleRange;

  deviations.forEach(deviation => {
    const { measuredVoltage, measuredVelocity, deviation: devPercent } = deviation;
    
    // Only show annotations in visible range and for non-zero voltages
    if (measuredVoltage > 0 && 
        measuredVoltage >= minVoltage && measuredVoltage <= maxVoltage &&
        measuredVelocity >= minSpeed && measuredVelocity <= maxSpeed) {
      
      // Position label near the measured data point (offset slightly to avoid overlap)
      const labelX = xScale(measuredVoltage);
      const labelY = yScale(measuredVelocity) - 12; // Offset above the diamond symbol
      
      // Get color based on deviation magnitude
      const labelColor = getDeviationColor(devPercent);
      
      // Add background rectangle for better readability
      const labelText = formatDeviationLabel(devPercent);
      const textWidth = labelText.length * 3.5; // Approximate text width
      
      g.append("rect")
        .attr("x", labelX - textWidth/2 - 2)
        .attr("y", labelY - 6)
        .attr("width", textWidth + 4)
        .attr("height", 10)
        .attr("fill", "white")
        .attr("stroke", labelColor)
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.9)
        .attr("rx", 2);
      
      // Add percentage text
      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", CHART_FONTS.DEVIATION_LABELS)
        .attr("fill", labelColor)
        .attr("font-weight", "bold")
        .text(labelText);
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
    .attr("r", CHART_SIZES.OVERVIEW_POINTS)
    .attr("fill", CHART_COLORS.OVERVIEW_POINTS)
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
    .attr("stroke", CHART_COLORS.MANUAL_LINE)
    .attr("stroke-width", STROKE_WIDTHS.REGRESSION_LINES)
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
 * Format deviation label text
 * @param {number} deviation - Deviation percentage
 * @returns {string} Formatted label
 */
export const formatDeviationLabel = (deviation) => {
  if (Math.abs(deviation) < 0.1) {
    return '0.0%';
  }
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
    .style("stroke", CHART_COLORS.AXES)
    .style("stroke-width", STROKE_WIDTHS.CHART_AXES + "px");

  // Y axis
  g.append("g")
    .call(d3.axisLeft(yScale))
    .style("stroke", CHART_COLORS.AXES)
    .style("stroke-width", STROKE_WIDTHS.CHART_AXES + "px");

  // X axis label
  g.append("text")
    .attr("transform", `translate(${width / 2}, ${height + 40})`)
    .style("text-anchor", "middle")
    .style("font-size", CHART_FONTS.AXIS_LABELS)
    .style("font-weight", "bold")
    .style("fill", CHART_COLORS.AXES)
    .text(labels.x || "Eingangsspannung UE [V]");

  // Y axis label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-size", CHART_FONTS.AXIS_LABELS)
    .style("font-weight", "bold")
    .style("fill", CHART_COLORS.AXES)
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
    .style("font-size", CHART_FONTS.TITLE)
    .style("font-weight", "bold")
    .style("fill", CHART_COLORS.AXES)
    .text(title);
};

/**
 * Chart styling constants
 */
export const CHART_STYLES = {
  colors: {
    calculatedLine: CHART_COLORS.CALCULATED_LINE,
    manualLine: CHART_COLORS.MANUAL_LINE,
    dataPoints: CHART_COLORS.DATA_POINTS,
    dataPointsBorder: CHART_COLORS.DATA_POINTS_BORDER,
    gridLines: CHART_COLORS.GRID_LINES,
    speedLimits: {
      lower: CHART_COLORS.SPEED_LIMIT_LOWER,
      middle: CHART_COLORS.SPEED_LIMIT_MIDDLE,
      upper: CHART_COLORS.SPEED_LIMIT_UPPER
    }
  },
  strokeWidths: {
    regressionLines: STROKE_WIDTHS.REGRESSION_LINES,
    dataLines: STROKE_WIDTHS.REGRESSION_LINES,
    dataPointsBorder: STROKE_WIDTHS.DATA_POINTS_BORDER,
    gridLines: STROKE_WIDTHS.GRID_LINES,
    speedLimitLines: STROKE_WIDTHS.SPEED_LIMIT_LINES
  },
  fontSizes: {
    title: CHART_FONTS.TITLE,
    axisLabels: CHART_FONTS.AXIS_LABELS,
    deviationLabels: CHART_FONTS.DEVIATION_LABELS,
    speedLimitLabels: CHART_FONTS.SPEED_LIMIT_LABELS
  }
};