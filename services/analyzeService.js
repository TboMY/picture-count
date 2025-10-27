/**
 * @Author: cj
 * @Date: 2025/10/26 15:39
 *
 */

const { scanFolderRecursively, convertToA4Count } = require('../utils/utils')
const { batchSize, rate, thanZeroName, a4Standard } = require('../constant')
const { promises: fs } = require('fs')
const probe = require('probe-image-size')
const { sep } = require('path')
const { parse } = require('exifr')

const analyze = async ( event, form ) => {
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
          const { type, physicalW, physicalH } = classifyPaperWithCustomLengths(
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
            paperType: type,
            physicalW,
            physicalH
            // a4Count: convertToA4Count(paperType)
          }
        } catch (error) {
          throw error
        }
      })

      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      processedCount += batch.length

      // 发送进度更新
      // event.sender.send('scan-progress', {
      //   processed: processedCount,
      //   total: imageFiles.length
      // currentFile: batch[batch.length - 1].filename
      // })

      // 给主线程一些休息时间，避免阻塞UI
      // if (i + batchSize < imageFiles.length) {
      //   await new Promise(resolve => setTimeout(resolve, 10))
      // }
    }

    // 用户手动输入的标准的a4的物理长宽(mm)
    const a4 = { height: len.a4, width: Number((len.a4 / rate).toFixed(5)) }
    // 按子文件夹分组统计
    const folderStats = groupByFolder(results, emptyFolders, a4)

    return {
      success: true,
      data: folderStats,
      message: '操作成功'
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.message
    }
  }
}

/**
 * 异步读取图片信息（宽高 + DPI）
 */
async function getImageInfoAsync ( filePath, defaultDpi ) {
  try {
    const buffer = await fs.readFile(filePath)
    const size = probe.sync(buffer)
    const result = await parse(buffer, { jfif: true })
    let dpi = { x: defaultDpi, y: defaultDpi }
    if (result) {
      const { XResolution, YResolution } = result
      dpi = {
        x: XResolution || defaultDpi,
        y: YResolution || defaultDpi
      }
    }
    return {
      width: size.width,
      height: size.height,
      dpi
    }
  } catch (error) {
    // 统一处理：无论是 readFile 失败还是 probe 失败
    throw new Error(`解析图片 ${ filePath } 失败`)
  }
}

/**
 * 使用用户自定义纸张长度进行分类
 */
function classifyPaperWithCustomLengths (
  width, height, dpi, customLengths, tolerance ) {
  const { x, y } = dpi
  // 将像素转换为毫米
  const widthMM = Number(((width / x) * 25.4).toFixed(5))
  const heightMM = Number(((height / y) * 25.4).toFixed(5))

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
      return { type: paper.name, physicalW: widthMM, physicalH: heightMM }
    }
  }
  // 按照 >=a0处理
  return { type: thanZeroName, physicalW: widthMM, physicalH: heightMM }
}

/**
 * 按子文件夹分组统计
 */
function groupByFolder ( imageResults, emptyFolders, a4 ) {
  const folderMap = new Map()

  // 遍历所有图片结果，按文件夹分组
  imageResults.forEach(image => {
    // 获取子文件夹路径（相对于根目录）
    const pathParts = image.relativePath.split(sep)
    const folderPath = '..\\' +
      pathParts.slice(0, pathParts.length - 1).join('\\')

    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, getOneRowInitData(folderPath))
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
        folderStats[thanZeroName]++
    }

    // 累加A4等效数量
    // folderStats.totalA4Equivalent += convertToA4Count({ image, a4 })
    const n = convertToA4Count({ image, a4 })
    folderStats.totalA4Equivalent += n
  })

  // 添加空文件夹（没有图片文件的文件夹）
  emptyFolders.forEach(emptyFolder => {
    const folderPath = '..\\' + emptyFolder.folderPath
    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, getOneRowInitData(folderPath))
    }
  })

  // 转换为数组并排序
  const folderStatsArray = Array.from(folderMap.values()).
    sort(( a, b ) => a.folderPath.localeCompare(b.folderPath))

  // 计算总计
  const totals = getOneRowInitData('合计')

  // index方便导出Excel的时候
  let index = 1
  folderStatsArray.forEach(folder => {
    folder.index = index++
    totals.a4 += folder.a4
    totals.a3 += folder.a3
    totals.a2 += folder.a2
    totals.a1 += folder.a1
    totals.a0 += folder.a0
    totals[thanZeroName] += folder[thanZeroName]
    totals.totalA4Equivalent += folder.totalA4Equivalent
    totals.totalImages += folder.totalImages
  })
  totals.index = index

  // 合计行
  folderStatsArray.push(totals)

  return folderStatsArray
}

// 一行标准数据的初始状态
const getOneRowInitData = ( folder ) => ({
  folderPath: folder,
  a4: 0,
  a3: 0,
  a2: 0,
  a1: 0,
  a0: 0,
  [thanZeroName]: 0,
  totalA4Equivalent: 0,
  totalImages: 0
  // images: []
})

// 重复代码有点多,封装一下

module.exports = { analyze }