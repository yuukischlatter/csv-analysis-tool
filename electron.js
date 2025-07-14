const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: true
  });

  // HTML-Datei laden
  mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  
  // DevTools öffnen
  mainWindow.webContents.openDevTools();
  
  console.log('Window created');
}

app.whenReady().then(() => {
  console.log('App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
