import * as d3 from 'd3';

/**
 * D3.js Line Chart Implementation
 * Renders time/position data with vertical draggable marker lines
 * Updates only on drag end for smoother performance
 * Responsive width sizing
 */

export const createLineChart = (svgElement, data, slopeResult, onMarkerMove, width, height) => {
  // Clear previous content
  d3.select(svgElement).selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Ensure minimum chart dimensions
  const minChartWidth = Math.max(chartWidth, 300);
  const minChartHeight = Math.max(chartHeight, 200);

  const svg = d3.select(svgElement);
  
  // Update SVG width to match container
  svg.attr("width", width);
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.time))
    .range([0, minChartWidth]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.position))
    .range([minChartHeight, 0]);

  // Line generator
  const line = d3.line()
    .x(d => xScale(d.time))
    .y(d => yScale(d.position));

  // Add grid lines first (behind everything)
  g.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${minChartHeight})`)
    .call(d3.axisBottom(xScale)
      .tickSize(-minChartHeight)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.3);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yScale)
      .tickSize(-minChartWidth)
      .tickFormat("")
    )
    .style("stroke-dasharray", "3,3")
    .style("opacity", 0.3);

  // Add axes
  g.append("g")
    .attr("transform", `translate(0,${minChartHeight})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", minChartWidth / 2)
    .attr("y", 35)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Time (s)");

  g.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -minChartHeight / 2)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .text("Position (mm)");

  // Add data line
  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  if (slopeResult) {
    const startX = xScale(slopeResult.startTime);
    const endX = xScale(slopeResult.endTime);

    // Add highlighted area between markers (transparent red)
    g.append("rect")
      .attr("class", "slope-area")
      .attr("x", startX)
      .attr("y", 0)
      .attr("width", endX - startX)
      .attr("height", minChartHeight)
      .attr("fill", "red")
      .attr("opacity", 0.1);

    // Add highlighted slope line
    const slopeData = data.slice(slopeResult.startIndex, slopeResult.endIndex + 1);
    g.append("path")
      .datum(slopeData)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Create vertical drag lines
    const startLine = g.append("g")
      .attr("class", "start-marker")
      .style("cursor", "ew-resize");

    startLine.append("line")
      .attr("class", "visible-line")
      .attr("x1", startX)
      .attr("x2", startX)
      .attr("y1", 0)
      .attr("y2", minChartHeight)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);

    // Invisible wider line for easier dragging
    startLine.append("line")
      .attr("class", "drag-area")
      .attr("x1", startX)
      .attr("x2", startX)
      .attr("y1", 0)
      .attr("y2", minChartHeight)
      .attr("stroke", "transparent")
      .attr("stroke-width", 20);

    const endLine = g.append("g")
      .attr("class", "end-marker")
      .style("cursor", "ew-resize");

    endLine.append("line")
      .attr("class", "visible-line")
      .attr("x1", endX)
      .attr("x2", endX)
      .attr("y1", 0)
      .attr("y2", minChartHeight)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);

    // Invisible wider line for easier dragging
    endLine.append("line")
      .attr("class", "drag-area")
      .attr("x1", endX)
      .attr("x2", endX)
      .attr("y1", 0)
      .attr("y2", minChartHeight)
      .attr("stroke", "transparent")
      .attr("stroke-width", 20);

    // Add intersection dots
    const startIntersection = findIntersection(data, slopeResult.startTime);
    const endIntersection = findIntersection(data, slopeResult.endTime);

    const startDot = g.append("circle")
      .attr("class", "start-dot")
      .attr("cx", xScale(startIntersection.time))
      .attr("cy", yScale(startIntersection.position))
      .attr("r", 4)
      .attr("fill", "red")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    const endDot = g.append("circle")
      .attr("class", "end-dot")
      .attr("cx", xScale(endIntersection.time))
      .attr("cy", yScale(endIntersection.position))
      .attr("r", 4)
      .attr("fill", "red")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Add labels
    g.append("text")
      .attr("class", "start-label")
      .attr("x", startX)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "red")
      .attr("font-weight", "bold")
      .text("Start");

    g.append("text")
      .attr("class", "end-label")
      .attr("x", endX)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "red")
      .attr("font-weight", "bold")
      .text("End");

    // Variables to store original positions for validation
    let originalStartX = startX;
    let originalEndX = endX;

    // Add drag behavior to start line - UPDATE ONLY ON DRAG END
    startLine.call(d3.drag()
      .on("start", function() {
        originalStartX = parseFloat(startLine.select(".visible-line").attr("x1"));
      })
      .on("drag", function(event) {
        // Only move the line visually, no calculations
        const newX = Math.max(0, Math.min(minChartWidth, event.x));
        
        // Update only the visual line position
        startLine.selectAll("line")
          .attr("x1", newX)
          .attr("x2", newX);
          
        // Update label position
        g.select(".start-label")
          .attr("x", newX);
      })
      .on("end", function(event) {
        // Now perform the actual calculation and validation
        const newX = Math.max(0, Math.min(minChartWidth, event.x));
        const newTime = xScale.invert(newX);
        const newIndex = findNearestIndex(data, newTime);
        
        // Validate minimum distance from end marker
        if (newIndex < slopeResult.endIndex - 5) {
          // Valid position - update everything
          const newDataPoint = data[newIndex];
          updateMarkerComplete(g, "start", newX, newDataPoint, xScale, yScale, minChartHeight);
          
          if (onMarkerMove) {
            onMarkerMove('start', newIndex);
          }
        } else {
          // Invalid position - revert to original
          console.warn("Start marker too close to end marker, reverting");
          startLine.selectAll("line")
            .attr("x1", originalStartX)
            .attr("x2", originalStartX);
          g.select(".start-label")
            .attr("x", originalStartX);
        }
      })
    );

    // Add drag behavior to end line - UPDATE ONLY ON DRAG END
    endLine.call(d3.drag()
      .on("start", function() {
        originalEndX = parseFloat(endLine.select(".visible-line").attr("x1"));
      })
      .on("drag", function(event) {
        // Only move the line visually, no calculations
        const newX = Math.max(0, Math.min(minChartWidth, event.x));
        
        // Update only the visual line position
        endLine.selectAll("line")
          .attr("x1", newX)
          .attr("x2", newX);
          
        // Update label position
        g.select(".end-label")
          .attr("x", newX);
      })
      .on("end", function(event) {
        // Now perform the actual calculation and validation
        const newX = Math.max(0, Math.min(minChartWidth, event.x));
        const newTime = xScale.invert(newX);
        const newIndex = findNearestIndex(data, newTime);
        
        // Validate minimum distance from start marker
        if (newIndex > slopeResult.startIndex + 5) {
          // Valid position - update everything
          const newDataPoint = data[newIndex];
          updateMarkerComplete(g, "end", newX, newDataPoint, xScale, yScale, minChartHeight);
          
          if (onMarkerMove) {
            onMarkerMove('end', newIndex);
          }
        } else {
          // Invalid position - revert to original
          console.warn("End marker too close to start marker, reverting");
          endLine.selectAll("line")
            .attr("x1", originalEndX)
            .attr("x2", originalEndX);
          g.select(".end-label")
            .attr("x", originalEndX);
        }
      })
    );
  }
};

