/**
 * @Author: cj
 * @Date: 2025/10/25 05:03
 *
 */

export const thanZeroName = 'plus'

export const PAPER_LEN = {
  a4: 297,
  a3: 420,
  a2: 594,
  a1: 841,
  a0: 1189,
  [thanZeroName]:1500,
}

export const PAPER_OPTIONS = {
  precision: 2,
  min: 1,
  max: 10000,
  step: 10
}

// export const PAPER_STANDARD = {
//   a4: { width: 210, height: 297 },
//   a3: { width: 297, height: 420 },
//   a2: { width: 420, height: 594 },
//   a1: { width: 594, height: 841 },
//   a0: { width: 841, height: 1189 }
// }

export const DEFAULT_DPI = {
  value: 300,
  min: 50,
  max: 1200,
  step: 50,
  precision: 0
}

export const MISTAKE = {
  min: 10,
  max: 10000,
  step: 1,
  precision: 0
}

export const tableParams={
  numberWidth:60,
  pathWidth:120,
  indexWidth:60,
  totalA4Width:80,
  totalImagesWidth:80,
}