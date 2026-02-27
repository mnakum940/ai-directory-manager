import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#f8fafc',
        }
    });

    // Depending on the environment, load the dev server or the local file
    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Example IPC handler for the frontend
ipcMain.handle('ping', () => 'pong');

// Scanner
import { scanDirectory } from './scanner.js';
ipcMain.handle('scan-directory', async (event, dirPath) => {
    return await scanDirectory(dirPath);
});

// System Monitor
import { systemMonitor } from './systemMonitor.js';
ipcMain.handle('get-system-metrics', async () => {
    return await systemMonitor.getMetrics();
});

// Ollama
import { ollamaClient } from './ollama.js';
import { SYSTEM_PROMPT } from './prompts.js';
ipcMain.handle('check-ollama', async () => await ollamaClient.checkStatus());
ipcMain.handle('get-ollama-models', async () => await ollamaClient.getModels());
ipcMain.handle('generate-blueprint', async (event, { structure, model, feedback }) => {
    return await ollamaClient.generateBlueprint(structure, SYSTEM_PROMPT, model || 'llama3', feedback);
});

// Execution and Rollback
import { RollbackManager } from './rollback.js';
import { ExecutionEngine } from './execution.js';

let rollbackManager;
let executionEngine;

app.whenReady().then(() => {
    const dbPath = path.join(app.getPath('userData'), 'transactions.db');
    rollbackManager = new RollbackManager(dbPath);
    executionEngine = new ExecutionEngine(rollbackManager);
});

ipcMain.handle('generate-dry-run', async (event, blueprint) => {
    return await executionEngine.generateDryRun(blueprint);
});

ipcMain.handle('execute-blueprint', async (event, { blueprint, transactionId }) => {
    return await executionEngine.executeBlueprint(blueprint, transactionId);
});

ipcMain.handle('rollback-transaction', async (event, transactionId) => {
    return await rollbackManager.rollback(transactionId);
});

// Dialog (to pick folder)
import { dialog } from 'electron';
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.filePaths[0] || null;
});
