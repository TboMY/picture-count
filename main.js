const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')

const path = require('path')
const fs = require('fs').promises
const probe = require('probe-image-size')
const { batchSize, rate, columns } = require('./constant')
const { scanFolderRecursively, convertToA4Count, exportToExcel } = require(
  './utils/utils')
const XLSX = require('xlsx')

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
    win.webContents.openDevTools()
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

// main.js（添加 IPC 处理）

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: [ 'openDirectory' ]
  })
  return result.canceled ? null : result.filePaths[0]
})

// 导出结果到Excel文件
ipcMain.handle('export-results', async ( event, tableData ) => {
  try {
    // 选择保存位置
    const result = await dialog.showSaveDialog({
      title: '导出统计结果',
      defaultPath: '图片统计结果.xlsx',
      filters: [
        { name: 'Excel文件', extensions: [ 'xlsx' ] }
        // { name: 'CSV文件', extensions: ['csv'] },
        // { name: '所有文件', extensions: ['*'] }
      ]
    })

    if (result.canceled) {
      return { success: false, message: '用户取消导出' }
    }

    const filePath = result.filePath
    const fileExtension = path.extname(filePath).toLowerCase()

    // if (fileExtension === '.xlsx') {
    //   await exportToExcel(tableData, filePath)
    // } else if (fileExtension === '.csv') {
    //   await exportToCSV(tableData, filePath)
    // } else {
    //   // 默认导出为Excel
    //   await exportToExcel(tableData, filePath + '.xlsx')
    // }

    exportToExcel(tableData, columns, filePath)

    return { success: true, message: '导出成功', filePath: filePath }
  } catch (error) {
    console.error('导出失败:', error)
    return { success: false, message: `导出失败: ${ error.message }` }
  }
})

ipcMain.handle('analyze-images', async ( event, form ) => {
  const { folderPath, defaultDpi, len, mistake } = form

  try {
    // 递归扫描所有图片文件和空文件夹
    const { imageFiles, emptyFolders } = await scanFolderRecursively(folderPath)

    const results = []
    let processedCount = 0

    // 批量处理图片文件，避免阻塞主线程
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize)

      // 并行处理当前批次
      const batchPromises = batch.map(async ( imageFile ) => {
        try {
          // 使用异步方式读取图片信息
          const info = await getImageInfoAsync(imageFile.filePath, defaultDpi)

          // 使用用户自定义的纸张长度进行分类
          const paperType = classifyPaperWithCustomLengths(
            info.width,
            info.height,
            info.dpi,
            len,
            mistake
          )

          return {
            filename: imageFile.filename,
            relativePath: imageFile.relativePath,
            width: info.width,
            height: info.height,
            dpi: info.dpi,
            paperType: paperType
            // a4Count: convertToA4Count(paperType)
          }

        } catch (error) {
          console.error(`读取文件失败 ${ imageFile.filename }:`, error.message)
          // 记录错误但继续处理其他文件
          return {
            filename: imageFile.filename,
            relativePath: imageFile.relativePath,
            width: -1,
            height: -1,
            dpi: defaultDpi,
            paperType: 'Error',
            a4Count: -1,
            error: error.message
          }
        }
      })

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      processedCount += batch.length

      // 发送进度更新
      event.sender.send('scan-progress', {
        processed: processedCount,
        total: imageFiles.length
        // currentFile: batch[batch.length - 1].filename
      })

      // 给主线程一些休息时间，避免阻塞UI
      // if (i + batchSize < imageFiles.length) {
      //   await new Promise(resolve => setTimeout(resolve, 10))
      // }
    }

    // 按子文件夹分组统计
    const folderStats = groupByFolder(results, emptyFolders, folderPath)

    return folderStats

  } catch (error) {
    console.error('扫描文件夹失败:', error)
    throw new Error(`扫描文件夹失败: ${ error.message }`)
  }
})

/**
 * 异步读取图片信息（宽高 + DPI）
 */
