import * as paper from 'paper'
import * as math from 'mathjs'
import { Grid, Tile, createGrid } from './grid'
import { map } from './utils'
import palettes from './palettes'

interface ConcentricParams {
  point: paper.Point,
  count: number,
  minRadius: number,
  maxRadius: number,
  strokeWidth: number
  strokeColor: string
  fillColor: string,
  staggerColor?: boolean,
  staggerColors?: Array<string>
}

interface ConcentricSettings {
  point: paper.Point,
  count: number,
  minRadius: number,
  maxRadius: number,
  strokeWidth: number
  strokeColor: string
  fillColor: string,
  staggerColor: boolean,
  staggerColors: Array<string>
}

interface ConcentricStyleParams {
  strokeWidth: number
  strokeColor: string
  fillColor: string,
  staggerColor?: boolean,
  staggerColors?: Array<string>
}

interface GridPatternParams {
  corner: paper.Point,
  size: paper.Size,
  cols: number,
  clipMask?: boolean
}

interface GridPatternSettings extends GridPatternParams {
  clipMask: boolean
}

export const concentric = (params: ConcentricParams) => {
  const defaultParams = {
    staggerColor: false,
    staggerColors: [],
  }
  const settings: ConcentricSettings = {...defaultParams, ...params}

  const group = new paper.Group()

  for (let i = settings.count; i >= 0 ; i--) {
    const r = map(i, 0, settings.count, settings.minRadius, settings.maxRadius)
    const staggerIndex = settings.staggerColor ? i % settings.staggerColors.length : 0.0
    const staggerColor = settings.staggerColors[staggerIndex]
    const fillColor = settings.staggerColor ? staggerColor : settings.fillColor

    const c = new paper.Shape.Circle({
      center: settings.point,
      radius: r,
      strokeColor: settings.strokeColor,
      fillColor,
      strokeWidth: settings.staggerColor ? 0.0 : settings.strokeWidth
    })

    group.addChild(c)
  }

  return group
}

export const gridPattern = (gridParams: GridPatternParams, drawPattern: (tile: Tile, grid: Grid) => paper.Group) : Array<Array<paper.Group>> => {
  const defaultParams = {
    clipMask: true,
  }

  const settings: GridPatternSettings = {...defaultParams, ...gridParams}

  const grid = createGrid(settings.corner, settings.size, settings.cols)

  return grid.tiles.map((row) => {
    return row.map((tile) => {
      const tileGroup = new paper.Group()
      const tileContainer = new paper.Shape.Rectangle(tile)
      const patternGroup = drawPattern(tile, grid)
      tileContainer.clipMask = settings.clipMask

      tileGroup.addChild(tileContainer)
      tileGroup.addChild(patternGroup)
      return tileGroup
    })
  })
}

export const randomConcentricGrid = ({gridParams, concentricParams}: {gridParams: GridPatternParams, concentricParams: ConcentricStyleParams}) => {
  gridPattern(gridParams, (tile) => {
    const randomPoint = math.pickRandom([tile.rectangle.center, tile.rectangle.bottomLeft, tile.rectangle.bottomRight, tile.rectangle.topLeft, tile.rectangle.topRight])
    const maxRadius = randomPoint.subtract(tile.rectangle.center).length === 0.0 ? tile.rectangle.width : new paper.Point(tile.rectangle.size).length
    const count = Math.floor(randomPoint.subtract(tile.rectangle.center).length === 0.0 ? 10.0 : (maxRadius / (tile.rectangle.width * 0.1)))

    return concentric({
      ...concentricParams,
      point: randomPoint,
      count: count,
      minRadius: maxRadius * 0.1,
      maxRadius: maxRadius,
    })
  })
}

export const chainConcentricGrid = ({gridParams, concentricParams}: {gridParams: GridPatternParams, concentricParams: ConcentricStyleParams}) => {
  const patterns: Array<Array<number>> = []

  for (let row = 0; row < gridParams.cols; row++) {
    patterns.push([])
  }


  for (let index = 0; index < 6; index++) {
    gridPattern(gridParams, (tile, grid) => {
      const maxRadius = tile.rectangle.width
      const count = 16
      const group = new paper.Group()

      getNextPoints(tile, grid, patterns).forEach(({point, direction}) => {
        const pattern = concentric({
          ...concentricParams,
          staggerColor: true,
          staggerColors: palettes.chainGreen,
          point,
          count: count,
          minRadius: maxRadius / count,
          maxRadius: maxRadius,
        })


        patterns[tile.row][tile.col] = direction
        group.addChild(pattern)
      })

      return group
    })
  }
}

