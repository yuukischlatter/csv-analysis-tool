import React, { useRef, useEffect, useState } from 'react';
import * as Plotly from 'plotly.js-dist';

const SpeedCheckChart = ({ analysis, regressionData, width = 1100, height = 800 }) => {
  const plotRef = useRef(null);
  const [selectedPoints, setSelectedPoints] = useState(new Set());

  useEffect(() => {
    if (!analysis || !plotRef.current) {
      return;
    }

    renderPlotlyChart();
  }, [analysis, regressionData, width, height]);

  const renderPlotlyChart = () => {
    if (!analysis) return;

    const measuredDataPoints = getMeasuredDataPoints();
    
    const traces = [
      createMeasuredDataTrace(measuredDataPoints),
      createCalculatedRegressionTrace(),
      createManualRegressionTrace(),
      ...createSpeedLimitTraces()
    ];

    const layout = {
      title: {
        text: 'Speed Check Analysis',
        font: { size: 16, color: 'black' }
      },
      xaxis: {
        title: {
          text: 'Eingangsspannung UE [V]',
          font: { size: 14, color: 'black' }
        },
        range: [0, 4.5],
        showgrid: true,
        gridcolor: '#ccc',
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: '#999',
        zerolinewidth: 1
      },
      yaxis: {
        title: {
          text: 'Schlittengeschwindigkeit [mm/s]',
          font: { size: 14, color: 'black' }
        },
        range: [0, 13],
        showgrid: true,
        gridcolor: '#ccc',
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: '#999',
        zerolinewidth: 1
      },
      showlegend: true,
      legend: {
        x: 0.05,
        y: 0.95,
        bgcolor: 'rgba(255,255,255,0.9)',
        bordercolor: '#ccc',
        borderwidth: 1
      },
      margin: { t: 50, r: 20, b: 70, l: 80 },
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      annotations: createDeviationAnnotations()
    };

    const config = {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'speed_check_analysis',
        height: height,
        width: width,
        scale: 1
      }
    };

    Plotly.newPlot(plotRef.current, traces, layout, config);
    plotRef.current.on('plotly_click', handlePointClick);
  };

  const getMeasuredDataPoints = () => {
    const measuredDataPoints = regressionData ? regressionData.map(point => ({
      voltage: point.voltage,
      velocity: point.velocity
    })) : [];
    
    const hasOrigin = measuredDataPoints.some(point => point.voltage === 0);
    if (!hasOrigin) {
      measuredDataPoints.push({ voltage: 0, velocity: 0 });
    }
    
    return measuredDataPoints.sort((a, b) => a.voltage - b.voltage);
  };

  const createMeasuredDataTrace = (dataPoints) => {
    return {
      x: dataPoints.map(p => p.voltage),
      y: dataPoints.map(p => p.velocity),
      mode: 'markers+lines',
      type: 'scatter',
      name: 'Messwerte (v)',
      line: {
        color: 'black',
        width: 2
      },
      marker: {
        size: 10,
        color: 'black',
        line: {
          width: 2,
          color: 'white'
        }
      },
      hovertemplate: '<b>Voltage:</b> %{x:.2f}V<br><b>Velocity:</b> %{y:.6f} mm/s<extra></extra>'
    };
  };

  const createCalculatedRegressionTrace = () => {
    const xRange = [];
    const yRange = [];
    
    for (let x = -10; x <= 10; x += 0.1) {
      xRange.push(x);
      yRange.push(analysis.calculatedSlope * x + (analysis.intercept || 0));
    }

    return {
      x: xRange,
      y: yRange,
      mode: 'lines',
      type: 'scatter',
      name: 'Regressionsgerade (berechnet)',
      line: {
        color: 'blue',
        width: 2
      },
      hovertemplate: '<b>Calculated Line</b><br>Voltage: %{x:.2f}V<br>Velocity: %{y:.6f} mm/s<extra></extra>'
    };
  };

  const createManualRegressionTrace = () => {
    const xRange = [];
    const yRange = [];
    
    for (let x = -10; x <= 10; x += 0.1) {
      xRange.push(x);
      yRange.push(analysis.manualSlope * x + (analysis.intercept || 0));
    }

    return {
      x: xRange,
      y: yRange,
      mode: 'lines',
      type: 'scatter',
      name: 'Regressionsgerade (gewählt)',
      line: {
        color: 'red',
        width: 2
      },
      hovertemplate: '<b>Manual Line</b><br>Voltage: %{x:.2f}V<br>Velocity: %{y:.6f} mm/s<extra></extra>'
    };
  };

  const createSpeedLimitTraces = () => {
    if (!analysis.machineParams) return [];

    const traces = [];
    const xRange = [-10, 10];
    
    traces.push({
      x: xRange,
      y: [analysis.machineParams.lower, analysis.machineParams.lower],
      mode: 'lines',
      type: 'scatter',
      name: 'Brenngeschwindigkeit Grenzen',
      line: {
        color: 'lightgreen',
        width: 1,
        dash: 'dash'
      },
      showlegend: true,
      hovertemplate: '<b>Lower Speed Limit:</b> %{y:.1f} mm/s<extra></extra>'
    });

    traces.push({
      x: xRange,
      y: [analysis.machineParams.middle, analysis.machineParams.middle],
      mode: 'lines',
      type: 'scatter',
      name: '',
      line: {
        color: 'green',
        width: 1,
        dash: 'dash'
      },
      showlegend: false,
      hovertemplate: '<b>Middle Speed Limit:</b> %{y:.1f} mm/s<extra></extra>'
    });

    traces.push({
      x: xRange,
      y: [analysis.machineParams.upper, analysis.machineParams.upper],
      mode: 'lines',
      type: 'scatter',
      name: '',
      line: {
        color: 'lightgreen',
        width: 1,
        dash: 'dash'
      },
      showlegend: false,
      hovertemplate: '<b>Upper Speed Limit:</b> %{y:.1f} mm/s<extra></extra>'
    });

    return traces;
  };

  const createDeviationAnnotations = () => {
    if (!analysis.deviations || analysis.deviations.length === 0) {
      return [];
    }

    const THRESHOLDS = {
      GREEN: 5,
      ORANGE: 20
    };

    const getDeviationColor = (deviation) => {
      const absDeviation = Math.abs(deviation);
      if (absDeviation <= THRESHOLDS.GREEN) return 'green';
      if (absDeviation <= THRESHOLDS.ORANGE) return 'orange';
      return 'red';
    };

    const annotations = [];

    analysis.deviations.forEach(dev => {
      if (dev.measuredVoltage === 0) return;

      const measuredV = dev.measuredVoltage;
      const measuredVel = dev.measuredVelocity;
      const deviation = dev.deviation;

      const sign = deviation > 0 ? '+' : '';
      const deviationText = `${sign}${deviation.toFixed(1)}%`;
      const color = getDeviationColor(deviation);

      annotations.push({
        x: measuredV,
        y: measuredVel,
        text: deviationText,
        showarrow: false,
        font: {
          size: 11,
          color: color,
          family: 'Arial, sans-serif',
          weight: 'bold'
        },
        xanchor: 'center',
        yanchor: 'bottom',
        yshift: 10
      });
    });

    return annotations;
  };

  const handlePointClick = (data) => {
    if (data.points && data.points.length > 0) {
      const point = data.points[0];
      
      if (point.curveNumber === 0) {
        const pointKey = `${point.x}-${point.y}`;
        const newSelected = new Set(selectedPoints);
        
        if (selectedPoints.has(pointKey)) {
          newSelected.delete(pointKey);
        } else {
          newSelected.add(pointKey);
        }
        
        setSelectedPoints(newSelected);
        
        const colors = getMeasuredDataPoints().map((_, index) => {
          const key = `${point.x}-${point.y}`;
          return newSelected.has(key) ? 'orange' : 'black';
        });
        
        const update = {
          'marker.color': [colors]
        };
        
        Plotly.restyle(plotRef.current, update, [0]);
      }
    }
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
        <div 
          ref={plotRef} 
          style={{ 
            width: '100%', 
            height: `${height}px` 
          }} 
        />
      </div>
    </div>
  );
};

export default SpeedCheckChart;