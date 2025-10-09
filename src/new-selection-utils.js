import { extractData } from './utils'
import R from 'ramda'

export const isCellSelected = (rowIndex, columnIndex, selection) => {
  const { bitMaskMap } = selection

  const rowBitMask = bitMaskMap[rowIndex]
  if (!rowBitMask) return false

  return (rowBitMask & (BigInt(1) << BigInt(columnIndex))) !== BigInt(0)
}

export const isRowSelected = (rowIndex, selection) => {
  const { bitMaskMap } = selection

  const rowBitMask = bitMaskMap[rowIndex]

  return !!rowBitMask
}

export const unselectRectangle = (bitMaskMap, x1, y1, x2, y2) => {
  const newMap = { ...(bitMaskMap || {}) }

  const xMin = Math.min(x1, x2)
  const xMax = Math.max(x1, x2)
  const yMin = Math.min(y1, y2)
  const yMax = Math.max(y1, y2)

  // mask of consecutive bits for the range xMin..xMax
  const width = xMax - xMin + 1
  const colMask = ((BigInt(1) << BigInt(width)) - BigInt(1)) << BigInt(xMin)

  for (let r = yMin; r <= yMax; r++) {
    if (newMap[r] !== undefined) {
      const updated = newMap[r] & ~colMask // clear the bits
      if (updated === BigInt(0)) {
        delete newMap[r] // remove row entry if empty
      } else {
        newMap[r] = updated
      }
    }
  }

  return newMap
}

export const selectRectangle = (bitMaskMap, x1, y1, x2, y2) => {
  const newMap = { ...(bitMaskMap || {}) }

  const xMin = Math.min(x1, x2)
  const xMax = Math.max(x1, x2)
  const yMin = Math.min(y1, y2)
  const yMax = Math.max(y1, y2)

  // mask of consecutive bits for the range xMin..xMax
  const width = xMax - xMin + 1
  const colMask = ((BigInt(1) << BigInt(width)) - BigInt(1)) << BigInt(xMin)

  for (let r = yMin; r <= yMax; r++) {
    newMap[r] = (newMap[r] || BigInt(0)) | colMask // OR bits to select
  }

  return newMap
}

export const toggleSelection = (
  rowIndex,
  columnIndex,
  isShift,
  isCtrl,
  selection,
  isRowSelection
) => {
  const { bitMaskMap, previousRectangleSelection } = selection

  let newBitMaskMap = { ...(bitMaskMap || {}) }

  const { x1, y1, x2, y2 } = previousRectangleSelection || {}

  if (isShift && x1 !== undefined && y1 !== undefined) {
    newBitMaskMap = { ...(unselectRectangle(newBitMaskMap, x1, y1, x2, y2) || {}) }
    newBitMaskMap = { ...(selectRectangle(newBitMaskMap, x1, y1, columnIndex, rowIndex) || {}) }
    return {
      ...selection,
      bitMaskMap: newBitMaskMap,
      previousRectangleSelection: { x1, y1, x2: columnIndex, y2: rowIndex },
    }
  } else if (isCtrl) {
    const rowMask = newBitMaskMap[rowIndex] || BigInt(0)
    const updated = rowMask ^ (BigInt(1) << BigInt(columnIndex)) // toggle
    if (isRowSelection) {
      if (rowMask === BigInt(0)) {
        newBitMaskMap[rowIndex] = updated
      } else {
        delete newBitMaskMap[rowIndex]
      }
    } else {
      if (updated === BigInt(0)) {
        delete newBitMaskMap[rowIndex]
      } else {
        newBitMaskMap[rowIndex] = updated
      }
    }
    return {
      ...selection,
      bitMaskMap: newBitMaskMap,
      previousRectangleSelection: { x1: columnIndex, y1: rowIndex, x2: columnIndex, y2: rowIndex },
    }
  } else {
    newBitMaskMap = {}
    newBitMaskMap[rowIndex] = BigInt(1) << BigInt(columnIndex)
    return {
      ...selection,
      bitMaskMap: newBitMaskMap,
      previousRectangleSelection: { x1: columnIndex, y1: rowIndex, x2: columnIndex, y2: rowIndex },
    }
  }
}

