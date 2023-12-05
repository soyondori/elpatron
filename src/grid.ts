import * as paper from 'paper'

export interface Tile {
  rectangle: paper.Rectangle
  col: number
  row: number
}

export interface Grid {
  tiles: Array<Array<Tile>>
}

export const createGrid = (corner: paper.Point, size: paper.Size, cols: number): Grid => {
  const colSize = size.width / cols
  const rows = cols

  const tileSize = new paper.Size(
    colSize,
    colSize
  )

  const tiles: Array<Array<Tile>> = []

  for(let row = 0; row < rows; row++) {
    tiles.push([])

    for(let col = 0; col < cols; col++) {
      const tilePoint = corner.add([col * colSize, row * colSize])
      tiles[row].push({
        rectangle: new paper.Rectangle(tilePoint, tileSize),
        row,
        col
      })
    }
  }

  return { tiles }
}