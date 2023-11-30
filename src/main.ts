import * as paper from 'paper'
import { Postal } from 'paper-postal'
import * as Patron from './patron'
import * as math from 'mathjs'
import palettes from './palettes'

const draw = (canvasSize: paper.Size)  => {
  // This adjust is necessary to consider the frame stroke
  const adjustedSize = canvasSize.subtract([4.0, 4.0])
  const adjustedCorner = new paper.Point(canvasSize.multiply(-0.5)).add(2.0)

  Patron.gridPattern({corner: adjustedCorner, size: adjustedSize, clipMask: true, cols: 6 }, (tile) => {
    const randomPoint = math.pickRandom([tile.center, tile.bottomLeft, tile.bottomRight, tile.topLeft, tile.topRight])
    const maxRadius = randomPoint.subtract(tile.center).length === 0.0 ? tile.width : new paper.Point(tile.size).length
    const count = Math.floor(randomPoint.subtract(tile.center).length === 0.0 ? 10.0 : (maxRadius / (tile.width * 0.1)))

    return Patron.concentric({
      point: randomPoint,
      count: count,
      minRadius: maxRadius * 0.1,
      maxRadius: maxRadius,
      strokeWidth: 6.0,
      staggerColor: true,
      staggerColors: palettes.pastelini,
      strokeColor: '#fff',
      fillColor: '#fdc9c9'
    })
  })

  return { }
}
 
const postal = Postal.create(paper, draw, () => {}, { showFrame: false, showSettings: true, backgroundColor: '#FFF3DA'})

document.addEventListener('keyup', () => {
  Postal.capture(postal, Postal.CaptureFormat.JPG)
})