// 安全地暴露有限 API 给渲染进程

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  analyzeImages: (folder, form) => ipcRenderer.invoke('analyze-images', form),
  exportResults: (data) => ipcRenderer.invoke('export-results', data),
  onScanProgress: (callback) => {
    ipcRenderer.on('scan-progress', (event, data) => callback(data))
  },
  removeScanProgressListener: () => {
    ipcRenderer.removeAllListeners('scan-progress')
  }
})