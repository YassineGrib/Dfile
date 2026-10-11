const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const windowsHello = require('./windows-hello.cjs');

// Biometric unlock (Windows Hello) — the renderer only ever receives the result string
ipcMain.handle('biometric:check', () => windowsHello.checkAvailability());
ipcMain.handle('biometric:verify', async (_event, message) => {
  const result = await windowsHello.requestVerification(message);
  // The Hello prompt takes focus; bring the app back to the front afterwards
  if (mainWindow) mainWindow.focus();
  return result;
});

let mainWindow = null;

// Ensure single instance lock so multiple clicks don't spawn duplicate apps
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a0d14',
    show: false,
    autoHideMenuBar: true,
    title: 'Dfile - Management & Ledger',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      spellcheck: false
    }
  });

  // Reveal window smoothly and maximized when DOM is ready to eliminate any white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Intercept all external hyperlinks (http/https) and open in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Determine whether running in dev mode or packaged/production mode
  const isDev = !app.isPackaged && (process.env.ELECTRON_DEV === 'true' || process.env.NODE_ENV === 'development');

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
