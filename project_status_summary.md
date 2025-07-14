# CSV Analysis Tool - Projekt Status & Setup (Updated)

## Aktuelle Situation

**✅ Was funktioniert (COMPLETED):**
- React App ist vollständig lauffähig mit bidirectionalem System
- Build-System (Webpack) funktioniert einwandfrei
- Git Repository erfolgreich auf GitHub: https://github.com/yuukischlatter/csv-analysis-tool
- Dependencies installiert: `papaparse`, `react-dropzone`, `d3`
- **CSV Upload Interface**: Multi-file drag & drop funktioniert
- **Test Data Form**: 5-Kategorie Eingabeformular mit Auto-Mapping
- **Dual D3.js Charts**: Responsive charts mit 4 interaktiven vertical drag lines
- **Dual Slope Detection**: Automatische Up+Down Erkennung + Fallback system
- **Combined Approval System**: Workflow mit Auto-Navigation zwischen files
- **Bidirectional Status Tracking**: Farbkodierte Approval-States für beide Rampen
- **Auto-Unapproval**: Bei manuellen Änderungen wird Status zurückgesetzt
- **Regression Analysis**: Live UE vs Velocity Chart mit 1:1 Scale
- **Enhanced Export**: CSV mit Formulardaten und bidirektionalen Werten

**❌ Bekanntes Problem:**
- Electron Desktop App startet nicht (Display/Windows-spezifisches Problem)
- Node.js und Electron laden korrekt, aber Fenster erscheint nicht

**🔄 Workaround (funktioniert perfekt):**
- Entwicklung läuft über Browser mit `live-server`
- Alle Features funktionieren im Browser einwandfrei

## Implementierte Features

### ✅ Phase 1: Test Data Form Integration
- **TestDataForm.js**: 5-Kategorie Eingabeformular (Auftragsdaten, Prüfung, Regelventil, Prüfbedingungen)
- **ventilMapping.js**: S-CH to Parker Auto-Mapping mit Nenndurchfluss
- **Form validation**: Eingabevalidierung mit Toleranz-Hinweisen
- **Integration**: Vollständige App.js Integration mit State Management

### ✅ Phase 2: Bidirectional CSV Processing  
- **csvProcessor.js**: PapaParse integration, extracts columns 1+4
- **slopeDetection.js**: Dual slope detection (ramp up + ramp down)
  - Automatic detection für beide Richtungen
  - Fallback markers: Up (10%-40%), Down (60%-90%)
  - Individual validation für jede Rampe
- **dataValidator.js**: Enhanced dual CSV format validation

### ✅ Phase 3: Dual Ramp Chart Visualization  
- **LineChart.js**: Interactive dual ramp charts with:
  - Responsive sizing (adapts to container width)
  - 4 vertical red drag lines (upStart, upEnd, downStart, downEnd)
  - Dual automatic intersection dots (green + red)
  - Dual transparent areas (green for up, red for down)
  - Independent drag-on-release behavior for each marker
  - Separate validation for each ramp type

### ✅ Phase 4: Combined Approval Workflow System
- **ApprovalButton.js**: Combined approval interface component
- **ResultsTable.js**: Bidirectional status display with:
  - Symmetric voltage arrangement (-10V to +10V)
  - 0V reference row in center (0 mm/s baseline)
  - Dual entries per CSV file (up ↗️ + down ↘️)
  - Combined status indicators:
    - ✅ Green tick: Approved + auto-detected (both ramps)
    - ✅ Orange tick: Approved + manually adjusted (both ramps)
    - ⏳ Gray clock: Pending review (combined status)
- **Auto-Navigation**: After approval → jump to next unapproved file
- **Auto-Unapproval**: Manual marker changes → requires re-approval

### ✅ Phase 5: Bidirectional Voltage Mapping & Export
- **voltageMapper.js**: Bidirectional voltage assignment:
  - 33 voltage values from -10.00V to +10.00V
  - Ramp Up → Positive voltages (+10V, +9V, +7V, ...)
  - Ramp Down → Negative voltages (-10V, -9V, -7V, ...)
  - Automatic sorting by velocity (fastest = highest absolute voltage)
