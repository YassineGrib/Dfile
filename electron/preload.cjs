const { contextBridge, ipcRenderer } = require('electron');

// Secure context bridge exposing safe desktop environment info if needed by frontend
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  biometric: {
    check: () => ipcRenderer.invoke('biometric:check'),
    verify: (message) => ipcRenderer.invoke('biometric:verify', String(message || ''))
  }
});
