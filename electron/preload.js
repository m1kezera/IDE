const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close:    () => ipcRenderer.send('window-close'),
    selectFolder: () => ipcRenderer.invoke('dialog-select-folder'),
    selectImage:  () => ipcRenderer.invoke('dialog-select-image'),
    selectVideo:  () => ipcRenderer.invoke('dialog-select-video'),
    onShortcut: (callback) => ipcRenderer.on('shortcut', (_event, action) => callback(action)),
});
