import { Grid, GridParams, Tile, createGrid } from "./grid"
import { ConcentricStyleParams } from "./patron"
import * as paper from 'paper'
import * as math from 'mathjs'
import * as Patron from './patron'

enum Direction {
  Left,
  Up,
  Right,
  Down
}

enum ConcentricOrigin {
  TopLeft,
  TopRight,
  BottomRight,
  BottomLeft
}

interface ConcentricPattern {
  origin: ConcentricOrigin,
  directions: Array<Direction>,
}

const concentricPatterns: Array<ConcentricPattern> = [
  {
    origin: ConcentricOrigin.TopLeft,
    directions: [Direction.Left, Direction.Up],
  },
  {
    origin: ConcentricOrigin.TopRight,
    directions: [Direction.Right, Direction.Up],
  },
  {
    origin: ConcentricOrigin.BottomRight,
    directions: [Direction.Down, Direction.Right],
  },
  {
    origin: ConcentricOrigin.BottomLeft,
    directions: [Direction.Down, Direction.Left],
  },
]

interface ConcentricTile extends Tile {
  pattern?: ConcentricPattern
}

interface ConcentricGrid extends Grid {
  tiles: Array<Array<ConcentricTile>>
}

const createConcentricGrid = (gridParams: GridParams): ConcentricGrid => {
  const grid = createGrid(gridParams)
  const concentricTiles = grid.tiles.map(
    (column) => column.map(tile => ({
      ...tile,
      pattern: undefined
    }))
  )

  return {
    ...grid,
    tiles: concentricTiles
  }
}

export const gridConcentricWalker = ({gridParams, style} : {gridParams: GridParams, style: ConcentricStyleParams}) => {
  for(let col = 0; col <= gridParams.cols - 1; col++) {
    for(let row = 0; row <= gridParams.cols - 1; row ++) {
      if(col === 0 || row === 0 || col === gridParams.cols -1 || row === gridParams.cols - 1) {
        randomConcentricWalker({
          gridOrigin: new paper.Point(col, row),
          gridParams,
          style
        })
      }
    }
  }
}

const randomConcentricWalker = ({gridOrigin, gridParams, style}: {gridOrigin: paper.Point, gridParams: GridParams, style: ConcentricStyleParams}) => {
  const walkerGrid = createConcentricGrid(gridParams)

  let isClosed = false
  let position = gridOrigin
  let inDirection = getRandomInitialDirection(gridOrigin, walkerGrid)
  let outOptions = getOutDirections(position, walkerGrid, inDirection)
  let patternOptions = getPatternOptions(inDirection, outOptions)
  let pattern = math.pickRandom(patternOptions)

  while(!isClosed) {
    const outDirection = pattern.directions.filter((dir) => dir !== inDirection)[0]
    const tile = walkerGrid.tiles[position.x][position.y]
    const maxRadius = math.round(tile.rectangle.width)
    const count = 16

    const tileGroup = new paper.Group()
    const tileContainer = new paper.Shape.Rectangle({
      point: tile.rectangle.point,
      size: tile.rectangle.size
    })
    const patternGroup = Patron.concentric({
      ...style,
        point: getOriginCoordinates(pattern.origin, tile),
        count: count,
        minRadius: maxRadius / count,
        maxRadius: maxRadius,
    })

    tileContainer.clipMask = true
    tileGroup.addChild(tileContainer)
    tileGroup.addChild(patternGroup)

    position = moveGridPoint(position, outDirection)
    if(!isOnGrid(position, walkerGrid)) {
      isClosed = true
    } else {
      inDirection = invertDirection(outDirection)
      outOptions = getOutDirections(position, walkerGrid, inDirection)
      patternOptions = getPatternOptions(inDirection, outOptions)
      pattern = math.pickRandom(patternOptions)
      isClosed = pattern === undefined
    }
  }

}

