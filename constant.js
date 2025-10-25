/**
 * @Author: cj
 * @Date: 2025/10/25 14:24
 *
 */

const columnFillColor = 'ffe699'
const columns = [
  {
    header: '序号',
    key: 'index',
    width: 40,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  },
  {
    header: '文件夹路径',
    key: 'folderPath',
    width: 240,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  },
  {
    header: '≤A4页',
    key: 'a4',
    width: 80,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  },
  {
    header: 'A3页',
    key: 'a3',
    width: 80,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  }, {
    header: 'A2页',
    key: 'a2',
    width: 80,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  }, {
    header: '≥A0页',
    key: 'a0',
    width: 80,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  },
  {
    header: '折算A4页',
    key: 'totalA4Equivalent',
    width: 80,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  },
  {
    header: '图像数量',
    key: 'totalImages',
    width: 80,
    style: { fill: { fgColor: { rgb: columnFillColor } } }
  }
]

module.exports = {
  rate: Math.sqrt(2),
  batchSize: 5,// 每批处理5个文件，适合低配置设备
  columns
}