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
- **Inhalt**: Complete workflow management, State Management, Approval System, Error Boundaries
- **Status**: ✅ COMPLETED - Full approval workflow with auto-navigation
- **Features**: 
  - File processing coordination
  - Approval status tracking
  - Manual adjustment detection
  - Auto-unapproval on changes
  - Responsive chart integration

---

## Components Directory

### Common Components (`src/components/common/`)

#### `ApprovalButton.js` ✅ COMPLETED
- **Zweck**: Approval Interface Component
- **Inhalt**: Approval button mit status-aware styling, onClick handler
- **Features**: Visual feedback, disabled state when approved, hover effects

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

#### `LineChart.js` ✅ COMPLETED
- **Zweck**: D3 Line Chart Implementation
- **Inhalt**: D3 Scales, Axes, Path Drawing, Interactive Behavior
- **Features**: 
  - Vertical draggable markers (easier than point markers)
  - Drag-on-release behavior (smooth performance)
  - Automatic intersection dots
  - Transparent red highlighting area
  - Grid lines and professional styling
  - Responsive sizing

#### `DraggableMarker.js` (integrated)
- **Zweck**: Verschiebbare Marker auf Charts
- **Status**: ✅ INTEGRATED into LineChart.js

#### `ChartControls.js` (future)
- **Zweck**: Chart Kontroll-Buttons
- **Status**: 📋 PLANNED - zoom, pan, reset controls

### Dashboard Components (integrated)

#### `Dashboard.js` (integrated)
- **Zweck**: Main Dashboard Layout
- **Status**: ✅ INTEGRATED into App.js

#### `GraphGrid.js` (future)
- **Zweck**: Grid Layout für mehrere Charts
- **Status**: 📋 PLANNED - for multi-chart comparison view

#### `GraphCard.js` (future)
- **Zweck**: Container für einzelnen Graph
- **Status**: 📋 PLANNED

### Export Components (`src/components/export/`)

#### `ResultsTable.js` ✅ COMPLETED
- **Zweck**: Results Display mit Status Tracking
- **Inhalt**: Sortierbare Tabelle mit Approval Status, Color-coded indicators
- **Features**:
  - Status column with color-coded ticks:
    - ✅ Green: Approved + auto-detected
    - ✅ Orange: Approved + manually adjusted
    - ⏳ Gray: Pending review
  - Row highlighting based on status
  - Click-to-select functionality
  - Responsive table design

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

### `src/services/dataValidator.js` (integrated)
- **Zweck**: Daten-Validation
- **Status**: ✅ INTEGRATED into csvProcessor.js

### `src/services/slopeDetection.js` ✅ COMPLETED
- **Zweck**: Slope Detection & Analysis
- **Inhalt**: Automatic positive slope detection, Fallback system, Live recalculation
- **Features**: 
  - Automatic first positive slope detection
  - Fallback markers (10% - 90% of data range)
  - Linear regression analysis (R² calculation)
  - Live velocity recalculation
  - Detection method tracking (automatic/fallback/manual)

### `src/services/chartDataProcessor.js` (integrated)
- **Zweck**: Daten für Charts vorbereiten
- **Status**: ✅ INTEGRATED into LineChart.js

### `src/services/voltageMapper.js` ✅ COMPLETED
- **Zweck**: Voltage Assignment & Export
- **Inhalt**: Velocity-to-voltage mapping (1-24V), CSV export, Data validation
- **Features**: 
  - Automatic sorting by velocity
  - 1-24V assignment (fastest = highest)
  - CSV export functionality
  - Result validation
  - Statistics calculation

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

### ✅ Phase 3: D3.js Charts & Interaction
- `ChartContainer.js`, `LineChart.js` - COMPLETED
- Interactive vertical drag markers - COMPLETED
- Responsive sizing - COMPLETED
- Drag-on-release behavior - COMPLETED

### ✅ Phase 4: Slope Detection & Analysis
- `slopeDetection.js` - COMPLETED
- Automatic detection + fallback - COMPLETED
- Live recalculation - COMPLETED

### ✅ Phase 5: Approval Workflow System
- `ApprovalButton.js`, enhanced `ResultsTable.js` - COMPLETED
- Auto-navigation - COMPLETED
- Status tracking - COMPLETED
- Auto-unapproval on changes - COMPLETED

### ✅ Phase 6: Voltage Mapping & Basic Export
- `voltageMapper.js` - COMPLETED
- 1-24V automatic assignment - COMPLETED
- CSV export - COMPLETED

---

## 🎯 NEXT PHASE: Advanced Export Features

### Planned Export Enhancements:
1. **PDF Export**: Professional reports with embedded charts
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
- Complete user workflow from upload to approval
- Interactive chart analysis with professional UX
- Approval system with status tracking
- Basic export functionality

**🎯 READY FOR:** Advanced export features and report generation

**📊 Code Quality:** Clean, modular architecture ready for expansion