- **Enhanced Export functionality**: 
  - CSV with test form data integration
  - Bidirectional structure with ramp type indicators
  - Statistical analysis for both ramp types
  - Automatic filename generation with Auftrags-Nr.

### ✅ Phase 6: Regression Analysis Integration
- **regressionAnalysis.js**: Mathematical analysis service:
  - Linear regression calculation with R² determination
  - Smooth curve generation (natural curve through points)
  - Dynamic Y-scale calculation (±max velocity + 2mm/s)
  - Statistical analysis for approved data points
- **RegressionChart.js**: Professional regression visualization:
  - 1:1 scale ratio (1 Volt = 1 mm/s visually)
  - Fixed X-axis (-10V to +10V), dynamic Y-axis
  - Black data points for approved measurements
  - Black smooth curve through points
  - Thin red linear regression line
  - Gray zero reference lines (0V, 0mm/s)
  - Live updates after each approval
  - Grid system with equal spacing
  - Statistical display (equation, R², data counts)

## Aktueller Setup

### Projektstruktur (Updated)
```
csv-analysis-tool/
├── package.json                          # ✅ Konfiguriert (d3 added)
├── webpack.config.js                     # ✅ Funktioniert
├── electron.js                           # ⚠️  Startet nicht (aber nicht nötig)
├── src/
│   ├── index.js                          # ✅ React Entry
│   ├── App.js                            # ✅ Main App mit Dual System + Regression
│   ├── components/
│   │   ├── forms/
│   │   │   └── TestDataForm.js           # ✅ 5-Kategorie Eingabeformular
│   │   ├── upload/
│   │   │   └── FileUpload.js             # ✅ Multi-file drag & drop
│   │   ├── charts/
│   │   │   ├── ChartContainer.js         # ✅ D3 React wrapper
│   │   │   ├── LineChart.js              # ✅ Dual interactive charts (4 markers)
│   │   │   └── RegressionChart.js        # ✅ UE vs Velocity analysis (1:1 scale)
│   │   ├── export/
│   │   │   └── ResultsTable.js           # ✅ Bidirectional status-aware table
│   │   └── common/
│   │       └── ApprovalButton.js         # ✅ Combined approval interface
│   └── services/
│       ├── csvProcessor.js               # ✅ CSV parsing
│       ├── slopeDetection.js             # ✅ Dual slope detection
│       ├── voltageMapper.js              # ✅ Bidirectional voltage mapping
│       ├── ventilMapping.js              # ✅ S-CH to Parker auto-mapping
│       └── regressionAnalysis.js         # ✅ Mathematical regression analysis
├── public/
│   └── index.html                        # ✅ HTML Template
└── build/                                # ✅ Build Output
    ├── index.html
    └── bundle.js
```

### Installierte Dependencies (Updated)
```json
{
  "dependencies": {
    "electron": "^25.9.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "papaparse": "^5.4.1",
    "react-dropzone": "^14.3.5",
    "d3": "^7.x.x"
  }
}
```

## Wie man die App startet

### Browser-Entwicklung (EMPFOHLEN - funktioniert perfekt)
```bash
# Build erstellen
npm run build

# Live-Server starten
cd build
live-server
# Öffnet http://127.0.0.1:8080
```

### Alternative: Webpack Dev Server
```bash
# Development server
npm start
# Öffnet http://localhost:3000
```

## Vollständiger User Workflow

### 1. **Test Data Input**
- 5-Kategorie Eingabeformular oberhalb des File Uploads
- **Auftragsdaten**: Auftrags-Nr., Maschinentyp (Dropdown)
- **Prüfung**: Prüfer, Datum
- **Regelventil**: S-CH Art.-Nr. (Dropdown) → Auto-mapping zu Parker + Nenndurchfluss
- **Prüfbedingungen**: 5 Felder mit Toleranz-Hinweisen und Einheiten
- Form-Daten werden in Export integriert

### 2. **File Upload**
- Drag & Drop von CSV files (multiple files supported)
- Automatic dual slope processing (up + down detection)
- Files mit Fehlern werden als "fallback markers" behandelt

