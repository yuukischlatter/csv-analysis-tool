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

const SpeedCheckChart = ({ analysis, width = 1100, height = 500 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!analysis || !svgRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    renderDualCharts();
  }, [analysis, width, height]);

  const renderDualCharts = () => {
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Chart layout - 65% main chart, 30% overview
    const mainChartWidth = Math.floor(width * 0.65);
    const overviewChartWidth = Math.floor(width * 0.3);
    const spacing = 20;

    // Render main chart (0-4.5V focused)
    renderMainChart(svg, 0, mainChartWidth, height);
    
    // Render overview chart (0-11V full range, no negative voltages)
    renderOverviewChart(svg, mainChartWidth + spacing, overviewChartWidth, height);
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

    // Get filtered measurement data (0-4.5V only - no negative values)
    const measurementData = generateFilteredMeasurementData();

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

  const renderOverviewChart = (svg, xOffset, chartContainerWidth, chartContainerHeight) => {
    const margin = { top: 50, right: 20, bottom: 70, left: 60 };
    const chartWidth = chartContainerWidth - margin.left - margin.right;
    const chartHeight = chartContainerHeight - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${xOffset + margin.left},${margin.top})`);

    // Overview chart ranges - 0-11V only (no negative values)
    const xDomain = [0, 11];
    const yDomain = [0, 35];

    // Create scales
    const xScale = createScale(xDomain, [0, chartWidth]);
    const yScale = createScale(yDomain, [chartHeight, 0]);

    // Add simplified grid lines
    addGridLines(g, xScale, yScale, chartWidth, chartHeight);

    // Add axes
    addAxes(g, xScale, yScale, chartWidth, chartHeight, {
      x: "Voltage [V]",
      y: "Speed [mm/s]"
    });

    // Add chart title
    addChartTitle(g, "Full Range Overview", chartWidth);

    // Get filtered overview data (0-11V only, no negative voltages)
    const overviewData = generateOverviewMeasurementData();

    // Add data points only (simplified for overview)
    g.selectAll(".overview-data-point")
      .data(overviewData)
      .enter().append("circle")
      .attr("class", "overview-data-point")
      .attr("cx", d => xScale(d.voltage))
      .attr("cy", d => yScale(d.velocity))
      .attr("r", 2)
      .attr("fill", "black")
      .attr("opacity", 0.7);

    // Add manual regression line (red) - extended across 0-11V range
    const manualLineData = [];
    for (let v = 0; v <= 11; v += 0.2) {
      manualLineData.push({
        voltage: v,
        velocity: analysis.manualSlope * v
      });
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

    // Add simple legend for overview
    addOverviewLegend(g, chartWidth);
  };

  const generateFilteredMeasurementData = () => {
    // Filtered data for main chart - only 0 to 4.5V range (no negative values)
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
  };

  const generateOverviewMeasurementData = () => {
    // Overview data - 0 to 11V only (no negative voltages)
    const voltages = [
      0.00, 0.10, 0.20, 0.30, 0.40, 0.50, 0.75, 1.00, 1.50, 2.00, 2.50, 3.00, 4.00, 5.00, 7.00, 9.00, 10.00
    ];
    
    const speeds = [
      0.00, 0.42, 0.74, 1.05, 1.36, 1.64, 2.37, 3.07, 4.49, 5.84, 7.09, 8.40, 10.60, 12.79, 14.37, 13.30, 11.94
    ];

    return voltages.map((voltage, index) => ({
      voltage: voltage,
      velocity: speeds[index]
    }));
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

  const addOverviewLegend = (g, chartWidth) => {
    const legend = g.append("g")
      .attr("class", "overview-legend")
      .attr("transform", `translate(${chartWidth - 120}, 20)`);

    // Messwerte
    const legendRow1 = legend.append("g");
    legendRow1.append("circle")
      .attr("cx", 5)
      .attr("cy", 0)
      .attr("r", 3)
      .attr("fill", "black");
    legendRow1.append("text")
      .attr("x", 15)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("font-size", "9px")
      .style("fill", "black")
      .text("Messwerte (full)");

    // Manual regression
    const legendRow2 = legend.append("g")
      .attr("transform", "translate(0, 15)");
    legendRow2.append("line")
      .attr("x1", 0)
      .attr("x2", 10)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "red")
      .attr("stroke-width", 2);
    legendRow2.append("text")
      .attr("x", 15)
      .attr("y", 0)
      .attr("dy", "0.35em")
      .style("font-size", "9px")
      .style("fill", "black")
      .text("Regression (full)");

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
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px' 
      }}>
        <h4 style={{ margin: '0', fontSize: '16px' }}>
          Speed Check Chart - {analysis.machineType}
        </h4>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Manual Slope: {analysis.manualSlope.toFixed(4)} mm/s/V 
          (Factor: {analysis.manualSlopeFactor.toFixed(2)})
        </div>
      </div>

      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        padding: '10px',
        backgroundColor: 'white'
      }}>
        <svg ref={svgRef}></svg>
        
        {/* Chart info */}
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <strong>Regression Analysis:</strong> R² = {analysis.rSquared.toFixed(4)}, 
            Data Points: {analysis.dataPointsUsed}, 
            Range: {analysis.voltageRange[0]}-{analysis.voltageRange[1]}V
          </div>
          <div>
            <strong>Speed Limits:</strong> {analysis.machineParams.lower} | {analysis.machineParams.middle} | {analysis.machineParams.upper} mm/s
          </div>
        </div>

        {/* Deviation summary */}
        <div style={{ 
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <strong>Key Deviations:</strong>
          {analysis.deviations
            .filter(d => d.targetSpeed >= analysis.machineParams.lower && d.targetSpeed <= analysis.machineParams.upper)
            .map((d, index) => (
              <span key={index} style={{ marginLeft: '10px' }}>
                {d.targetSpeed}mm/s: {d.deviation.toFixed(1)}%
              </span>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default SpeedCheckChart;