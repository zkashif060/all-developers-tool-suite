const { contextBridge, ipcRenderer } = require('electron');

// Expose safe system capabilities to Angular app
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  version: process.versions.electron
});

