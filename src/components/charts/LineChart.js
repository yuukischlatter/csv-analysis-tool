import * as d3 from 'd3';
import { CHART_COLORS, RESPONSIVE } from '../../constants/charts';
import { ANALYSIS_VALIDATION } from '../../constants/validation';

/**
 * D3.js Dual Line Chart Implementation
 * Renders time/position data with 4 vertical draggable marker lines for dual ramps
 * Updates only on drag end for smoother performance
 * Responsive width sizing
 */

export const createDualLineChart = (svgElement, data, dualSlopeResult, onMarkerMove, width, height) => {
  // Clear previous content
  d3.select(svgElement).selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Ensure minimum chart dimensions
  const minChartWidth = Math.max(chartWidth, RESPONSIVE.MIN_CHART_WIDTH);
  const minChartHeight = Math.max(chartHeight, RESPONSIVE.MIN_CHART_HEIGHT);

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
    .attr("stroke", CHART_COLORS.DATA_LINE)
    .attr("stroke-width", 1.5)
    .attr("d", line);

  if (dualSlopeResult && dualSlopeResult.rampUp && dualSlopeResult.rampDown) {
    // Calculate positions for all 4 markers
    const upStartX = xScale(dualSlopeResult.rampUp.startTime);
    const upEndX = xScale(dualSlopeResult.rampUp.endTime);
    const downStartX = xScale(dualSlopeResult.rampDown.startTime);
    const downEndX = xScale(dualSlopeResult.rampDown.endTime);

    // Add highlighted area for ramp up (green)
    g.append("rect")
      .attr("class", "ramp-up-area")
      .attr("x", upStartX)
      .attr("y", 0)
      .attr("width", upEndX - upStartX)
      .attr("height", minChartHeight)
      .attr("fill", CHART_COLORS.RAMP_UP)
      .attr("opacity", 0.1);

    // Add highlighted area for ramp down (red)
    g.append("rect")
      .attr("class", "ramp-down-area")
      .attr("x", downStartX)
      .attr("y", 0)
      .attr("width", downEndX - downStartX)
      .attr("height", minChartHeight)
      .attr("fill", CHART_COLORS.RAMP_DOWN)
      .attr("opacity", 0.1);

    // Add highlighted ramp up line
    const rampUpData = data.slice(dualSlopeResult.rampUp.startIndex, dualSlopeResult.rampUp.endIndex + 1);
    g.append("path")
      .datum(rampUpData)
      .attr("fill", "none")
      .attr("stroke", CHART_COLORS.RAMP_UP)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Add highlighted ramp down line
    const rampDownData = data.slice(dualSlopeResult.rampDown.startIndex, dualSlopeResult.rampDown.endIndex + 1);
    g.append("path")
      .datum(rampDownData)
      .attr("fill", "none")
      .attr("stroke", CHART_COLORS.RAMP_DOWN)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Create 4 vertical drag lines
    const markers = [
      { type: 'upStart', x: upStartX, color: CHART_COLORS.RAMP_UP, label: 'Up Start', ramp: 'up' },
      { type: 'upEnd', x: upEndX, color: CHART_COLORS.RAMP_UP, label: 'Up End', ramp: 'up' },
      { type: 'downStart', x: downStartX, color: CHART_COLORS.RAMP_DOWN, label: 'Down Start', ramp: 'down' },
      { type: 'downEnd', x: downEndX, color: CHART_COLORS.RAMP_DOWN, label: 'Down End', ramp: 'down' }
    ];

    markers.forEach(marker => {
      const markerGroup = g.append("g")
        .attr("class", `${marker.type}-marker`)
        .style("cursor", "ew-resize");

      // Visible line
      markerGroup.append("line")
        .attr("class", "visible-line")
        .attr("x1", marker.x)
        .attr("x2", marker.x)
        .attr("y1", 0)
        .attr("y2", minChartHeight)
        .attr("stroke", marker.color)
        .attr("stroke-width", 2)
        .attr("opacity", 0.8);

      // Invisible wider line for easier dragging
      markerGroup.append("line")
        .attr("class", "drag-area")
        .attr("x1", marker.x)
        .attr("x2", marker.x)
        .attr("y1", 0)
        .attr("y2", minChartHeight)
        .attr("stroke", "transparent")
        .attr("stroke-width", 20);

      // Label
      g.append("text")
        .attr("class", `${marker.type}-label`)
        .attr("x", marker.x)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", marker.color)
        .attr("font-weight", "bold")
        .text(marker.label);
    });

    // Add intersection dots for ramp up
    const upStartIntersection = findIntersection(data, dualSlopeResult.rampUp.startTime);
    const upEndIntersection = findIntersection(data, dualSlopeResult.rampUp.endTime);

    g.append("circle")
      .attr("class", "up-start-dot")
      .attr("cx", xScale(upStartIntersection.time))
      .attr("cy", yScale(upStartIntersection.position))
      .attr("r", 4)
      .attr("fill", CHART_COLORS.RAMP_UP)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    g.append("circle")
      .attr("class", "up-end-dot")
      .attr("cx", xScale(upEndIntersection.time))
      .attr("cy", yScale(upEndIntersection.position))
      .attr("r", 4)
      .attr("fill", CHART_COLORS.RAMP_UP)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Add intersection dots for ramp down
    const downStartIntersection = findIntersection(data, dualSlopeResult.rampDown.startTime);
    const downEndIntersection = findIntersection(data, dualSlopeResult.rampDown.endTime);

    g.append("circle")
      .attr("class", "down-start-dot")
      .attr("cx", xScale(downStartIntersection.time))
      .attr("cy", yScale(downStartIntersection.position))
      .attr("r", 4)
      .attr("fill", CHART_COLORS.RAMP_DOWN)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    g.append("circle")
      .attr("class", "down-end-dot")
      .attr("cx", xScale(downEndIntersection.time))
      .attr("cy", yScale(downEndIntersection.position))
      .attr("r", 4)
      .attr("fill", CHART_COLORS.RAMP_DOWN)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Add drag behavior to all 4 markers
    addDragBehavior(g, 'upStart', 'up', dualSlopeResult, data, xScale, yScale, minChartWidth, minChartHeight, onMarkerMove);
    addDragBehavior(g, 'upEnd', 'up', dualSlopeResult, data, xScale, yScale, minChartWidth, minChartHeight, onMarkerMove);
    addDragBehavior(g, 'downStart', 'down', dualSlopeResult, data, xScale, yScale, minChartWidth, minChartHeight, onMarkerMove);
    addDragBehavior(g, 'downEnd', 'down', dualSlopeResult, data, xScale, yScale, minChartWidth, minChartHeight, onMarkerMove);
  }
};

