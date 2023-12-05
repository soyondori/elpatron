import * as paper from 'paper'
import { Postal } from 'paper-postal'
import * as Patron from './patron'
import palettes from './palettes'

const draw = (canvasSize: paper.Size)  => {
  // This adjust is necessary to consider the frame stroke
  const adjustedSize = canvasSize.subtract([4.0, 4.0])
  const adjustedCorner = new paper.Point(canvasSize.multiply(-0.5)).add(2.0)

  Patron.walkerConcentricGrid({
    gridParams: {
      corner: adjustedCorner,
      size: adjustedSize,
      clipMask: true, 
      cols: 10
    },
    concentricParams: {
      strokeWidth: 6.0,
      staggerColor: true,
      staggerColors: palettes.chain,
      strokeColor: '#fff',
      fillColor: '#fdc9c9'
    }
  })

  return { }
}
 
const postal = Postal.create(paper, draw, () => {}, { showFrame: false, showSettings: true, backgroundColor: '#FFF3DA'})

document.addEventListener('keyup', () => {
  Postal.capture(postal, Postal.CaptureFormat.JPG)
})