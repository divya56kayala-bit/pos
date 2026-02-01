const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;
let printProcess;

const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    console.log(`[Electron] Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    if (isDev) {
        // mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => (mainWindow = null));
}

function startServices() {
    // 1. Backend Server
    const serverPath = path.join(__dirname, '../backend/server.js');
    console.log(`[Electron] Starting backend from: ${serverPath}`);

    const env = {
        ...process.env,
        PORT: 5000,
        USE_MONGO: 'false',
        NODE_ENV: isDev ? 'development' : 'production'
    };

    serverProcess = fork(serverPath, [], {
        cwd: path.join(__dirname, '../backend'),
        env: env,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.on('message', (msg) => {
        console.log('[Backend]', msg);
    });

    if (serverProcess.stdout) {
        serverProcess.stdout.on('data', (data) => console.log(`[Backend Output] ${data}`));
    }
    if (serverProcess.stderr) {
        serverProcess.stderr.on('data', (data) => console.error(`[Backend Error] ${data}`));
    }

    // 2. Print Agent
    const printAgentPath = path.join(__dirname, '../print-agent.js');
    console.log(`[Electron] Starting Print Agent from: ${printAgentPath}`);
    printProcess = fork(printAgentPath, [], {
        stdio: 'inherit',
        env: { ...process.env, PORT: 9101 }
    });
}

app.on('ready', () => {
    startServices();
    setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        console.log('[Electron] Killing backend process...');
        serverProcess.kill();
    }
    if (printProcess) {
        console.log('[Electron] Killing print agent...');
        printProcess.kill();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
