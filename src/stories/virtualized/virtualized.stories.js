import React from 'react'
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

  // const cellData = extractAndFormatData({
  //   rowData: data[rowIndex],
  //   header: headers[columnIndex],
  // })

  // console.log('cell data is',cellData)
  // eslint-disable-next-line eqeqeq
  if (columnIndex == 1 && rowIndex == 1) {
    return (
      <VirtualizedCell {...R.omit(['data'], cellProps)}>
        {extractAndFormatData({
          rowData: data[rowIndex],
          header: headers[columnIndex],
        })}
        <div
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

const data = createData(80)
storiesOf('Virtualized grid', module)
  .add('Basic', () => <Grid data={data} headers={headers} render={virtualizedGridRenderer()} />)
  .add('Fixed Col and Free edit', () => (
    <GridToolContext.Provider value={{ columnHeaderProps: { backgroundColor: 'pink' } }}>
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