const getNextPoints = (tile: Tile, grid: Grid, patterns: Array<Array<number>>) => {
  const points = [tile.rectangle.topLeft, tile.rectangle.bottomLeft, tile.rectangle.topRight, tile.rectangle.bottomRight]

  if (tile.col === 0 && tile.row === 0) {
    const direction = math.pickRandom([2, 3])
    return [{direction, point: points[direction]}]
  } else {
    const hasUpTile = tile.row > 0
    const hasLeftTile = tile.col > 0

    if (hasUpTile && hasLeftTile) {
      const upDirection = patterns[tile.row - 1][tile.col]
      const bottomDirection = getBottomDirection(upDirection)

      const leftDirection = patterns[tile.row][tile.col - 1]
      const rightDirection = getRightPatternDirection(leftDirection)
      const shouldClose = leftDirection === 3 && (upDirection === 0 || upDirection === 2)


      if (shouldClose) {
        return [{direction: 1, point: points[1]}]
      } else if (rightDirection === 0 && bottomDirection === 0) {
        return [{direction: bottomDirection, point: points[bottomDirection]}]
      } else {
        return [
          {direction: bottomDirection, point: points[bottomDirection]},
          {direction: rightDirection, point: points[rightDirection]}
        ]
      }

    } else if (hasLeftTile) {
      const leftDirection = patterns[tile.row][tile.col - 1]
      const direction = getRightPatternDirection(leftDirection)
      return [{direction, point: points[direction]}]

    } else if (hasUpTile) {
      const upDirection = patterns[tile.row - 1][tile.col]
      const bottomDirection = getBottomDirection(upDirection)
      return [{direction: bottomDirection, point: points[bottomDirection]}]
    }
  }
}

const getRightPatternDirection = (leftDirection: number) => {
  switch(leftDirection) {
    case 0:
      return 3
    case 1:
      return 3
    default:
      return math.pickRandom([0, 1])
  }
}

const getBottomDirection = (upDirection: number) => {
  switch(upDirection) {
    case 0:
      return 3
    case 2:
      return 3
    default:
      return math.pickRandom([0, 2])
  }
}

enum Direction {
  Left,
  Up,
  Right,
  Down
}

enum ConcentricCorner {
  TopLeft,
  TopRight,
  BottomRight,
  BottomLeft
}

export const walkerConcentricGrid = ({gridParams, concentricParams}: {gridParams: GridPatternParams, concentricParams: ConcentricStyleParams}) => {
  const cornerTiles: Array<Array<Array<number>>> = []

  for (let col = 0; col < gridParams.cols; col++) {
    const column = []
    for (let row = 0; row < gridParams.cols; row++) {
      column.push([])
    }
    cornerTiles.push(column)
  }

  for (let col = 0; col < gridParams.cols; col++) {
    for (let row = 0; row < gridParams.cols; row++) {

      const hasLimitedPatterns = cornerTiles[col][row].length >= 1
      const isTileToStartPath = true

      if (isTileToStartPath) {
        let isClosed = false
        let currentCoord = [col, row]
        let currentCorner
        let lowerLimit = [0, 0]
        let upperLimit = [gridParams.cols, gridParams.cols]

        if (row === 0) {
          currentCorner = math.pickRandom([ConcentricCorner.TopLeft, ConcentricCorner.TopRight])
        } else if (col === 0) {
          currentCorner = math.pickRandom([ConcentricCorner.TopLeft, ConcentricCorner.BottomLeft])
        } else if (col === gridParams.cols - 1) {
          currentCorner = math.pickRandom([ConcentricCorner.TopRight, ConcentricCorner.BottomRight])
        } else if (row === gridParams.cols - 1) {
          currentCorner = math.pickRandom([ConcentricCorner.BottomLeft, ConcentricCorner.BottomRight])
        } else {
          currentCorner = math.pickRandom([ConcentricCorner.BottomLeft, ConcentricCorner.BottomRight, ConcentricCorner.TopLeft, ConcentricCorner.TopRight])
        }

        cornerTiles[col][row].push(currentCorner)

        while(!isClosed) {
          const step = getNextStep(currentCorner, currentCoord, lowerLimit, upperLimit)
          console.log('Step', step, 'Lower Limit', lowerLimit)
          if (step) {
            cornerTiles[step.nextCoord[0]][step.nextCoord[1]].push(step.nextCorner)
            currentCoord = step.nextCoord
            currentCorner = step.nextCorner

            switch(step.direction) {
              case Direction.Down:
                lowerLimit = [lowerLimit[0], lowerLimit[1] + 1]
                break
              case Direction.Up:
                upperLimit = [upperLimit[0], upperLimit[1] - 1]
                break
              case Direction.Right:
                lowerLimit = [lowerLimit[0] + 1, lowerLimit[1]]
                break
              case Direction.Left:
                upperLimit = [upperLimit[0] - 1, upperLimit[1]]
                break
            }

          } else {
            isClosed = true
          }
        }
      }
    }
  }

  gridPattern(gridParams, (tile, grid) => {
    const maxRadius = tile.rectangle.width
    const count = 16
    const group = new paper.Group()
    const corners = cornerTiles[tile.col][tile.row]
    corners.forEach((corner) => {
      let point

      switch(corner) {
        case ConcentricCorner.TopLeft:
          point = tile.rectangle.topLeft
          break
        case ConcentricCorner.TopRight:
          point = tile.rectangle.topRight
          break
        case ConcentricCorner.BottomRight:
          point = tile.rectangle.bottomRight
          break
        default:
          point = tile.rectangle.bottomLeft
          break
      }

      const pattern = concentric({
        ...concentricParams,
        point,
        count: count,
        minRadius: maxRadius / count,
        maxRadius: maxRadius,
      })

      group.addChild(pattern)
    })

    return group
  })

}

