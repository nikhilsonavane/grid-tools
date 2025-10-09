import React, { useRef, useState } from 'react'
import { storiesOf } from '@storybook/react'
import R from 'ramda'
import Grid, {
  extractAndFormatData,
  virtualizedGridRenderer,
  GridToolContext,
  defaultVirtualizedCellRender,
  VirtualizedCell,
} from '../../index'
import { createData, headers } from '../data'
import { CellInputEditor } from '../../Components'

const customizedCellRender = params => {
  const { gridToolProps, reactVirtualizedProps, ...rest } = params

  const { getCellProps, headers, data } = gridToolProps

  const { columnIndex, rowIndex, style } = reactVirtualizedProps
  const cellProps = getCellProps({
    rowIndex: rowIndex,
    columnIndex,
    header: headers[columnIndex],
    data,
    style,
    ...rest,
  })

  const cellData = extractAndFormatData({
    rowData: data[rowIndex],
    header: headers[columnIndex],
  })

  // console.log('cell data is',cellData)
  // eslint-disable-next-line eqeqeq
  if (columnIndex == 1 && rowIndex == 1) {
    return (
      <VirtualizedCell {...R.omit(['data'], cellProps)} title={cellData}>
        {cellData}
        <div
          title="purple marker"
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            width: '10px',
            height: '10px',
            backgroundColor: 'purple',
          }}
        />
      </VirtualizedCell>
    )
  }

  return defaultVirtualizedCellRender(params)
}

export const dateInputCellEditRender = ({ getInputProps }) => (
  <CellInputEditor type="date" {...getInputProps({ refKey: 'innerRef' })} />
)

const GridWithScrollTrigger = () => {
  const [rowNo, setRowNo] = useState()
  const gridRef = useRef()
  return (
    <div>
      <div style={{ margin: 10 }}>
        <input type="number" value={rowNo} onChange={e => setRowNo(e.target.value)} />
        <button
          onClick={() => {
            if (gridRef.current && rowNo) {
              gridRef.current.scrollToCell({ rowIndex: +rowNo })
            }
          }}
        >
          Scroll To
        </button>
      </div>
      <Grid
        data={data}
        headers={headers}
        render={virtualizedGridRenderer({
          cellRender: props => {
            const type = props.gridToolProps.headers[props.reactVirtualizedProps.columnIndex].type
            return defaultVirtualizedCellRender({
              ...props,
              editRender: (type === 'date-time' || type === 'date') && dateInputCellEditRender,
            })
          },
          contentGridRef: gridRef,
        })}
        editMode="cell"
        isEditable={() => true}
      />
    </div>
  )
}

const GridWithScrollSync = () => {
  const gridRef = useRef()
  const divRef = useRef()
  return (
    <div>
      <div
        ref={divRef}
        style={{ overflow: 'auto', width: 1100 }}
        onScroll={e => {
          const scrollLeft = e.target.scrollLeft
          if (scrollLeft && gridRef.current) {
            gridRef.current.scrollToPosition({ scrollLeft })
          }
        }}
      >
        <div
          style={{
            padding: 20,
            background: 'red',
            width: headers.map(h => h.width || 150).reduce((sum, val) => sum + val, 0),
          }}
        >
          Scroll Me!!!
        </div>
      </div>
      <Grid
        data={data}
        headers={headers}
        render={virtualizedGridRenderer({
          cellRender: props => {
            const type = props.gridToolProps.headers[props.reactVirtualizedProps.columnIndex].type
            return defaultVirtualizedCellRender({
              ...props,
              editRender: (type === 'date-time' || type === 'date') && dateInputCellEditRender,
            })
          },
          contentGridRef: gridRef,
          onScroll: ({ scrollLeft }) => {
            if (scrollLeft && divRef.current) {
              divRef.current.scrollTo({
                left: scrollLeft,
              })
            }
          },
        })}
        editMode="cell"
        isEditable={() => true}
      />
    </div>
  )
}

