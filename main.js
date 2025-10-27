const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')

const path = require('path')
const { batchSize, rate, columns } = require('./constant')
const { exportToExcel, getDateStringPadded } = require(
  './utils/utils')
const { analyze } = require('./services/analyzeService')
const { promises: fs } = require('fs')

function createWindow () {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 👇 启动后最大化（非全屏）
  win.maximize()

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  } else {
    win.loadURL('http://localhost:8080')
    // win.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  createWindow()

  // 👇 移除菜单栏
  Menu.setApplicationMenu(null)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 添加键盘快捷键支持
app.on('ready', () => {
  const { globalShortcut } = require('electron')

  // Alt+F4 退出应用
  globalShortcut.register('Alt+F4', () => {
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 应用退出时清理快捷键
app.on('will-quit', () => {
  const { globalShortcut } = require('electron')
  globalShortcut.unregisterAll()
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: [ 'openDirectory' ]
  })
  return result.canceled ? null : result.filePaths[0]
})

// 开始统计api
ipcMain.handle('analyze-images', analyze)

// 导出结果到Excel文件
ipcMain.handle('export-results', async ( event, tableData, prePath ) => {
  try {
    // 选择保存位置
    const result = await dialog.showSaveDialog({
      title: '导出结果位置选择',
      defaultPath: `JPG幅面统计表_${ getDateStringPadded() }.xlsx`,
      filters: [
        { name: 'Excel文件', extensions: [ 'xlsx' ] }
        // { name: 'CSV文件', extensions: ['csv'] },
        // { name: '所有文件', extensions: ['*'] }
      ]
    })

    if (result.canceled) {
      return { success: false, message: '用户取消导出', type: 'cancel' }
    }

    const filePath = result.filePath
    const fileExtension = path.extname(filePath).toLowerCase()

    const exportData = tableData.map(item => {
      return columns.map(column => {
        let value = item[column.key]
        if (column.key === 'folderPath' && value !== '合计') {
          value = prePath + value.slice(2)
        }
        // 确保 0 被保留为数字 0，而不是被忽略
        return value === undefined || value === null ? '' : value
      })
    })
    exportToExcel(tableData, columns, filePath, exportData)

    return { success: true, message: '导出成功', filePath: filePath }
  } catch (error) {
    console.error('导出失败:', error)
    return { success: false, message: `导出失败: ${ error.message }` }
  }
})






