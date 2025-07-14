import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { calculateLinearRegression, generateRegressionLine, calculateSmoothCurve, calculateDynamicYScale, getStatistics } from '../../services/regressionAnalysis';

const RegressionChart = ({ data, width = 800, height = 400 }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate 1:1 scale - both axes use same domain range
    const yScale = calculateDynamicYScale(data);
    const maxAbsoluteValue = Math.max(10, Math.abs(yScale.min), Math.abs(yScale.max)); // At least 10 to match voltage range
    
    // Use symmetric domain for 1:1 scaling
    const domain = [-maxAbsoluteValue, maxAbsoluteValue];
    
    const xScale = d3.scaleLinear()
      .domain(domain) // Same domain as Y for 1:1 ratio
      .range([0, chartWidth]);

    const yScaleD3 = d3.scaleLinear()
      .domain(domain) // Same domain as X for 1:1 ratio
      .range([chartHeight, 0]);

    // Calculate pixels per unit to ensure 1:1 visual ratio
    const xPixelsPerUnit = chartWidth / (domain[1] - domain[0]);
    const yPixelsPerUnit = chartHeight / (domain[1] - domain[0]);
    
    console.log(`1:1 Scale: X=${xPixelsPerUnit.toFixed(2)} px/unit, Y=${yPixelsPerUnit.toFixed(2)} px/unit`);

    // Add grid lines with equal spacing
    const gridTickValues = [];
    for (let i = Math.ceil(domain[0]); i <= Math.floor(domain[1]); i++) {
      gridTickValues.push(i);
    }

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickValues(gridTickValues)
        .tickSize(-chartHeight)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)
      .style("stroke", "#ccc");

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScaleD3)
        .tickValues(gridTickValues)
        .tickSize(-chartWidth)
        .tickFormat("")
      )
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)
      .style("stroke", "#ccc");

    // Add axes with equal tick spacing
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickValues(gridTickValues)
      )
      .style("stroke", "black")
      .style("stroke-width", "1px");

    g.append("g")
      .call(d3.axisLeft(yScaleD3)
        .tickValues(gridTickValues)
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
        .y(d => yScaleD3(d.velocity))
        .curve(d3.curveCatmullRom); // Smooth curve interpolation

      g.append("path")
        .datum(smoothCurveData)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", line);
    }

    // Add regression line (thin red line) - extend across full domain
    if (regression) {
      const regressionLineData = generateRegressionLine(regression, domain[0], domain[1]);
      
      const regressionLine = d3.line()
        .x(d => xScale(d.voltage))
        .y(d => yScaleD3(d.velocity));

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
      .attr("cy", d => yScaleD3(d.velocity))
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

    // Add zero lines for reference (if zero is within domain)
    if (domain[0] <= 0 && domain[1] >= 0) {
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
        .attr("y1", yScaleD3(0))
        .attr("y2", yScaleD3(0))
        .attr("stroke", "#999")
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);
    }

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
        No approved data available for regression analysis.
        <br />
        <small>Approve at least one file to see the regression chart.</small>
      </div>
    );
  }

  // Calculate statistics for display
  const regression = calculateLinearRegression(data);
  const stats = getStatistics(data, regression);
  const yScale = calculateDynamicYScale(data);
  const maxAbsoluteValue = Math.max(10, Math.abs(yScale.min), Math.abs(yScale.max));

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
          {data.length} approved measurements (1:1 scale)
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
                  <strong>Scale Info:</strong>
                  <br />
                  Domain: ±{maxAbsoluteValue.toFixed(1)} units
                  <br />
                  1:1 ratio maintained
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
          <strong>Legend:</strong> Black points = measured data, Black line = natural curve through points, Red line = linear regression, Gray lines = zero reference
        </div>
      </div>
    </div>
  );
};

export default RegressionChart;