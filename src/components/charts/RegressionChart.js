import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { calculateLinearRegression, generateRegressionLine, calculateSmoothCurve, getStatistics } from '../../services/regressionAnalysis';

const RegressionChart = ({ data, width = 800, height = 400 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    
    // STEP 1: Fixed width for X-axis (-10V to +10V)
    const chartWidth = width - margin.left - margin.right;
    const xDomain = [-10, 10]; // Always -10V to +10V
    const xRange = xDomain[1] - xDomain[0]; // 20V
    
    // STEP 2: Calculate pixels per unit (this determines square size)
    const pixelsPerUnit = chartWidth / xRange; // e.g., 720px / 20V = 36px per volt
    
    // STEP 3: Calculate Y-domain from actual data
    const velocities = data.map(point => point.velocity);
    const maxAbsVelocity = Math.max(...velocities.map(v => Math.abs(v)));
    const buffer = 2; // 2mm/s buffer as specified
    const yMax = maxAbsVelocity + buffer;
    const yDomain = [-yMax, yMax];
    const yRange = yDomain[1] - yDomain[0]; // Total mm/s range
    
    // STEP 4: Calculate required height for perfect squares
    const chartHeight = yRange * pixelsPerUnit; // e.g., 28mm/s × 36px = 1008px
    const totalHeight = chartHeight + margin.top + margin.bottom;
    
    console.log(`Square Grid: ${pixelsPerUnit.toFixed(1)}px per unit (both axes)`);
    console.log(`Chart dimensions: ${chartWidth}px × ${chartHeight.toFixed(0)}px`);
    console.log(`Y-domain: ${yDomain[0].toFixed(1)} to ${yDomain[1].toFixed(1)} mm/s`);

    // STEP 5: Set SVG to calculated height
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", totalHeight);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // STEP 6: Create scales with perfect square ratio
    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([chartHeight, 0]);

    // STEP 7: Create grid lines with 1-unit spacing (perfect squares)
    const xGridValues = [];
    const yGridValues = [];
    
    // X-axis: every 1V
    for (let i = Math.ceil(xDomain[0]); i <= Math.floor(xDomain[1]); i++) {
      xGridValues.push(i);
    }
    
    // Y-axis: every 1mm/s
    for (let i = Math.ceil(yDomain[0]); i <= Math.floor(yDomain[1]); i++) {
      yGridValues.push(i);
    }

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickValues(xGridValues)
        .tickSize(-chartHeight)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)
      .style("stroke", "#ccc");

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale)
        .tickValues(yGridValues)
        .tickSize(-chartWidth)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)
      .style("stroke", "#ccc");

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickValues(xGridValues)
      )
      .style("stroke", "black")
      .style("stroke-width", "1px");

    g.append("g")
      .call(d3.axisLeft(yScale)
        .tickValues(yGridValues)
      )
      .style("stroke", "black")
      .style("stroke-width", "1px");

    // Add axis labels
    g.append("text")
      .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 45})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text("Eingangsspannung UE [V]");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -chartHeight / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text("Schlittengeschwindigkeit [mm/s]");

    // Calculate regression
    const regression = calculateLinearRegression(data);
    const smoothCurveData = calculateSmoothCurve(data);

    // Add smooth curve (natural curve through points)
    if (smoothCurveData.length > 1) {
      const line = d3.line()
        .x(d => xScale(d.voltage))
        .y(d => yScale(d.velocity))
        .curve(d3.curveCatmullRom);

      g.append("path")
        .datum(smoothCurveData)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", line);
    }

    // Add regression line (thin red line) - extend across full X domain
    if (regression) {
      const regressionLineData = generateRegressionLine(regression, xDomain[0], xDomain[1]);
      
      const regressionLine = d3.line()
        .x(d => xScale(d.voltage))
        .y(d => yScale(d.velocity));

      g.append("path")
        .datum(regressionLineData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("d", regressionLine);
    }

    // Add data points (black circles)
    g.selectAll(".data-point")
      .data(data)
      .enter().append("circle")
      .attr("class", "data-point")
      .attr("cx", d => xScale(d.voltage))
      .attr("cy", d => yScale(d.velocity))
      .attr("r", 3)
      .attr("fill", "black")
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Add title
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "black")
      .text("Diagramm der Messwerte und Regressionsgerade");

    // Add zero lines for reference
    // Vertical zero line (0V)
    g.append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5);

    // Horizontal zero line (0 mm/s)
    g.append("line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5);

  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }}>
        No approved voltage assignments available for regression analysis.
        <br />
        <small>Approve files with voltage selection to see the regression chart.</small>
      </div>
    );
  }

  // Calculate statistics for display
  const regression = calculateLinearRegression(data);
  const stats = getStatistics(data, regression);
  const velocities = data.map(point => point.velocity);
  const maxAbsVelocity = Math.max(...velocities.map(v => Math.abs(v)));
  const pixelsPerUnit = (width - 110) / 20; // Approximate pixels per unit

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px' 
      }}>
        <h4 style={{ margin: '0', fontSize: '16px' }}>
          UE vs Velocity Regression Analysis
        </h4>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {data.length} user-assigned measurements (perfect squares)
        </div>
      </div>

      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        padding: '10px',
        backgroundColor: 'white'
      }}>
        <svg ref={svgRef}></svg>
        
        {/* Statistics Display */}
        {regression && (
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#666',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            <div>
              <strong>Linear Regression:</strong>
              <br />
              {regression.equation}
              <br />
              {regression.rSquaredText}
            </div>
            
            {stats && (
              <>
                <div>
                  <strong>Data Points:</strong>
                  <br />
                  Total: {stats.totalPoints}
                  <br />
                  Up: {stats.upRampCount}, Down: {stats.downRampCount}
                </div>
                
                <div>
                  <strong>Velocity Range:</strong>
                  <br />
                  {stats.velocityRange.min.toFixed(3)} to {stats.velocityRange.max.toFixed(3)} mm/s
                  <br />
                  Avg: {stats.velocityRange.average.toFixed(3)} mm/s
                </div>

                <div>
                  <strong>Perfect Square Grid:</strong>
                  <br />
                  X: -10V to +10V (fixed)
                  <br />
                  Y: ±{(maxAbsVelocity + 2).toFixed(1)} mm/s (dynamic)
                  <br />
                  Grid: {pixelsPerUnit.toFixed(0)}px × {pixelsPerUnit.toFixed(0)}px squares
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ 
          marginTop: '10px', 
          fontSize: '11px', 
          color: '#999',
          borderTop: '1px solid #eee',
          paddingTop: '8px'
        }}>
          <strong>Legend:</strong> Black points = user-assigned measurements, Black line = natural curve through points, Red line = linear regression, Gray lines = zero reference
          <br />
          <strong>Grid:</strong> Perfect squares with equal pixel spacing for X and Y axes. Chart height adjusts automatically for 1:1 scale.
        </div>
      </div>
    </div>
  );
};

export default RegressionChart;