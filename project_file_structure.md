# CSV Analysis Tool - Dateistruktur & Beschreibungen (Updated)

## Root Level

### `package.json`
- **Zweck**: NPM Konfiguration
- **Inhalt**: Dependencies (electron, react, d3, papaparse, react-dropzone), Scripts (dev, build, dist), Metadaten
- **Status**: ✅ COMPLETED - alle Dependencies installiert

### `electron.js`
- **Zweck**: Main Electron Process (optional)
- **Inhalt**: App-Fenster erstellen, Menu-Bar, File-System Zugriff
- **Status**: ⚠️ PROBLEMATIC - startet nicht, aber Browser-Version funktioniert perfekt

### `build/electron-builder.config.js`
- **Zweck**: Electron Build Konfiguration (future)
- **Inhalt**: Portable .exe Einstellungen, Icons, Dateipfade
- **Status**: 📋 PLANNED - für zukünftige Desktop-Distribution

---

## Public Directory

### `public/index.html`
- **Zweck**: HTML Entry Point für React
- **Inhalt**: Basic HTML Structure, React Mount Point, Meta Tags
- **Status**: ✅ COMPLETED

### `public/assets/` (future)
- **Zweck**: Statische Assets
- **Inhalt**: Icons (.ico), Images, Logos (evtl. Schlatter Logo)
- **Status**: 📋 PLANNED

---

## Source Directory (src/)

### `src/index.js`
- **Zweck**: React Entry Point
- **Inhalt**: ReactDOM.render(), App Component Import, React 18 setup
- **Status**: ✅ COMPLETED

### `src/App.js`
- **Zweck**: Main App Component
- **Inhalt**: Complete bidirectional workflow management, Dual State Management, Combined Approval System, Regression Chart Integration
- **Status**: ✅ COMPLETED - Full bidirectional dual-ramp workflow with regression analysis
- **Features**: 
  - Dual slope processing coordination
  - Combined approval status tracking (both ramps)
  - Manual adjustment detection for both ramps
  - Auto-unapproval on changes
  - Responsive dual chart integration
  - Live regression chart updates

---

## Components Directory

### Common Components (`src/components/common/`)

#### `ApprovalButton.js` ✅ COMPLETED
- **Zweck**: Combined Approval Interface Component
- **Inhalt**: Approval button für beide Rampen gleichzeitig, status-aware styling, onClick handler
- **Features**: Visual feedback, disabled state when approved, hover effects, combined ramp approval

#### `Button.js` (future)
- **Zweck**: Reusable Button Component
- **Inhalt**: Styled Button mit Props (variant, size, disabled, onClick)
- **Status**: 📋 PLANNED - for advanced UI consistency

#### `LoadingSpinner.js` (future)
- **Zweck**: Loading Animation
- **Status**: 📋 PLANNED

#### `Modal.js` (future)
- **Zweck**: Modal Dialog Component
- **Status**: 📋 PLANNED - for advanced export options

### Upload Components (`src/components/upload/`)

#### `FileUpload.js` ✅ COMPLETED
- **Zweck**: Drag & Drop File Upload
- **Inhalt**: React-Dropzone Integration, File Validation, Multiple Files Support
- **Features**: 
  - Visual drag states
  - File status tracking (OK/ERROR)
  - Upload progress display
  - Clear all functionality

#### `FileList.js` (integrated)
- **Zweck**: Liste der hochgeladenen Files
- **Status**: ✅ INTEGRATED into FileUpload.js

#### `UploadProgress.js` (integrated)
- **Zweck**: Upload Progress Anzeige
- **Status**: ✅ INTEGRATED into FileUpload.js

### Chart Components (`src/components/charts/`)

#### `ChartContainer.js` ✅ COMPLETED
- **Zweck**: React Wrapper für D3 Charts
- **Inhalt**: useRef Hook für D3 Mount, Props Handling, Responsive sizing
- **Features**: 
  - Responsive width calculation
  - Chart metadata display
  - Error boundary handling

