/**
 * @Author: cj
 * @Date: 2025/10/25 21:48
 *
 */
const path = require('path')
const fs = require('fs').promises
const XLSX = require('xlsx')

// 递归扫描文件夹，获取所有图片文件和空文件夹
async function scanFolderRecursively ( folderPath ) {
  const imageFiles = []
  const emptyFolders = []

  async function scanDirectory ( dirPath ) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      
      // 如果文件夹为空，记录为空文件夹
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
      console.warn(`扫描目录失败 ${ dirPath }:`, error.message)

    }
  }

  await scanDirectory(folderPath)

  return { imageFiles, emptyFolders }
}

// 转换为A4张数
function convertToA4Count ( paperType ) {
  const map = { A0: 16, A1: 8, A2: 4, A3: 2, A4: 1, A5: 0.5, Unknown: 0 }
  return map[paperType] || 0
}


/**
 * 导出 Excel 文件（支持自定义表头、样式、列宽）
 * @param {Array} data - 数据数组
 * @param {Array} columns - 列配置 [{ header: '表头', key: '数据键', width: 20, style: { fill: { fgColor: { rgb: "FFD700" } } } }]
 * @param {string} outputPath - 输出路径
 */
function exportToExcel(data, columns, outputPath) {
  // 1. 创建工作表
  const ws = XLSX.utils.json_to_sheet([], { header: columns.map(c => c.key) })

  // 2. 设置表头行
  const headerRow = columns.map(c => c.header)
  XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: 'A1' })

  // 3. 填充数据行
  const dataRows = data.map(item =>
    columns.map(column => item[column.key] || '')
  )
  XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A2' })

  // 4. 设置列宽
  ws['!cols'] = columns.map(column => ({ wpx: column.width || 100 }))

  // 5. 设置表头样式（背景色、加粗）
  for (let i = 0; i < columns.length; i++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i })
    if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: headerRow[i] }

    // 设置样式（仅支持有限样式）
    ws[cellAddress].s = {
      fill: {
        fgColor: { rgb: columns[i].style?.fill?.fgColor?.rgb || "FFD700" } // 默认金色背景
      },
      font: {
        bold: true,
        color: { rgb: "000000" } // 黑色字体
      }
    }
  }

  // 6. 创建工作簿并写入文件
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '统计结果')
  XLSX.writeFile(wb, outputPath)
}

module.exports = {
  scanFolderRecursively,
  convertToA4Count,
  exportToExcel
}