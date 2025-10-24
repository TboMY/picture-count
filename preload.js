// 安全地暴露有限 API 给渲染进程
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 示例：发送消息到主进程
  sendMessage: (message) => ipcRenderer.send('message', message),
  // 示例：监听主进程回复
  onMessage: (callback) => ipcRenderer.on('reply', (event, data) => callback(data))
})