import React, { useRef, useEffect } from 'react';

const ChartContainer = ({ 
  data, 
  slopeResult, 
  onMarkerMove, 
  width = 800, 
  height = 400,
  title 
}) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      return;
    }

    // Clear previous chart
    const svg = svgRef.current;
    svg.innerHTML = '';

    // Call D3 chart rendering
    renderChart(svg, data, slopeResult, onMarkerMove, width, height);
  }, [data, slopeResult, width, height, onMarkerMove]);

  const renderChart = (svg, chartData, slope, markerCallback, w, h) => {
    // This will be populated when we create LineChart.js
    // For now, create a basic placeholder
    svg.innerHTML = `
      <rect width="${w}" height="${h}" fill="white" stroke="#ccc"/>
      <text x="${w/2}" y="${h/2}" text-anchor="middle" font-size="14" fill="#666">
        Chart will render here (LineChart.js needed)
      </text>
    `;
  };

  return (
    <div style={{ margin: '20px 0' }}>
      {title && (
        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
          {title}
        </h4>
      )}
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px',
        padding: '10px',
        backgroundColor: '#fafafa'
      }}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ 
            display: 'block',
            backgroundColor: 'white'
          }}
        />
        
        {slopeResult && (
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#666',
            display: 'flex',
            gap: '20px'
          }}>
            <span>Velocity: {slopeResult.velocity.toFixed(6)} mm/s</span>
            <span>Duration: {slopeResult.duration.toFixed(3)}s</span>
            <span>Start: {slopeResult.startTime.toFixed(3)}s</span>
            <span>End: {slopeResult.endTime.toFixed(3)}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;