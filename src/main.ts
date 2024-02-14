import * as paper from 'paper'
import { Postal } from 'paper-postal'
import * as Patron from './patron'
import * as Walker from './walker'
import palettes from './palettes'

const draw = (canvasSize: paper.Size)  => {
  // This adjust is necessary to consider the frame stroke
  const adjustedSize = canvasSize.subtract([4.0, 4.0])
  const adjustedCorner = new paper.Point(canvasSize.multiply(-0.5)).add(2.0)

  Patron.randomConcentricGrid({
    gridParams: {
      corner: adjustedCorner,
      size: adjustedSize,
      cols: 5
    },
    concentricParams: {
      strokeWidth: 0.0,
      staggerColor: true,
      staggerColors: palettes.uvanana,
      strokeColor: undefined,
      fillColor: '#efffd4'
    }
  })

  return { }
}
 
const postal = Postal.create(paper, draw, () => {}, { showFrame: false, showSettings: true, backgroundColor: '#efffd4'})

document.addEventListener('keyup', () => {
  Postal.capture(postal, Postal.CaptureFormat.SVG)
})