const getRandomInitialDirection = (origin: paper.Point, grid: Grid) => {
  const adj = getAdjascentTiles(origin, grid)
  const options = []

  if (!adj.left)
    options.push(Direction.Left)
  if (!adj.up)
    options.push(Direction.Up)
  if (!adj.right)
    options.push(Direction.Right)
  if (!adj.down)
    options.push(Direction.Down)
  if(options.length === 0)
    options.push(Direction.Left, Direction.Up, Direction.Right, Direction.Down)
  
  return math.pickRandom(options)
}

const getAdjascentTiles = (origin: paper.Point, grid: Grid) => ({
  left: getLeftTile(origin, grid),
  up: getUpTile(origin, grid),
  right: getRightTile(origin, grid),
  down: getDownTile(origin, grid)
})

const getOutDirections = (point: paper.Point, grid: ConcentricGrid, inDirection: Direction) => {
  const adj = getAdjascentTiles(point, grid)
  const options = []

  if ((!adj.left || !(adj.left as ConcentricTile).pattern) && inDirection !== Direction.Left)
    options.push(Direction.Left)
  if ((!adj.up || !(adj.up as ConcentricTile).pattern) && inDirection !== Direction.Up)
    options.push(Direction.Up)
  if ((!adj.right || !(adj.right as ConcentricTile).pattern) && inDirection !== Direction.Right)
    options.push(Direction.Right)
  if ((!adj.down || !(adj.down as ConcentricTile).pattern) && inDirection !== Direction.Down)
    options.push(Direction.Down)

  return options
}

const getRightTile = (origin: paper.Point, grid: Grid): Tile | undefined => {
  return origin.x < grid.cols - 1 ? grid.tiles[origin.x + 1][origin.y] : undefined
}

const getLeftTile = (origin: paper.Point, grid: Grid): Tile | undefined => {
  return origin.x > 0 ? grid.tiles[origin.x - 1][origin.y] : undefined
}

const getUpTile = (origin: paper.Point, grid: Grid): Tile | undefined => {
  return origin.y > 0 ? grid.tiles[origin.x][origin.y - 1] : undefined
}

const getDownTile = (origin: paper.Point, grid: Grid): Tile | undefined => {
  return origin.y < grid.rows - 1 ? grid.tiles[origin.x][origin.y + 1] : undefined
}

const getPatternOptions = (inDirection: Direction, outDirections: Array<Direction>): Array<ConcentricPattern> => {
  return concentricPatterns.filter((pattern) => {
    const hasInDirection = pattern.directions.includes(inDirection)
    let hasOutDirection = false

    outDirections.forEach((outDirection) => {
      hasOutDirection = hasOutDirection || pattern.directions.includes(outDirection)
    })

    return hasInDirection && hasOutDirection
  })
}

const getOriginCoordinates = (origin: ConcentricOrigin, tile: ConcentricTile) => {
  switch(origin) {
    case ConcentricOrigin.TopLeft:
      return tile.rectangle.topLeft
    case ConcentricOrigin.TopRight:
      return tile.rectangle.topRight
    case ConcentricOrigin.BottomRight:
      return tile.rectangle.bottomRight
    case ConcentricOrigin.BottomLeft:
      return tile.rectangle.bottomLeft
  }
}

const moveGridPoint = (point: paper.Point, direction: Direction) => {
  switch(direction) {
    case Direction.Left:
      return point.subtract([1, 0])
    case Direction.Up:
      return point.subtract([0, 1])
    case Direction.Right:
      return point.add([1, 0])
    case Direction.Down:
      return point.add([0, 1])
  }
}

const isOnGrid = (point: paper.Point, grid: Grid) => {
  return point.x >= 0 && point.x <= grid.cols -1 && point.y >= 0 && point.y <= grid.rows - 1
}

const invertDirection = (direction: Direction) => {
  switch(direction) {
    case Direction.Left:
      return Direction.Right
    case Direction.Up:
      return Direction.Down
    case Direction.Right:
      return Direction.Left
    case Direction.Down:
      return Direction.Up
  }
}