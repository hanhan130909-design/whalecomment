const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let win, worker;

// In production (asar), __dirname points INSIDE the asar archive.
// app.getAppPath() returns the real path to the app.
// For unpacked resources (app.asar.unpacked/), compute sibling path.
function getUnpackedWorkerPath() {
  var appPath = app.getAppPath();
  // appPath ends with 'app.asar' in production
  if (appPath.endsWith('.asar')) {
    // app.asar.unpacked is a sibling directory (not inside app.asar)
    var unpacked = appPath.replace(/\\app\.asar$/, '\\app.asar.unpacked');
    return path.join(unpacked, 'worker.js');
  }
  // Development: worker.js is in same dir as main.js
  return path.join(__dirname, 'worker.js');
}

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 600, height: 500,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile('index.html');
  win.setMenu(null);
});

ipcMain.handle('start', (e, hostId) => {
  if (worker) worker.kill();
  var args = hostId.split(' ');
  var workerPath = getUnpackedWorkerPath();
  win?.webContents.send('log', '[MAIN] Worker path: ' + workerPath + '\\n');
  worker = fork(workerPath, args, { silent: true });
  worker.stdout.on('data', d => win?.webContents.send('log', d.toString()));
  worker.stderr.on('data', d => win?.webContents.send('log', '[E] ' + d.toString()));
  worker.on('exit', () => { win?.webContents.send('done'); worker = null; });
  return true;
});

ipcMain.handle('stop', () => { if (worker) { worker.kill(); worker = null; } return true; });
