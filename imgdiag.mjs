// Diagnose: what colors are in the corners/background of the logo?
import { readFileSync } from 'node:fs'
const PATH = 'C:/Users/meour/OneDrive/Pictures/OneDrive/Pictures/Documents/HTML_AGA/Week2/css/Assigmnet_HTML_AGA/inmage/rezekee-shop-horizontal.png'
export default async function run(page) {
  const buf = readFileSync(PATH)
  const dataUrl = `data:image/png;base64,${buf.toString('base64')}`
  return await page.evaluate(async (dataUrl) => {
    const img = new Image()
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl })
    const c = document.createElement('canvas')
    c.width = img.naturalWidth; c.height = img.naturalHeight
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, c.width, c.height)
    const px = d.data
    const sample = (x, y) => {
      const i = (y * c.width + x) * 4
      return `rgba(${px[i]},${px[i + 1]},${px[i + 2]},${px[i + 3]})`
    }
    // Histogram of light colors
    const counts = {}
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] > 180 && px[i + 1] > 180 && px[i + 2] > 180) {
        const key = `${px[i]},${px[i + 1]},${px[i + 2]}`
        counts[key] = (counts[key] || 0) + 1
      }
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    return {
      size: `${c.width}x${c.height}`,
      corners: [sample(2, 2), sample(c.width - 3, 2), sample(2, c.height - 3), sample(c.width - 3, c.height - 3), sample(Math.floor(c.width / 2), 2)],
      topLightColors: top.map(([k, n]) => `${k} x${n}`)
    }
  }, dataUrl)
}