#### `LineChart.js` ✅ COMPLETED - DUAL RAMP SYSTEM
- **Zweck**: D3 Dual Line Chart Implementation
- **Inhalt**: D3 Scales, Axes, Path Drawing, 4-Marker Interactive Behavior
- **Features**: 
  - 4 vertical draggable markers (upStart, upEnd, downStart, downEnd)
  - Dual drag-on-release behavior (smooth performance)
  - Automatic intersection dots for both ramps
  - Dual transparent areas (green for up, red for down)
  - Grid lines and professional styling
  - Responsive sizing
  - Separate validation for each marker type

#### `RegressionChart.js` ✅ COMPLETED - NEW
- **Zweck**: UE vs Velocity Regression Analysis Chart
- **Inhalt**: D3.js Non-interactive chart with regression analysis
- **Features**:
  - 1:1 scale ratio (Volt = mm/s visually)
  - Fixed X-axis (-10V to +10V), dynamic Y-axis (±max velocity + 2mm/s)
  - Black data points for approved measurements
  - Black natural curve through points (smooth interpolation)
  - Thin red linear regression line
  - Grid system with equal spacing
  - Zero reference lines (gray)
  - Live updates after each approval
  - Statistical display (R², equation, data counts)

#### `DraggableMarker.js` (integrated)
- **Zweck**: Verschiebbare Marker auf Charts
- **Status**: ✅ INTEGRATED into LineChart.js (now 4 markers)

#### `ChartControls.js` (future)
- **Zweck**: Chart Kontroll-Buttons
- **Status**: 📋 PLANNED - zoom, pan, reset controls

### Forms Components (`src/components/forms/`)

#### `TestDataForm.js` ✅ COMPLETED
- **Zweck**: 5-Category Test Data Input Form
- **Inhalt**: Auftragsdaten, Prüfung, Regelventil, Prüfbedingungen input sections
- **Features**:
  - Auto-mapping S-CH → Parker + Nenndurchfluss
  - Tolerance hints for test conditions
  - Dropdown selections (Maschinentyp, Ventil-Arten)
  - Input validation and units display
  - Form state management with callbacks

### Export Components (`src/components/export/`)

#### `ResultsTable.js` ✅ COMPLETED - DUAL BIDIRECTIONAL SYSTEM
- **Zweck**: Bidirectional Results Display mit Combined Status Tracking
- **Inhalt**: Symmetric voltage table with dual ramp display, Combined approval status
- **Features**:
  - 0V reference row in center (0 mm/s baseline)
  - Dual entries per CSV file (up + down ramps)
  - Status column with color-coded indicators:
    - ✅ Green: Approved + auto-detected (both ramps)
    - ✅ Orange: Approved + manually adjusted (both ramps)
    - ⏳ Gray: Pending review (combined status)
  - Row highlighting based on ramp type and status
  - Click-to-select functionality
  - Responsive table design
  - Voltage range: +10V to -10V symmetric display
  - Ramp type indicators (↗️ Up, ↘️ Down, ⚪ Reference)

#### `ExportPanel.js` (future - NEXT PHASE)
- **Zweck**: Advanced Export Interface
- **Inhalt**: Export format selection, preview, batch options
- **Status**: 🎯 NEXT PHASE - Advanced export features

#### `DataTable.js` (integrated)
- **Zweck**: Tabelle mit Ergebnissen
- **Status**: ✅ INTEGRATED into ResultsTable.js

---

## Services Directory

### `src/services/csvProcessor.js` ✅ COMPLETED
- **Zweck**: CSV Parsing & Processing
- **Inhalt**: PapaParse Integration, Column extraction (1+4), Data Transformation
- **Features**: 
  - Error handling and validation
  - Dynamic typing
  - File name tracking
  - Data structure validation

### `src/services/slopeDetection.js` ✅ COMPLETED - DUAL SLOPE SYSTEM
- **Zweck**: Dual Slope Detection & Analysis
- **Inhalt**: Automatic positive AND negative slope detection, Dual fallback system, Live dual recalculation
- **Features**: 
  - Automatic dual slope detection (up + down)
  - Dual fallback markers: Up (10%-40%), Down (60%-90%)
  - Linear regression analysis for both ramps (R² calculation)
  - Live dual velocity recalculation
  - Detection method tracking (automatic/fallback/manual)
  - Individual ramp validation
  - **Functions**: detectDualSlopes(), findRampUp(), findRampDown(), generateDualFallbackMarkers(), recalculateDualVelocity()

