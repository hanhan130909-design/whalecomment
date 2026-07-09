const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  start: (hostId) => ipcRenderer.invoke('start', hostId),
  stop: () => ipcRenderer.invoke('stop'),
  onLog: (cb) => ipcRenderer.on('log', (e, t) => cb(t)),
  onDone: (cb) => ipcRenderer.on('done', () => cb()),
});
