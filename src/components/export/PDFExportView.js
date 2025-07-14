import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * PDFExportView Component
 * Recreates the exact layout of the original German velocity measurement protocol
 * Optimized for both screen preview and PDF printing
 */
const PDFExportView = ({ pdfData, isPreview = true, onClose }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (pdfData?.chartData && chartRef.current) {
      renderPDFChart();
    }
  }, [pdfData]);

  const renderPDFChart = () => {
    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const { dataPoints, regressionLine, statistics } = pdfData.chartData;
    
    // Chart dimensions - matching original PDF proportions
    const margin = { top: 40, right: 20, bottom: 60, left: 80 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Fixed domains matching original PDF
    const xDomain = [-10, 10];
    const yDomain = [-17, 33]; // Matching original PDF Y-axis range

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0]);

    // Grid lines (major every 1 unit)
    const xGridValues = d3.range(xDomain[0], xDomain[1] + 1, 1);
    const yGridValues = d3.range(yDomain[0], yDomain[1] + 1, 1);

    // Vertical grid lines
    g.selectAll(".grid-line-x")
      .data(xGridValues)
      .enter().append("line")
      .attr("class", "grid-line-x")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);

    // Horizontal grid lines
    g.selectAll(".grid-line-y")
      .data(yGridValues)
      .enter().append("line")
      .attr("class", "grid-line-y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickValues(xGridValues))
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(yScale).tickValues(yGridValues))
      .style("font-size", "10px");

    // Axis labels
    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + 45})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Eingangsspannung UE [V]");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Schlittengeschwindigkeit v [mm/s]");

    // Chart title
    g.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Diagramm der Messwerte und Regressionsgerade");

    // Regression line (red)
    if (regressionLine && regressionLine.length > 0) {
      const line = d3.line()
        .x(d => xScale(d.voltage))
        .y(d => yScale(d.velocity));

      g.append("path")
        .datum(regressionLine)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", line);
    }

    // Data points (black dots)
    if (dataPoints && dataPoints.length > 0) {
      g.selectAll(".data-point")
        .data(dataPoints)
        .enter().append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.voltage))
        .attr("cy", d => yScale(d.velocity))
        .attr("r", 2.5)
        .attr("fill", "black");
    }

    // Zero reference lines
    g.append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5);

    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#666")
      .attr("stroke-width", 1)
      .attr("opacity", 0.5);
  };

  if (!pdfData) {
    return (
      <div className="pdf-export-error">
        <h2>PDF Export Error</h2>
        <p>No data available for PDF export.</p>
        {isPreview && (
          <button onClick={onClose}>Close</button>
        )}
      </div>
    );
  }

  const { header, measurementTable, systemParameters, timestamp } = pdfData;

  return (
    <div className={`pdf-export-container ${isPreview ? 'preview-mode' : 'print-mode'}`}>
      <style jsx>{`
        .pdf-export-container {
          width: 297mm;
          min-height: 210mm;
          margin: 0 auto;
          background: white;
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #000;
          position: relative;
          box-shadow: ${isPreview ? '0 0 10px rgba(0,0,0,0.1)' : 'none'};
        }

        .preview-mode {
          margin: 20px auto;
          transform: scale(0.8);
          transform-origin: top center;
        }

        .print-mode {
          transform: none;
          box-shadow: none;
        }

        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15mm 20mm 10mm 20mm;
          border-bottom: 2px solid #003875;
        }

        .company-logo {
          height: 40px;
          width: auto;
        }

        .document-title {
          font-size: 18px;
          font-weight: bold;
          color: #003875;
          text-align: center;
          flex-grow: 1;
          margin: 0 20px;
        }

        .pdf-content {
          display: grid;
          grid-template-columns: 200px 1fr 180px;
          gap: 15px;
          padding: 15mm 20mm;
          min-height: 140mm;
        }

        .left-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .data-section {
          border: 1px solid #666;
          background: #f8f8f8;
        }

        .section-header {
          background: #003875;
          color: white;
          padding: 4px 8px;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
        }

        .section-content {
          padding: 6px;
        }

        .data-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 9px;
        }

        .data-label {
          font-weight: normal;
          flex: 1;
        }

        .data-value {
          font-weight: bold;
          margin-left: 10px;
        }

        .center-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .chart-container {
          border: 1px solid #666;
          background: white;
          padding: 10px;
        }

        .right-column {
          display: flex;
          flex-direction: column;
        }

        .messwerte-section {
          border: 1px solid #666;
          background: #f8f8f8;
          height: fit-content;
        }

        .messwerte-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8px;
        }

        .messwerte-table th {
          background: #003875;
          color: white;
          padding: 3px;
          text-align: center;
          font-size: 7px;
          font-weight: bold;
        }

        .messwerte-table td {
          padding: 2px 4px;
          text-align: center;
          border-bottom: 1px solid #ddd;
          font-family: monospace;
        }

        .messwerte-table tr:nth-child(even) td {
          background: #f5f5f5;
        }

        .voltage-positive {
          color: #006400;
        }

        .velocity-positive {
          color: #006400;
        }

        .velocity-negative {
          color: #8B0000;
        }

        .system-parameters {
          margin-top: 15px;
          border: 1px solid #666;
          background: #f0f8ff;
        }

        .parameters-content {
          padding: 8px;
          font-size: 9px;
        }

        .parameter-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .parameter-label {
          flex: 1;
        }

        .parameter-value {
          font-weight: bold;
          font-family: monospace;
          margin-left: 10px;
        }

        .pdf-footer {
          position: absolute;
          bottom: 15mm;
          right: 20mm;
          font-size: 10px;
          color: #666;
        }

        .close-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          padding: 10px 20px;
          background: #003875;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .close-button:hover {
          background: #002855;
        }

        @media print {
          .pdf-export-container {
            width: 100%;
            height: 100%;
            transform: none !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          
          .close-button {
            display: none !important;
          }
          
          .preview-mode {
            transform: none !important;
          }
        }

        @page {
          size: A4 landscape;
          margin: 10mm;
        }
      `}</style>

      {isPreview && (
        <button className="close-button" onClick={onClose}>
          ✕ Close Preview
        </button>
      )}

      {/* Header */}
      <div className="pdf-header">
        <img 
          src="/assets/schlatter-logo.png" 
          alt="Schlatter Industries" 
          className="company-logo"
          onError={(e) => {e.target.style.display = 'none'}}
        />
        <h1 className="document-title">Protokoll zur Geschwindigkeitsmessung</h1>
        <div style={{width: '100px'}}></div> {/* Spacer for balance */}
      </div>

      {/* Main Content */}
      <div className="pdf-content">
        {/* Left Column - Data Tables */}
        <div className="left-column">
          {/* Auftragsdaten */}
          <div className="data-section">
            <div className="section-header">Auftragsdaten</div>
            <div className="section-content">
              <div className="data-row">
                <span className="data-label">Auftrags-Nr.:</span>
                <span className="data-value">{header.auftragsdaten.auftragsNr}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Maschinentyp:</span>
                <span className="data-value">{header.auftragsdaten.maschinentyp}</span>
              </div>
            </div>
          </div>

          {/* Prüfung */}
          <div className="data-section">
            <div className="section-header">Prüfung</div>
            <div className="section-content">
              <div className="data-row">
                <span className="data-label">Prüfer:</span>
                <span className="data-value">{header.pruefung.pruefer}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Datum:</span>
                <span className="data-value">{header.pruefung.datum}</span>
              </div>
            </div>
          </div>

          {/* Regelventil */}
          <div className="data-section">
            <div className="section-header">Regelventil</div>
            <div className="section-content">
              <div className="data-row">
                <span className="data-label">Art.-Nr. S-CH:</span>
                <span className="data-value">{header.regelventil.artNrSCH}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Art.-Nr. Parker:</span>
                <span className="data-value">{header.regelventil.artNrParker}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Nenndurchfluss:</span>
                <span className="data-value">{header.regelventil.nenndurchfluss}</span>
              </div>
              <div className="data-row">
                <span className="data-label">S/N Parker:</span>
                <span className="data-value">{header.regelventil.snParker}</span>
              </div>
            </div>
          </div>

          {/* Prüfbedingungen */}
          <div className="data-section">
            <div className="section-header">Prüfbedingungen</div>
            <div className="section-content">
              <div className="data-row">
                <span className="data-label">Ventilabgleich UEQ:</span>
                <span className="data-value">{header.pruefbedingungen.ventilabgleichUEQ.toFixed(2)} V</span>
              </div>
              <div className="data-row">
                <span className="data-label">Druck am Ventil:</span>
                <span className="data-value">{header.pruefbedingungen.druckVentil.toFixed(2)} bar</span>
              </div>
              <div className="data-row">
                <span className="data-label">Öltemperatur:</span>
                <span className="data-value">{header.pruefbedingungen.oeltemperatur.toFixed(2)} °C</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Chart */}
        <div className="center-column">
          <div className="chart-container">
            <svg ref={chartRef} width="600" height="400"></svg>
          </div>

          {/* System Parameters */}
          <div className="system-parameters">
            <div className="section-header">Systemparameter für SWEP-Formular</div>
            <div className="parameters-content">
              <div className="parameter-row">
                <span className="parameter-label">Geschwindigkeitsänderung pro Volt (Steigung der Regr.ger.)</span>
                <span className="parameter-value">{systemParameters.geschwindigkeitsaenderungProVolt.toFixed(2)} mm/s/V</span>
              </div>
              <div className="parameter-row">
                <span className="parameter-label">Schlittengeschwindigkeit bei 0.3 V (Eingabe SWEP-Form)</span>
                <span className="parameter-value">{systemParameters.geschwindigkeitBei03V.toFixed(3)} mm/s</span>
              </div>
              <div className="parameter-row">
                <span className="parameter-label">Maximale Schlittengeschwindigkeit bei 10 V</span>
                <span className="parameter-value">{systemParameters.maxGeschwindigkeitBei10V.toFixed(2)} mm/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Measurement Table */}
        <div className="right-column">
          <div className="messwerte-section">
            <div className="section-header">Messwerte</div>
            <table className="messwerte-table">
              <thead>
                <tr>
                  <th>Eingangsspannung<br/>UE [V]</th>
                  <th>Schlittengeschw.<br/>v [mm/s]</th>
                </tr>
              </thead>
              <tbody>
                {measurementTable.map((measurement, index) => (
                  <tr key={index}>
                    <td className={measurement.voltage > 0 ? 'voltage-positive' : ''}>
                      {measurement.voltage.toFixed(2)}
                    </td>
                    <td className={measurement.velocity > 0 ? 'velocity-positive' : 'velocity-negative'}>
                      {measurement.velocity.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pdf-footer">
        {timestamp}
      </div>
    </div>
  );
};

export default PDFExportView;