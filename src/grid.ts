import * as paper from 'paper'

export interface Tile {
  rectangle: paper.Rectangle
  gridPosition: paper.Point
}

export interface Grid {
  tiles: Array<Array<Tile>>
  rows: number,
  cols: number
}

export interface GridParams {
  corner: paper.Point,
  size: paper.Size,
  cols: number
}

export const createGrid = ({corner, size, cols}: GridParams): Grid => {
  const colSize = size.width / cols
  const rows = cols

  const tileSize = new paper.Size(
    colSize,
    colSize
  )

  const tiles: Array<Array<Tile>> = []

  for(let col = 0; col < cols; col++) {
    tiles.push([])

    for(let row = 0; row < rows; row++) {
      const tilePoint = corner.add([col * colSize, row * colSize])
      tiles[col].push({
        rectangle: new paper.Rectangle(tilePoint, tileSize),
        gridPosition: new paper.Point(col, row)
      })
    }
  }

  return { tiles, rows, cols }
}