### `src/services/voltageMapper.js` ✅ COMPLETED - BIDIRECTIONAL SYSTEM
- **Zweck**: Bidirectional Voltage Assignment & Export
- **Inhalt**: Dual velocity-to-voltage mapping (-10V to +10V), Enhanced CSV export, Dual data validation
- **Features**: 
  - Bidirectional voltage scale: 33 values from -10V to +10V
  - Automatic sorting by velocity (fastest = highest absolute voltage)
  - Symmetric voltage assignment (up = positive, down = negative)
  - Enhanced CSV export with test form data integration
  - Result validation for dual system
  - Statistics calculation for both ramp types
  - **Functions**: mapDualVelocitiesToVoltages(), exportDualToCSV(), downloadDualCSV(), validateDualMapping()

### `src/services/regressionAnalysis.js` ✅ COMPLETED - NEW
- **Zweck**: Mathematical Regression Analysis for UE vs Velocity
- **Inhalt**: Linear regression calculation, smooth curve generation, statistical analysis
- **Features**:
  - Linear regression with R² calculation
  - Smooth curve interpolation (natural curve through points)
  - Dynamic Y-scale calculation (±max velocity + 2mm/s)
  - Regression line generation across full domain
  - Statistical analysis (means, ranges, correlations)
  - Data validation for regression
  - **Functions**: calculateLinearRegression(), generateRegressionLine(), calculateSmoothCurve(), calculateDynamicYScale(), prepareRegressionData()

### `src/services/ventilMapping.js` ✅ COMPLETED
- **Zweck**: Ventil Data Mapping Service
- **Inhalt**: S-CH to Parker article number mapping, machine type definitions
- **Features**:
  - Complete ventil mapping table (5 entries)
  - Auto-mapping S-CH → Parker + Nenndurchfluss
  - Machine type dropdown options
  - Validation functions
  - **Data**: VENTIL_MAPPINGS, MASCHINEN_TYPEN

### `src/services/dataValidator.js` (integrated)
- **Zweck**: Daten-Validation
- **Status**: ✅ INTEGRATED into csvProcessor.js

### `src/services/chartDataProcessor.js` (integrated)
- **Zweck**: Daten für Charts vorbereiten
- **Status**: ✅ INTEGRATED into LineChart.js

### `src/services/exportService.js` (future - NEXT PHASE)
- **Zweck**: Advanced Export Features
- **Inhalt**: PDF Generation, Multiple formats, Report templates
- **Status**: 🎯 NEXT PHASE - Advanced export capabilities

---

## Utils Directory (future)

### `src/utils/constants.js` (future)
- **Zweck**: Projekt-Konstanten
- **Status**: 📋 PLANNED

### `src/utils/helpers.js` (future)
- **Zweck**: Allgemeine Hilfsfunktionen
- **Status**: 📋 PLANNED

### `src/utils/fileHandler.js` (integrated)
- **Zweck**: File System Utilities
- **Status**: ✅ INTEGRATED into csvProcessor.js

---

## Styles Directory (future)

### `src/styles/variables.css` (future)
- **Zweck**: Design System Variablen
- **Status**: 📋 PLANNED - currently using inline styles

### `src/styles/global.css` (future)
- **Zweck**: Globale Styles
- **Status**: 📋 PLANNED

### `src/styles/components.css` (future)
- **Zweck**: Component-spezifische Styles
- **Status**: 📋 PLANNED

### `src/styles/charts.css` (future)
- **Zweck**: Chart-spezifische Styles
- **Status**: 📋 PLANNED

### `src/styles/dashboard.css` (future)
- **Zweck**: Dashboard Layout Styles
- **Status**: 📋 PLANNED

---

## Hooks Directory (future)

