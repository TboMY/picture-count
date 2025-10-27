/**
 * @Author: cj
 * @Date: 2025/10/25 21:48
 *
 */
const path = require('path')
const fs = require('fs').promises
const XLSX = require('xlsx')
const { thanZeroName } = require('../constant')

// 递归扫描文件夹，获取所有图片文件和空文件夹
async function scanFolderRecursively ( folderPath ) {
  const imageFiles = []
  const emptyFolders = []

  // todo 对于不支持的文件类型: pdf等,是否要记录
  // todo 如果文件夹和图片互相掺杂

  async function scanDirectory ( dirPath ) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })

      // 如果文件夹为空(非根路径)，记录为空文件夹
      if (items.length === 0 && dirPath !== folderPath) {
        const relativePath = path.relative(folderPath, dirPath)
        emptyFolders.push({
          folderPath: relativePath,
          fullPath: dirPath
        })
        return
      }

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name)

        if (item.isDirectory()) {
          // 递归扫描子文件夹
          await scanDirectory(fullPath)
        } else if (item.isFile()) {
          // 检查是否为图片文件
          if (/\.(jpe?g|png|bmp|tiff?)$/i.test(item.name)) {
            imageFiles.push({
              filePath: fullPath,
              relativePath: path.relative(folderPath, fullPath),
              filename: item.name
            })
          }
        }
      }
    } catch (error) {
      throw new Error('文件路径异常!')
    }
  }

  await scanDirectory(folderPath)

  return { imageFiles, emptyFolders }
}

// 转换为A4张数
function convertToA4Count ( { image, a4 } ) {
  const { paperType: type, physicalW, physicalH } = image
  if (type === thanZeroName) {
    const area = physicalW * physicalH
    const physicalStandard = a4.width * a4.height
    return Math.ceil(area / physicalStandard)
  }
  const map = { A0: 16, A1: 8, A2: 4, A3: 2, A4: 1 }
  return map[type]
}

/**
 * 导出 Excel 文件
 * @param {Array} rawData - 原始数据数组（用于自动处理）
 * @param {Array} columns - 列配置 [{ header: '表头', key: '数据键', width: 20 }]
 * @param {string} outputPath - 输出路径
 * @param {Array} [exportData] - 可选：用户预处理好的数据（二维数组）
 */
function exportToExcel ( rawData, columns, outputPath, exportData ) {
  const ws = {}

  // 1. 设置表头行
  const headerRow = columns.map(c => c.header)
  XLSX.utils.sheet_add_aoa(ws, [ headerRow ], { origin: 'A1' })

  // 2. 填充数据行
  let dataRows
  if (exportData) {
    // 用户已提供预处理数据（二维数组）
    dataRows = exportData
  } else {
    // 自动从 rawData 生成数据行
    dataRows = rawData.map(item =>
      columns.map(column => {
        const value = item[column.key]
        return value === undefined || value === null ? '' : value
      })
    )
  }

  XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A2' })

  // 3. 设置列宽（仅当 columns 有 width 时）
  if (columns.some(col => col.width)) {
    ws['!cols'] = columns.map(column =>
      column.width ? { wpx: column.width } : { wpx: 100 }
    )
  }

  // 4. 创建工作簿并导出
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '图像统计')
  XLSX.writeFile(wb, outputPath)
}

// 当前时间的字符串格式
function getDateStringPadded ( gap = '-' ) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return year + gap + month + gap + day
}

module.exports = {
  scanFolderRecursively,
  convertToA4Count,
  exportToExcel,
  getDateStringPadded
}