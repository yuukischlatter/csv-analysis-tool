# CSV Analysis Tool - Dateistruktur & Beschreibungen

## Root Level

### `package.json`
- **Zweck**: NPM Konfiguration
- **Inhalt**: Dependencies (electron, react, d3, papaparse, etc.), Scripts (dev, build, dist), Metadaten

### `electron.js`
- **Zweck**: Main Electron Process
- **Inhalt**: App-Fenster erstellen, Menu-Bar, File-System Zugriff, IPC Communication mit React

### `build/electron-builder.config.js`
- **Zweck**: Electron Build Konfiguration
- **Inhalt**: Portable .exe Einstellungen, Icons, Dateipfade, Windows-spezifische Optionen

---

## Public Directory

### `public/index.html`
- **Zweck**: HTML Entry Point für React
- **Inhalt**: Basic HTML Structure, React Mount Point, Meta Tags

### `public/assets/`
- **Zweck**: Statische Assets
- **Inhalt**: Icons (.ico), Images, Logos (evtl. Schlatter Logo)

---

## Source Directory (src/)

### `src/index.js`
- **Zweck**: React Entry Point
- **Inhalt**: ReactDOM.render(), App Component Import, Basic Setup

### `src/App.js`
- **Zweck**: Main App Component
- **Inhalt**: Routing Logic, State Management, Layout Structure, Error Boundaries

---

## Components Directory

### Common Components (`src/components/common/`)

#### `Button.js`
- **Zweck**: Reusable Button Component
- **Inhalt**: Styled Button mit Props (variant, size, disabled, onClick), Schlatter Design System

#### `LoadingSpinner.js`
- **Zweck**: Loading Animation
- **Inhalt**: CSS Spinner Animation, Props für Größe/Farbe

#### `Modal.js`
- **Zweck**: Modal Dialog Component
- **Inhalt**: Overlay, Close Handler, Props für Titel/Content

### Upload Components (`src/components/upload/`)

#### `FileUpload.js`
- **Zweck**: Drag & Drop File Upload
- **Inhalt**: React-Dropzone Integration, File Validation, Multiple Files Support

#### `FileList.js`
- **Zweck**: Liste der hochgeladenen Files
- **Inhalt**: Dateiliste anzeigen, Remove-Button, File-Info (Name, Größe, Status)

#### `UploadProgress.js`
- **Zweck**: Upload Progress Anzeige
- **Inhalt**: Progress Bar, Status Messages, Error Handling

### Chart Components (`src/components/charts/`)

#### `ChartContainer.js`
- **Zweck**: React Wrapper für D3 Charts
- **Inhalt**: useRef Hook für D3 Mount, Props Handling, Resize Observer

#### `LineChart.js`
- **Zweck**: D3 Line Chart Implementation
- **Inhalt**: D3 Scales, Axes, Path Drawing, Zoom/Pan Behavior

#### `DraggableMarker.js`
- **Zweck**: Verschiebbare Marker auf Charts
- **Inhalt**: D3 Drag Behavior, Marker Rendering, Position Callbacks

#### `ChartControls.js`
- **Zweck**: Chart Kontroll-Buttons
- **Inhalt**: Zoom Reset, Pan Controls, Toggle Original/Filtered Data

### Dashboard Components (`src/components/dashboard/`)

#### `Dashboard.js`
- **Zweck**: Main Dashboard Layout
- **Inhalt**: State Management für alle Charts, Export Trigger, Layout Grid

#### `GraphGrid.js`
- **Zweck**: Grid Layout für mehrere Charts
- **Inhalt**: Responsive Grid, Chart Sizing, Scroll Handling

#### `GraphCard.js`
- **Zweck**: Container für einzelnen Graph
- **Inhalt**: Chart Title, Chart Component, Individual Controls

### Export Components (`src/components/export/`)

#### `ExportPanel.js`
- **Zweck**: Export Interface
- **Inhalt**: Export Button, Format Selection, Preview

