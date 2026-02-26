const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    ping: () => ipcRenderer.invoke('ping'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
    getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
    checkOllama: () => ipcRenderer.invoke('check-ollama'),
    getOllamaModels: () => ipcRenderer.invoke('get-ollama-models'),
    generateBlueprint: (args) => ipcRenderer.invoke('generate-blueprint', args),
    generateDryRun: (blueprint) => ipcRenderer.invoke('generate-dry-run', blueprint),
    executeBlueprint: (args) => ipcRenderer.invoke('execute-blueprint', args),
    rollbackTransaction: (txId) => ipcRenderer.invoke('rollback-transaction', txId),
});