const findIntersection = (data, targetTime) => {
  // Find the closest data point to the target time
  let nearestPoint = data[0];
  let minDistance = Math.abs(data[0].time - targetTime);
  
  for (const point of data) {
    const distance = Math.abs(point.time - targetTime);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  }
  
  return nearestPoint;
};

const findNearestIndex = (data, targetTime) => {
  let nearestIndex = 0;
  let minDistance = Math.abs(data[0].time - targetTime);
  
  for (let i = 1; i < data.length; i++) {
    const distance = Math.abs(data[i].time - targetTime);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }
  
  return nearestIndex;
};

const updateMarkerComplete = (g, markerType, newX, dataPoint, xScale, yScale, chartHeight) => {
  const dotClassName = `${markerType}-dot`;
  
  // Update intersection dot to new data point
  g.select(`.${dotClassName}`)
    .attr("cx", xScale(dataPoint.time))
    .attr("cy", yScale(dataPoint.position));
  
  // Update highlighted area between markers
  const startX = parseFloat(g.select(".start-marker").select("line").attr("x1"));
  const endX = parseFloat(g.select(".end-marker").select("line").attr("x1"));
  
  g.select(".slope-area")
    .attr("x", Math.min(startX, endX))
    .attr("width", Math.abs(endX - startX));
};