async function getImageInfoAsync ( filePath, defaultDpi ) {
  return new Promise(( resolve, reject ) => {
    // 使用异步方式读取文件，避免阻塞主线程
    fs.readFile(filePath).then(buffer => {
      try {
        // 读宽高
        const size = probe.sync(buffer)
        resolve({
          width: size.width,
          height: size.height,
          dpi: defaultDpi
        })
      } catch (error) {
        reject(new Error(`解析图片宽高失败: ${ error.message }`))
      }
    }).catch(error => {
      reject(new Error(`读取文件失败: ${ error.message }`))
    })
  })
}

/**
 * 使用用户自定义纸张长度进行分类
 */
function classifyPaperWithCustomLengths (
  width, height, dpi, customLengths, tolerance ) {
  // 将像素转换为毫米
  const widthMM = (width / dpi) * 25.4
  const heightMM = (height / dpi) * 25.4

  // 取宽高中的最大值，相当于将图片旋转到标准方向
  const maxLengthMM = Math.max(widthMM, heightMM)
  const minLengthMM = Math.min(widthMM, heightMM)

  // 允许的误差范围（毫米）
  const errorMM = tolerance || 1

  // 检查各种纸张尺寸，按长度从大到小排序
  const papers = [
    { name: 'A4', length: customLengths.a4, width: customLengths.a4 / rate },
    { name: 'A3', length: customLengths.a3, width: customLengths.a3 / rate },
    { name: 'A2', length: customLengths.a2, width: customLengths.a2 / rate },
    { name: 'A1', length: customLengths.a1, width: customLengths.a1 / rate },
    { name: 'A0', length: customLengths.a0, width: customLengths.a0 / rate }
  ]

  for (const paper of papers) {
    if (maxLengthMM <= paper.length + errorMM &&
      minLengthMM <= paper.width + errorMM) {
      return paper.name
    }
  }

  return 'Error'
}

/**
 * 按子文件夹分组统计
 */
function groupByFolder ( imageResults, emptyFolders ) {
  const folderMap = new Map()

  // 遍历所有图片结果，按文件夹分组
  imageResults.forEach(image => {
    // 获取子文件夹路径（相对于根目录）
    const pathParts = image.relativePath.split(path.sep)
    const folderPath = '..\\' +
      pathParts.slice(0, pathParts.length - 1).join('\\')

    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, {
        folderPath: folderPath,
        a4: 0,
        a3: 0,
        a2: 0,
        a1: 0,
        a0: 0,
        totalA4Equivalent: 0,
        totalImages: 0,
        images: []
      })
    }

    const folderStats = folderMap.get(folderPath)
    folderStats.totalImages++
    // folderStats.images.push(image)

    // 根据纸张类型分类统计
    switch (image.paperType) {
      case 'A4':
        folderStats.a4++
        break
      case 'A3':
        folderStats.a3++
        break
      case 'A2':
        folderStats.a2++
        break
      case 'A1':
        folderStats.a1++
        break
      case 'A0':
        folderStats.a0++
        break
      default:
      // 异常或错误
    }

    // 累加A4等效数量
    folderStats.totalA4Equivalent += convertToA4Count(image.paperType)
  })

  // 添加空文件夹（没有图片文件的文件夹）
  emptyFolders.forEach(emptyFolder => {
    const folderPath = '..\\' + emptyFolder.folderPath
    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, {
        folderPath: folderPath,
        a4: 0,
        a3: 0,
        a2: 0,
        a1: 0,
        a0: 0,
        totalA4Equivalent: 0,
        totalImages: 0,
        images: []
      })
    }
  })

  // 转换为数组并排序
  const folderStatsArray = Array.from(folderMap.values()).
    sort(( a, b ) => a.folderPath.localeCompare(b.folderPath))

  // 计算总计
  const totals = {
    folderPath: '合计',
    a4: 0,
    a3: 0,
    a2: 0,
    a1: 0,
    a0: 0,
    totalA4Equivalent: 0,
    totalImages: 0,
    images: []
  }

  let index = 1
  folderStatsArray.forEach(folder => {
    folder.index = index++
    totals.a4 += folder.a4
    totals.a3 += folder.a3
    totals.a2 += folder.a2
    totals.a1 += folder.a1
    totals.a0 += folder.a0
    totals.totalA4Equivalent += folder.totalA4Equivalent
    totals.totalImages += folder.totalImages
  })
  totals.index = index

  // 添加总计行
  folderStatsArray.push(totals)

  return folderStatsArray
}