#### `DataTable.js`
- **Zweck**: Tabelle mit Ergebnissen
- **Inhalt**: Sortierbare Tabelle, Steigungswerte, CSV-Namen

---

## Services Directory

### `src/services/csvProcessor.js`
- **Zweck**: CSV Parsing & Processing
- **Inhalt**: PapaParse Integration, Spalten-Erkennung (Spannung/Weg), Data Transformation

### `src/services/dataValidator.js`
- **Zweck**: Daten-Validation
- **Inhalt**: CSV Format Check, Numerical Data Validation, Missing Values Handling

### `src/services/kalmanFilter.js`
- **Zweck**: Kalman Filter Implementation
- **Inhalt**: Filter Library Integration, Parameter Configuration, Data Smoothing

### `src/services/slopeDetection.js`
- **Zweck**: Automatische Steigungserkennung
- **Inhalt**: Linear Regression, Sliding Window Algorithm, Slope Calculation

### `src/services/chartDataProcessor.js`
- **Zweck**: Daten für Charts vorbereiten
- **Inhalt**: Data Formatting für D3, Scaling, Axis Preparation

### `src/services/exportService.js`
- **Zweck**: Export Funktionalität
- **Inhalt**: Data to CSV/JSON, PDF Generation, File Download

---

## Utils Directory

### `src/utils/constants.js`
- **Zweck**: Projekt-Konstanten
- **Inhalt**: Spalten-Namen, Default Parameter, Error Messages, Chart Dimensions

### `src/utils/helpers.js`
- **Zweck**: Allgemeine Hilfsfunktionen
- **Inhalt**: Date Formatting, Number Formatting, Array Utilities

### `src/utils/fileHandler.js`
- **Zweck**: File System Utilities
- **Inhalt**: File Reading, Path Handling, File Type Detection

---

## Styles Directory

### `src/styles/variables.css`
- **Zweck**: Design System Variablen
- **Inhalt**: Schlatter-ähnliche Farben, Font Sizes, Spacing, Breakpoints

### `src/styles/global.css`
- **Zweck**: Globale Styles
- **Inhalt**: CSS Reset, Body Styles, Global Typography

### `src/styles/components.css`
- **Zweck**: Component-spezifische Styles
- **Inhalt**: Button Styles, Modal Styles, Form Elements

### `src/styles/charts.css`
- **Zweck**: Chart-spezifische Styles
- **Inhalt**: D3 Element Styling, Axis Styles, Marker Styles

### `src/styles/dashboard.css`
- **Zweck**: Dashboard Layout Styles
- **Inhalt**: Grid Layout, Card Styles, Responsive Design

---

## Hooks Directory

### `src/hooks/useFileUpload.js`
- **Zweck**: File Upload Logic Hook
- **Inhalt**: File State Management, Upload Handler, Error Handling

### `src/hooks/useChartData.js`
- **Zweck**: Chart Data Management Hook
- **Inhalt**: Data Processing State, Filter Application, Marker Positions

### `src/hooks/useExport.js`
- **Zweck**: Export Logic Hook
- **Inhalt**: Export State, Data Preparation, Download Handler

---

## Build Output

### `dist/`
- **Zweck**: Build Output Directory
- **Inhalt**: Compiled React App, Electron executables, Portable .exe

---

## Entwicklungsreihenfolge

1. **Grundgerüst**: `package.json`, `electron.js`, `App.js`, `index.js`
2. **CSV Upload**: `FileUpload.js`, `csvProcessor.js`, `dataValidator.js`
3. **D3 Basis**: `ChartContainer.js`, `LineChart.js`, `chartDataProcessor.js`
4. **Kalman Filter**: `kalmanFilter.js`, Integration in Charts
5. **Draggable Marker**: `DraggableMarker.js`, `slopeDetection.js`
6. **Dashboard**: `Dashboard.js`, `GraphGrid.js`, `GraphCard.js`
7. **Export**: `ExportPanel.js`, `exportService.js`, `DataTable.js`