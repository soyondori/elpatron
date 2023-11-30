import * as paper from 'paper'
import { createGrid } from './grid'
import { map } from './utils'

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

export const gridPattern = (gridParams: GridPatternParams, drawPattern: (tile: paper.Rectangle) => paper.Group) : Array<paper.Group> => {
  const defaultParams = {
    clipMask: true,
  }

  const settings: GridPatternSettings = {...defaultParams, ...gridParams}

  const tiles = createGrid(settings.corner, settings.size, settings.cols)
  return tiles.map((tile) => {
    const tileGroup = new paper.Group()
    const tileContainer = new paper.Shape.Rectangle(tile)
    const patternGroup = drawPattern(tile)
    tileContainer.clipMask = settings.clipMask

    tileGroup.addChild(tileContainer)
    tileGroup.addChild(patternGroup)
    return tileGroup

  })
}