const data = createData(200)
storiesOf('Virtualized grid', module)
  .add('Basic', () => (
    <Grid
      data={data}
      headers={headers}
      render={virtualizedGridRenderer({
        cellRender: props => {
          const type = props.gridToolProps.headers[props.reactVirtualizedProps.columnIndex].type
          return defaultVirtualizedCellRender({
            ...props,
            editRender: (type === 'date-time' || type === 'date') && dateInputCellEditRender,
          })
        },
      })}
      editMode="cell"
      isEditable={() => true}
    />
  ))
  .add('Fixed Col and Free edit', () => (
    <GridToolContext.Provider
      value={{
        columnHeaderProps: {
          backgroundColor: 'pink',
          color: '#3F4752',
          border: '1px solid #ccc',
          fontSize: '14px',
          headerRowHeight: 30,
        },
        rowContentProps: {
          color: '#3F4752',
          border: '1px solid #ccc',
          // rowHeight: 30,
          fontSize: '14px',
        },
        fixedColData: {
          border: '1px solid #ccc',
          color: '#3F4752',
          rowHeight: 30,
          verticalAlign: 'baseline',
        },
      }}
    >
      <Grid
        isEditable={() => true}
        editMode="cell"
        data={data}
        headers={headers}
        altBgColor="#d7d7e7"
        altBy={data => data.unitId}
        render={virtualizedGridRenderer({
          autoFixColByKey: true,
          cellRender: customizedCellRender,
        })}
      />
    </GridToolContext.Provider>
  ))
  .add('Scroll Trigger', () => <GridWithScrollTrigger />)
  .add('Scroll Sync', () => <GridWithScrollSync />)
  .add('Custom Multi Selection', () => {
    const CustomSelectionStory = () => {
      const subGridRef = useRef()

      const [selectionType, setSelectionType] = useState('cell')

      const [isCtrl, setIsCtrl] = useState(true)

      return (
        <>
          <div>Selection Type:</div>
          <div
            style={{
              display: 'flex',
              width: 200,
              marginBottom: 10,
              textAlign: 'center',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          >
            <div
              style={{
                width: '50%',
                cursor: 'pointer',
                backgroundColor: selectionType === 'cell' ? 'lightblue' : 'transparent',
                padding: 4,
              }}
              onClick={() => setSelectionType('cell')}
            >
              Cell
            </div>
            <div
              style={{
                width: '50%',
                cursor: 'pointer',
                backgroundColor: selectionType === 'row' ? 'lightblue' : 'transparent',
                padding: 4,
              }}
              onClick={() => setSelectionType('row')}
            >
              Row
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="checkbox"
              id="isCtrl"
              name="isCtrl"
              value={!!isCtrl}
              checked={!!isCtrl}
              onChange={() => setIsCtrl(!isCtrl)}
            />
            <label htmlFor="isCtrl">Is Ctrl</label>
          </div>
          <div style={{ display: 'flex', gap: 30, marginBottom: 10 }}>
            <div
              style={{
                backgroundColor: 'lightblue',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                padding: 4,
                cursor: 'pointer',
              }}
              onClick={() => {
                subGridRef.current.setSelectedRect({ x1: 1, y1: 1, x2: 2, y2: 3, isCtrl: isCtrl })
              }}
            >
              {'{x1: 1, y1: 1, x2: 2, y2: 3}'}
            </div>
            <div
              style={{
                backgroundColor: 'lightblue',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                padding: 4,
                cursor: 'pointer',
              }}
              onClick={() => {
                subGridRef.current.setSelectedRect({ x1: 4, y1: 4, x2: 6, y2: 7, isCtrl: isCtrl })
              }}
            >
              {'{x1: 4, y1: 4, x2: 6, y2: 7}'}
            </div>
            <div
              style={{
                backgroundColor: 'lightblue',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                padding: 4,
                cursor: 'pointer',
              }}
              onClick={() => {
                subGridRef.current.setSelectedRect({ x1: 7, y1: 7, x2: 9, y2: 10, isCtrl: isCtrl })
              }}
            >
              {'{x1: 7, y1: 7, x2: 9, y2: 10}'}
            </div>
          </div>
          <Grid
            ref={subGridRef}
            isEditable={() => true}
            data={data}
            selectionType={selectionType || 'cell'}
            selectionMode={'multi'}
            editMode="cell"
            headers={headers}
            render={virtualizedGridRenderer({
              cellRender: props => {
                const type =
                  props.gridToolProps.headers[props.reactVirtualizedProps.columnIndex].type
                return defaultVirtualizedCellRender({
                  ...props,
                  editRender: (type === 'date-time' || type === 'date') && dateInputCellEditRender,
                })
              },
            })}
          />
        </>
      )
    }
    return <CustomSelectionStory />
  })
