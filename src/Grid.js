import React from 'react'
import { sumWidth, isPositionValid, extractPosition } from './utils'
import PropTypes from 'prop-types'
import ScrollSyncHelper from './ScrollSyncHelper'
import R from 'ramda'
import ScrollPane from './ScrollPane'

import {
  ROW_INDEX_ATTRIBUTE,
  COLUMN_INDEX_ATTRIBUTE,
  SCROLL_SYNC_CONTEXT,
} from './constants.js'

const rowHeightOf = (index, rowHeight) =>
  typeof rowHeight === 'function' ? rowHeight(index) : rowHeight

const empty = {}

const normalizeBounds = selection => {
  const { x1, y1, x2, y2 } = selection
  if (R.isNil(x1) && R.isNil(x2) && R.isNil(y1) && R.isNil(y2)) return empty

  const xMin = !R.isNil(x2) ? Math.min(x1, x2) : x1
  const xMax = !R.isNil(x2) ? Math.max(x1, x2) : x1
  const yMin = !R.isNil(y2) ? Math.min(y1, y2) : y1
  const yMax = !R.isNil(y2) ? Math.max(y1, y2) : y1
  return { x1: xMin, x2: xMax, y1: yMin, y2: yMax }
}
const isCellSelected = (rowIndex, columnIndex, selection) => {
  const { x1, x2, y1, y2 } = normalizeBounds(selection)
  return (
    rowIndex <= y2 && rowIndex >= y1 && columnIndex <= x2 && columnIndex >= x1
  )
}

const isRowSelected = (rowIndex, selection) => {
  const { y1, y2 } = normalizeBounds(selection)
  const { selectionType } = this.props
  return selectionType === 'cell' && rowIndex <= y2 && rowIndex >= y1
}

class Grid extends React.PureComponent {

  /* compond components */
  static SyncedScrollPane = ScrollPane

  static propTypes = {
    render: PropTypes.func.isRequired,
    data: PropTypes.array.isRequired,
    headers: PropTypes.object.isRequired,
    selectionType: PropTypes.oneOf(['row', 'cell']),
    hoverType: PropTypes.oneOf(['row', 'cell']),
    sortOptions: PropTypes.object,
    onSort: PropTypes.func,
  }

  static defaultProps = {
    selectionType: 'cell',
    hoverType: 'row',
  }

  static childContextTypes = {
    [SCROLL_SYNC_CONTEXT]: PropTypes.object.isRequired,
  }
  getChildContext() {
    return {
      [SCROLL_SYNC_CONTEXT]: this.scrollSync,
    }
  }

  scrollSync = new ScrollSyncHelper()

  state = {
    hoveredRow: undefined,
    hoveredColumn: undefined,
    x1: undefined,
    x2: undefined,
    y1: undefined,
    y2: undefined,
    view: this.props.data,
  }

  bodyMouseRelease = e => {
    /* 
    * this will only work with one grid on screen 
    * may need to figureout another solution
    * isPositionValid only cares if data-row-index data-column-index is there
    * */
    if (this.selecting && !isPositionValid(extractPosition(e))) {
      this.selecting = false
    }
  }

  componentDidMount() {
    window.document.body.addEventListener('mouseup', this.bodyMouseRelease)
    window.document.body.addEventListener('mouseleave', this.bodyMouseRelease)
  }
  componentWillUnmount() {
    window.document.body.removeEventListener(
      'mouseleave',
      this.bodyMouseRelease
    )
    window.document.body.removeEventListener('mouseup', this.bodyMouseRelease)
  }


  isSortControlled() {
    const { sortOptions, onSort } = this.props
    return !R.isNil(sortOptions) && !R.isNil(onSort)
  }

  getColumnHeaderProps = ({ key, index, header }) => ({
    key: key || header.ident,
    header,
    width: header.width,
  })

  /*  selection starts */
  startSelectionState(rowIndex, columnIndex) {
    this.selecting = true
    return { x1: columnIndex, y1: rowIndex, x2: columnIndex, y2: rowIndex }
  }

  expandSelectionState(rowIndex, columnIndex, ended) {
    if (this.selecting) {
      this.selecting = ended ? false : this.selecting
      return { y2: rowIndex, x2: columnIndex }
    }
  }
  /* selection ends */

  /* hover starts */
  hoverState(rowIndex, columnIndex) {
    const { hoverType } = this.props
    return hoverType === 'cell'
      ? { hoveredRow: rowIndex, hoveredColumn: columnIndex }
      : { hoveredRow: rowIndex }
  }
  /* hover ends */

  cellMouseDown = e => {
    const pos = extractPosition(e)
    const { rowIndex, columnIndex } = pos
    if (e.button === 2 && isCellSelected(rowIndex, columnIndex, this.state))
      return
    this.setState(_ => this.startSelectionState(rowIndex, columnIndex))
  }

  cellMouseUp = e => {
    const pos = extractPosition(e)
    const { rowIndex, columnIndex } = pos
    this.setState(_ => this.expandSelectionState(rowIndex, columnIndex, true))
  }

  cellMouseEnter = e => {
    const pos = extractPosition(e)
    const { rowIndex, columnIndex } = pos
    this.setState(_ => ({
      ...this.hoverState(rowIndex, columnIndex),
      ...this.expandSelectionState(rowIndex, columnIndex),
    }))
  }
  cellMouseLeave = e => {
    this.setState(_ => ({ ...this.hoverState() }))
  }

  /** prop getters */

  getRowProps = ({
    key,
    index,
    isHeader = false,
    headers,
    width,
    rowHeight,
    headerRowHeight,
  }) => ({
    key: key || index,
    width: width === undefined || width === null ? sumWidth(headers) : width,
    height: isHeader ? headerRowHeight : rowHeightOf(index, rowHeight),
    colCount: headers.length,
    isHeader,
  })

  getCellProps = ({
    key,
    rowIndex,
    columnIndex,
    header,
    data,
    rowData,
    rowHeight,
    ...rest
  }) => {
    const { selectionType, hoverType } = this.props
    return {
      'data-row-index': rowIndex,
      key: key || rowIndex + '*' + header.ident,
      'data-column-index': columnIndex,
      header,
      onMouseDown: this.cellMouseDown,
      onMouseEnter: this.cellMouseEnter,
      onMouseUp: this.cellMouseUp,
      onMouseLeave: this.cellMouseLeave,
      isSelected:
        selectionType === 'cell'
          ? isCellSelected(rowIndex, columnIndex, this.state)
          : isRowSelected(rowIndex, this.state),
      isHovered:
        hoverType === 'cell'
          ? this.state.hoveredRow === rowIndex &&
            this.state.hoveredColumn === columnIndex
          : this.state.hoveredRow === rowIndex,
      data,
      rowIndex,
      columnIndex,
      height: rowHeightOf(rowIndex, rowHeight),
      width: header.width,
      alignment: header.alignment,
    }
  }

  getGridContainerProps = () => ({})

  render() {
    return this.props.render({
      getColumnHeaderProps: this.getColumnHeaderProps,
      getRowProps: this.getRowProps,
      getCellProps: this.getCellProps,
      getContainerProps: this.getGridContainerProps,
      headers: this.props.headers,
      data: this.state.view,
    })
  }
}
Grid.ROW_INDEX_ATTRIBUTE = ROW_INDEX_ATTRIBUTE
Grid.COLUMN_INDEX_ATTRIBUTE = COLUMN_INDEX_ATTRIBUTE
export default Grid