const addDragBehavior = (g, markerType, rampType, dualSlopeResult, data, xScale, yScale, chartWidth, chartHeight, onMarkerMove) => {
  const markerGroup = g.select(`.${markerType}-marker`);
  let originalX;

  markerGroup.call(d3.drag()
    .on("start", function() {
      originalX = parseFloat(markerGroup.select(".visible-line").attr("x1"));
    })
    .on("drag", function(event) {
      // Only move the line visually, no calculations
      const newX = Math.max(0, Math.min(chartWidth, event.x));
      
      // Update only the visual line position
      markerGroup.selectAll("line")
        .attr("x1", newX)
        .attr("x2", newX);
        
      // Update label position
      g.select(`.${markerType}-label`)
        .attr("x", newX);
    })
    .on("end", function(event) {
      // Now perform the actual calculation and validation
      const newX = Math.max(0, Math.min(chartWidth, event.x));
      const newTime = xScale.invert(newX);
      const newIndex = findNearestIndex(data, newTime);
      
      // Validation logic based on marker type
      const isValidPosition = validateMarkerPosition(markerType, rampType, newIndex, dualSlopeResult);
      
      if (isValidPosition) {
        // Valid position - update everything
        const newDataPoint = data[newIndex];
        updateMarkerComplete(g, markerType, newX, newDataPoint, xScale, yScale, chartHeight);
        
        if (onMarkerMove) {
          onMarkerMove(markerType, rampType, newIndex);
        }
      } else {
        // Invalid position - revert to original
        console.warn(`${markerType} marker position invalid, reverting`);
        markerGroup.selectAll("line")
          .attr("x1", originalX)
          .attr("x2", originalX);
        g.select(`.${markerType}-label`)
          .attr("x", originalX);
      }
    })
  );
};

const validateMarkerPosition = (markerType, rampType, newIndex, dualSlopeResult) => {
  const minDistance = ANALYSIS_VALIDATION.SLOPE_DETECTION.MIN_DISTANCE_BETWEEN_RAMPS;
  
  if (rampType === 'up') {
    if (markerType === 'upStart') {
      return newIndex < dualSlopeResult.rampUp.endIndex - minDistance;
    } else if (markerType === 'upEnd') {
      return newIndex > dualSlopeResult.rampUp.startIndex + minDistance;
    }
  } else if (rampType === 'down') {
    if (markerType === 'downStart') {
      return newIndex < dualSlopeResult.rampDown.endIndex - minDistance;
    } else if (markerType === 'downEnd') {
      return newIndex > dualSlopeResult.rampDown.startIndex + minDistance;
    }
  }
  
  return false;
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
  const dotClassName = `${markerType.replace('Start', '-start').replace('End', '-end')}-dot`;
  
  // Update intersection dot to new data point
  g.select(`.${dotClassName}`)
    .attr("cx", xScale(dataPoint.time))
    .attr("cy", yScale(dataPoint.position));
  
  // Update highlighted areas
  updateHighlightedAreas(g, xScale, yScale, chartHeight);
};

const updateHighlightedAreas = (g, xScale, yScale, chartHeight) => {
  // Update ramp up area
  const upStartX = parseFloat(g.select(".upStart-marker").select("line").attr("x1"));
  const upEndX = parseFloat(g.select(".upEnd-marker").select("line").attr("x1"));
  
  if (!isNaN(upStartX) && !isNaN(upEndX)) {
    g.select(".ramp-up-area")
      .attr("x", Math.min(upStartX, upEndX))
      .attr("width", Math.abs(upEndX - upStartX));
  }
  
  // Update ramp down area
  const downStartX = parseFloat(g.select(".downStart-marker").select("line").attr("x1"));
  const downEndX = parseFloat(g.select(".downEnd-marker").select("line").attr("x1"));
  
  if (!isNaN(downStartX) && !isNaN(downEndX)) {
    g.select(".ramp-down-area")
      .attr("x", Math.min(downStartX, downEndX))
      .attr("width", Math.abs(downEndX - downStartX));
  }
};