const getNextStep = (corner: ConcentricCorner, coord: Array<number>, lowerLimit: Array<number>, upperLimit: Array<number>) => {
  const directions = []

  switch(corner) {
    case ConcentricCorner.TopLeft:
      if (coord[0] !== lowerLimit[0])
        directions.push(Direction.Left)
      if (coord[1] !== lowerLimit[1])
        directions.push(Direction.Up)
      break

    case ConcentricCorner.TopRight:
      if (coord[0] < upperLimit[0])
        directions.push(Direction.Right)
      if (coord[1] !== lowerLimit[1] )
        directions.push(Direction.Up)
      break

    case ConcentricCorner.BottomRight:
      if (coord[0] < upperLimit[0])
        directions.push(Direction.Right)
      if (coord[1] < upperLimit[1])
        directions.push(Direction.Down)
      break

    case ConcentricCorner.BottomLeft:
      if (coord[0] !== lowerLimit[0])
        directions.push(Direction.Left)
      if (coord[1] < upperLimit[1])
        directions.push(Direction.Down)
  }

  if (directions.length > 0) {
    const nextDirection = math.pickRandom(directions)
    const step = getStep(nextDirection, coord, lowerLimit, upperLimit)
    return step
  } else {
    return undefined
  }
}

const getStep = (direction: Direction, coord: Array<number>, lowerLimit: Array<number>, upperLimit: Array<number>) => {
  let nextCorner
  switch(direction) {
    case Direction.Left:

      if (coord[1] - 1 <= lowerLimit[1])
        nextCorner = ConcentricCorner.BottomRight
      else 
        nextCorner = math.pickRandom([ConcentricCorner.BottomRight, ConcentricCorner.TopRight])


      return {
        direction,
        nextCorner,
        nextCoord: [coord[0] - 1, coord[1]]
      }
    case Direction.Up:
      return {
        direction,
        nextCorner: math.pickRandom([ConcentricCorner.BottomLeft, ConcentricCorner.BottomRight]),
        nextCoord: [coord[0], coord[1] - 1]
      }
    case Direction.Right:
      return {
        direction,
        nextCorner: math.pickRandom([ConcentricCorner.BottomLeft, ConcentricCorner.TopLeft]),
        nextCoord: [coord[0] + 1, coord[1]]
      }
    case Direction.Down:
      if (coord[0] - 1 <= lowerLimit[0] - 1)
        nextCorner = ConcentricCorner.TopRight
      else 
        nextCorner = math.pickRandom([ConcentricCorner.TopLeft, ConcentricCorner.TopRight])

      return {
        direction,
        nextCorner,
        nextCoord: [coord[0], coord[1] + 1]
      }
  }
}