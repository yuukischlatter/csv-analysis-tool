import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { 
  createScale, 
  addGridLines, 
  addSpeedLimitLines, 
  addRegressionLines, 
  addDataPoints, 
  addDeviationAnnotations, 
  addAxes, 
  addChartTitle,
  CHART_STYLES 
} from '../../utils/chartUtils';
import { CHART_DIMENSIONS } from '../../constants/charts';

const SpeedCheckChart = ({ analysis, regressionData, width = CHART_DIMENSIONS.SPEED_CHECK_DUAL.width, height = CHART_DIMENSIONS.SPEED_CHECK_DUAL.height}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!analysis || !svgRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    renderSingleChart();
  }, [analysis, regressionData, width, height]);

  const renderSingleChart = () => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Single chart takes 95% width
    const chartWidth = Math.floor(width * 0.95);
    renderMainChart(svg, 0, chartWidth, height);
  };

  const renderMainChart = (svg, xOffset, chartContainerWidth, chartContainerHeight) => {
    const margin = { top: 50, right: 20, bottom: 70, left: 80 };
    const chartWidth = chartContainerWidth - margin.left - margin.right;
    const chartHeight = chartContainerHeight - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${xOffset + margin.left},${margin.top})`);

    // Main chart ranges - focused on 0-4.5V range (no negative values)
    const xDomain = [0, 4.5];
    const yDomain = [0, 13];

    // Create scales
    const xScale = createScale(xDomain, [0, chartWidth]);
    const yScale = createScale(yDomain, [chartHeight, 0]);

    // Add grid lines
    addGridLines(g, xScale, yScale, chartWidth, chartHeight);

    // Add axes
    addAxes(g, xScale, yScale, chartWidth, chartHeight, {
      x: "Eingangsspannung UE [V]",
      y: "Schlittengeschwindigkeit [mm/s]"
    });

    // Add chart title
    addChartTitle(g, "Speed Check Analysis", chartWidth);

    // Get filtered measurement data from real user data (positive voltages only, including origin)
    const measurementData = getPositiveUserDataWithOrigin();

    // Add measured data points and line
    addDataPoints(g, measurementData, xScale, yScale);

    // Add regression lines
    addRegressionLines(g, analysis, xScale, yScale, xDomain);

    // Add speed limit lines
    addSpeedLimitLines(g, analysis.machineParams, yScale, chartWidth);

    // Add deviation annotations
    const visibleRange = [xDomain, yDomain];
    addDeviationAnnotations(g, analysis.deviations, xScale, yScale, visibleRange);

    // Add main chart legend
    addMainLegend(g, chartWidth, chartHeight);
  };

  const getPositiveUserDataWithOrigin = () => {
    // Always start with the reference point (0V, 0mm/s)
    const dataWithOrigin = [
      { voltage: 0, velocity: 0 } // Reference point
    ];

    if (regressionData && regressionData.length > 0) {
      // Filter for positive voltages only (ramp up data) and sort by voltage
      const positiveData = regressionData
        .filter(point => point.voltage > 0 && point.rampType === 'up')
        .map(point => ({
          voltage: point.voltage,
          velocity: point.velocity
        }))
        .sort((a, b) => a.voltage - b.voltage);

      // Add the positive data to our origin point
      dataWithOrigin.push(...positiveData);
    }

    return dataWithOrigin;
  };

  const addMainLegend = (g, chartWidth, chartHeight) => {
    const legendData = [
      { color: CHART_STYLES.colors.dataPoints, label: 'Messwerte (v)', type: 'line' },
      { color: CHART_STYLES.colors.calculatedLine, label: 'Regressionsgerade (berechnet)', type: 'line' },
      { color: CHART_STYLES.colors.manualLine, label: 'Regressionsgerade (gewählt)', type: 'line' },
      { color: CHART_STYLES.colors.speedLimits.lower, label: 'Brenngeschwindigkeit Grenzen', type: 'dashed' }
    ];

    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${chartWidth - 200}, 20)`);

    legendData.forEach((item, index) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${index * 18})`);

      // Legend line/symbol
      if (item.type === 'line') {
        legendRow.append("line")
          .attr("x1", 0)
          .attr("x2", 15)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 2);
      } else if (item.type === 'dashed') {
        legendRow.append("line")
          .attr("x1", 0)
          .attr("x2", 15)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "5,5");
      }

      // Legend text
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("fill", "black")
        .text(item.label);
    });

    // Legend border
    const legendBox = legend.node().getBBox();
    legend.insert("rect", ":first-child")
      .attr("x", legendBox.x - 3)
      .attr("y", legendBox.y - 3)
      .attr("width", legendBox.width + 6)
      .attr("height", legendBox.height + 6)
      .attr("fill", "white")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("opacity", 0.9);
  };

  if (!analysis) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }}>
        No speed check analysis data available.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        padding: '10px',
        backgroundColor: 'white'
      }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default SpeedCheckChart;