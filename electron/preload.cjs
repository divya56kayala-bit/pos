const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Add IPC methods here if needed
    checkHealth: () => ipcRenderer.invoke('check-health'),
});