### `src/hooks/useFileUpload.js` (integrated)
- **Zweck**: File Upload Logic Hook
- **Status**: ✅ INTEGRATED into App.js

### `src/hooks/useChartData.js` (integrated)
- **Zweck**: Chart Data Management Hook
- **Status**: ✅ INTEGRATED into App.js

### `src/hooks/useExport.js` (future)
- **Zweck**: Export Logic Hook
- **Status**: 📋 PLANNED for advanced export features

---

## Build Output

### `dist/` (future)
- **Zweck**: Production Build Output
- **Inhalt**: Optimized bundles, Electron executables
- **Status**: 📋 PLANNED for production deployment

---

## Implementierungsreihenfolge (COMPLETED ✅)

### ✅ Phase 1: Grundgerüst
- `package.json`, `App.js`, `index.js` - COMPLETED
- Basic React setup - COMPLETED

### ✅ Phase 2: CSV Upload & Processing
- `FileUpload.js`, `csvProcessor.js` - COMPLETED
- Multi-file drag & drop - COMPLETED
- Error handling - COMPLETED

### ✅ Phase 3: Test Data Form Integration
- `TestDataForm.js`, `ventilMapping.js` - COMPLETED
- 5-category input form - COMPLETED
- Auto-mapping S-CH → Parker - COMPLETED

### ✅ Phase 4: Dual Slope Detection & Analysis
- `slopeDetection.js` - COMPLETED (Dual System)
- Automatic dual detection + fallback - COMPLETED
- Live dual recalculation - COMPLETED

### ✅ Phase 5: Bidirectional Chart System
- `LineChart.js` - COMPLETED (4-Marker System)
- Interactive dual charts - COMPLETED
- 4 draggable markers - COMPLETED
- Dual drag-on-release behavior - COMPLETED

### ✅ Phase 6: Combined Approval Workflow System
- `ApprovalButton.js`, enhanced `ResultsTable.js` - COMPLETED
- Combined approval for both ramps - COMPLETED
- Auto-navigation - COMPLETED
- Status tracking for dual system - COMPLETED
- Auto-unapproval on changes - COMPLETED

### ✅ Phase 7: Bidirectional Voltage Mapping & Export
- `voltageMapper.js` - COMPLETED (Bidirectional System)
- Symmetric voltage assignment (-10V to +10V) - COMPLETED
- Enhanced CSV export with form data - COMPLETED

### ✅ Phase 8: Regression Analysis Integration
- `regressionAnalysis.js`, `RegressionChart.js` - COMPLETED
- Live regression chart updates - COMPLETED
- 1:1 scale visualization - COMPLETED
- Statistical analysis display - COMPLETED

---

## 🎯 NEXT PHASE: Advanced Export Features

### Planned Export Enhancements:
1. **PDF Export**: Professional reports with embedded charts (dual + regression)
2. **Excel Export**: Multi-sheet workbooks with formatted data
3. **Report Templates**: Customizable export formats
4. **Batch Processing**: Multiple export options
5. **Email Integration**: Direct report sharing

### Files to Create in Next Phase:
- `src/services/pdfExportService.js`
- `src/services/excelExportService.js`
- `src/components/export/ExportPanel.js`
- `src/components/export/ReportTemplate.js`

---

## Aktueller Status Summary

**✅ COMPLETED (100% functional):**
- Complete bidirectional user workflow from upload to combined approval
- Interactive dual-ramp chart analysis with professional UX
- 4-marker system for independent ramp adjustment
- Test data form integration with auto-mapping
- Combined approval system for both ramps simultaneously
- Bidirectional voltage mapping (-10V to +10V)
- Live regression analysis with 1:1 scale visualization
- Enhanced export functionality with form data integration

**🎯 READY FOR:** Advanced export features and report generation with embedded charts

**📊 Code Quality:** Clean, modular architecture ready for expansion with complete dual-ramp system

**🔧 System Features:**
- Bidirectional voltage analysis (-10V to +10V)
- Dual slope detection (up + down ramps)
- Combined approval workflow
- Live regression analysis
- Professional visualization
- Test data integration
- Enhanced export capabilities