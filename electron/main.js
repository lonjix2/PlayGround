const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Lightbearer — City of Refuge',
    backgroundColor: '#070b16',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const dist = path.join(__dirname, '..', 'dist', 'index.html');
  win.loadFile(dist);
  // win.webContents.openDevTools(); // uncomment for debugging
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    const { BrowserWindow } = require('electron');
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
