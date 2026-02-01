const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// Simple dev check
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    // Open DevTools if desired, or keep closed for cleaner look
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

function startServer() {
  const serverPath = path.join(__dirname, '../backend/server.js');
  serverProcess = fork(serverPath);

  serverProcess.on('message', (msg) => {
    console.log('Backend message:', msg);
  });
}

app.on('ready', () => {
  startServer();
  // Give backend a moment to start
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
