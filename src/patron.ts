import * as paper from 'paper'
import * as math from 'mathjs'
import { Grid, Tile, createGrid } from './grid'
import { map } from './utils'

export interface ConcentricParams {
  point: paper.Point,
  count: number,
  minRadius: number,
  maxRadius: number,
  strokeWidth: number
  strokeColor?: string
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
  strokeColor?: string
  fillColor?: string,
  staggerColor: boolean,
  staggerColors: Array<string>
}

export interface ConcentricStyleParams {
  strokeWidth: number
  strokeColor?: string
  fillColor: string,
  staggerColor?: boolean,
  staggerColors?: Array<string>
}

export interface GridPatternParams {
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

  const grid = createGrid({corner: settings.corner, size: settings.size, cols: settings.cols})

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