### 3. **Dual Analysis Review**
- Auto-select erstes File für Dual Chart view
- Interactive chart mit 4 draggable vertical lines:
  - **Grüne Marker**: Ramp Up (upStart, upEnd)
  - **Rote Marker**: Ramp Down (downStart, downEnd)
- Real-time dual velocity calculation beim Marker verschieben
- Separate transparente Bereiche für beide Rampen

### 4. **Combined Approval Process**  
- "Approve" button für beide Rampen gleichzeitig
- Auto-navigation zum nächsten unapproved file
- Status tracking in Results table:
  - ✅ Grün: Approved + auto-detected (beide Rampen)
  - ✅ Orange: Approved + manually adjusted (beide Rampen)
  - ⏳ Grau: Pending review (combined status)

### 5. **Live Regression Analysis**
- **Regression Chart** unterhalb des Dual Charts
- Updates automatisch nach jeder Approval
- Zeigt nur approved Messungen an
- **1:1 Scale**: 1 Volt = 1 mm/s visuell
- **Schwarze Punkte**: Alle approved Messungen
- **Schwarze Kurve**: Natürliche Kurve durch Punkte
- **Rote Linie**: Lineare Regression
- **Statistiken**: R², Gleichung, Datenanzahl

### 6. **Enhanced Export Results**
- "Export Dual CSV" button in Results section
- Bidirectional voltage assignment (-10V bis +10V)
- Automatic sorting: schnellste Velocity = höchste absolute Spannung
- **Export Structure**:
  - Test form data (alle 5 Kategorien)
  - Bidirectional measurement results
  - Statistical analysis
  - Timestamp für Rückverfolgbarkeit

## Nächste Entwicklungsschritte (Advanced Export)

### 🎯 Phase 7: Advanced Export Features (NEXT)
- **PDF Export**: Professional reports mit embedded charts (dual + regression)
- **Excel Export**: Multi-sheet workbooks mit formatted data
- **Report Templates**: Customizable export formats mit Schlatter branding
- **Chart Embedding**: Dual charts und regression charts in PDF
- **Batch Export**: Multiple format options

### Mögliche Export Features:
- PDF mit embedded dual charts + regression analysis
- Excel export mit multiple sheets (raw data, analysis, charts)
- Custom report templates mit Schlatter CI/CD
- Automated email export functionality
- Advanced statistical analysis reports

## Entwicklungsworkflow

**Aktueller empfohlener Workflow:**
1. Code in VS Code bearbeiten
2. `npm run build` ausführen
3. `live-server` in build/ Ordner starten
4. Browser-basierte Entwicklung (funktioniert perfekt)
5. Git commits für Fortschritt tracking

## Git Status (Updated)
- Repository: https://github.com/yuukischlatter/csv-analysis-tool
- Branch: main
- Status: Complete bidirectional system with regression analysis COMPLETED
- Bereit für Advanced Export enhancement phase

## Commands zum Weitermachen

```bash
# Projekt öffnen
cd C:\Users\scy\Documents\Ventil_Kennlinien\csv-analysis-tool
code .

# Entwicklung starten (Browser)
npm run build
cd build
live-server

# Alternative: Dev Server
npm start

# Git Updates
git add .
git commit -m "Complete bidirectional system with live regression analysis"
git push
```

## Aktueller Zustand

**Status: BIDIRECTIONAL SYSTEM WITH REGRESSION ANALYSIS COMPLETED ✅**

- ✅ Test Data Form Integration (5 Kategorien)
- ✅ Dual CSV Upload & Processing
- ✅ Interactive Dual Ramp Charts (4 markers)
- ✅ Combined Approval Workflow System
- ✅ Bidirectional Voltage Mapping (-10V to +10V)
- ✅ Live Regression Analysis (1:1 scale)
- ✅ Enhanced Export with Form Data Integration

**Bereit für:** Advanced Export Features & Professional Report Generation

**Performance:** Excellent - alle Features funktionieren flüssig im Browser
**User Experience:** Professional bidirectional workflow mit intuitive dual controls
**Code Quality:** Clean, modular structure ready for advanced export expansion
**Unique Features:** 
- Bidirectional voltage analysis system
- Live regression analysis mit 1:1 scale
- Combined approval für beide Rampen
- Professional test data integration
- Enhanced statistical analysis