export const left = (selection, isShift, isCtrl) => {
  const { previousRectangleSelection } = selection
  let { x2, y2 } = previousRectangleSelection || {}

  if (x2 === undefined || y2 === undefined) {
    return selection // no previous selection to base on
  }

  return toggleSelection(y2, Math.max(x2 - 1, 0), isShift, isCtrl, selection)
}

export const right = (selection, isShift, isCtrl, colCount) => {
  const { previousRectangleSelection } = selection
  let { x2, y2 } = previousRectangleSelection || {}
  if (x2 === undefined || y2 === undefined) {
    return selection // no previous selection to base on
  }

  return toggleSelection(y2, Math.min(x2 + 1, colCount - 1), isShift, isCtrl, selection)
}

export const up = (selection, isShift, isCtrl) => {
  const { previousRectangleSelection } = selection
  let { x2, y2 } = previousRectangleSelection || {}

  if (x2 === undefined || y2 === undefined) {
    return selection // no previous selection to base on
  }

  return toggleSelection(Math.max(y2 - 1, 0), x2, isShift, isCtrl, selection)
}

export const down = (selection, isShift, isCtrl, rowCount) => {
  const { previousRectangleSelection } = selection
  let { x2, y2 } = previousRectangleSelection || {}

  if (x2 === undefined || y2 === undefined) {
    return selection // no previous selection to base on
  }

  return toggleSelection(Math.min(y2 + 1, rowCount - 1), x2, isShift, isCtrl, selection)
}

export const selectAll = (colCount, rowCount) => {
  const fullMask = (BigInt(1) << BigInt(colCount)) - BigInt(1)
  const result = {}
  for (let r = 0; r < rowCount; r++) {
    result[r] = fullMask
  }
  return {
    bitMaskMap: result,
    previousRectangleSelection: { x1: 0, y1: 0, x2: colCount - 1, y2: rowCount - 1 },
  }
}

export const selectRange = (bitMaskMap, x1, y1, x2, y2) => {
  const result = { ...bitMaskMap }

  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  // Precompute the mask for selected columns in this range
  let colMask = BigInt(0)
  for (let col = minX; col <= maxX; col++) {
    colMask |= BigInt(1) << BigInt(col)
  }

  // Apply to all rows in range
  for (let row = minY; row <= maxY; row++) {
    const existing = result[row] || BigInt(0)
    result[row] = existing | colMask
  }

  return result
}

export const selector = { left, right, up, down, selectAll }

export const getGlobalColumnRange = bitMaskMap => {
  let globalMin = null
  let globalMax = null

  for (const mask of Object.values(bitMaskMap)) {
    if (mask === BigInt(0)) continue

    const binary = mask
      .toString(2)
      .split('')
      .reverse()
      .join('')

    const rowMin = binary.indexOf('1')
    const rowMax = binary.lastIndexOf('1')

    if (rowMin !== -1) {
      const minCol = rowMin
      const maxCol = rowMax

      if (globalMin === null || minCol < globalMin) {
        globalMin = minCol
      }
      if (globalMax === null || maxCol > globalMax) {
        globalMax = maxCol
      }
    }
  }

  if (globalMin === null || globalMax === null) return { minCol: undefined, maxCol: undefined }

  return { minCol: globalMin, maxCol: globalMax }
}

export const getSelectedData = ({ data, headers }, selection, selectionType) => {
  const { bitMaskMap } = selection
  if (!bitMaskMap || Object.keys(bitMaskMap).length === 0) return []

  const { minCol, maxCol } = getGlobalColumnRange(bitMaskMap)

  if (minCol === undefined || maxCol === undefined) return []

  const rowKeys = Object.keys(bitMaskMap).map(r => Number(r))

  const rows = R.range(Math.min(...rowKeys), Math.max(...rowKeys) + 1)
  const cols = selectionType === 'cell' ? R.range(minCol, maxCol + 1) : R.range(0, headers.length)

  const getData = rowIdx => colIndex => {
    if (
      selectionType === 'cell'
        ? !isCellSelected(rowIdx, colIndex, selection)
        : !isRowSelected(rowIdx, selection)
    )
      return ''
    return extractData({ rowData: data[rowIdx], header: headers[colIndex] })
  }

  const returnData = rows.map(rowIdx => cols.map(getData(rowIdx)))

  return returnData
}
