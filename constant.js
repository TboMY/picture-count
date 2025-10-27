/**
 * @Author: cj
 * @Date: 2025/10/25 14:24
 *
 */
const thanZeroName = 'plus'

const columns = [
  {
    header: '序号',
    key: 'index',
    width: 40
  },
  {
    header: '文件夹路径',
    key: 'folderPath',
    width: 400
  },
  {
    header: 'A4页',
    key: 'a4',
    width: 80
  },
  {
    header: 'A3页',
    key: 'a3',
    width: 80
  }, {
    header: 'A2页',
    key: 'a2',
    width: 80
  },
  {
    header: 'A1页',
    key: 'a1',
    width: 80
  },
  {
    header: 'A0页',
    key: 'a0',
    width: 80
  },
  {
    header: '>A0页',
    key: thanZeroName,
    width: 80
  },
  {
    header: '折算A4页',
    key: 'totalA4Equivalent',
    width: 80
  },
  {
    header: '图像数量',
    key: 'totalImages',
    width: 80
  }
]

// XResolution
// YResolution

module.exports = {
  rate: Number(Math.sqrt(2).toFixed(5)),
  batchSize: 5,
  columns,
  thanZeroName,
  a4Standard: { width: 210, height: 297 }
}