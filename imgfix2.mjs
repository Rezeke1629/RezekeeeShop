// Make light neutral (former checkerboard) pixels TRANSPARENT in brand logos.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'C:/Users/meour/OneDrive/Pictures/OneDrive/Pictures/Documents/HTML_AGA/Week2/css/Assigmnet_HTML_AGA/inmage'
const FILES = [
  'kisspng-logo-acer-iconia-one-1-b3-a4-font-ivpro-sistemas-multimedia-1713923641585.webp',
  'hd-asus-official-logo-transparent-png-701751694773683zhb9eu5zq3.png',
  'images.jpg',
  'msi-logo-png-svg.webp',
  'HP-logo-technology-brand-emblem-transparent-png-jpg.webp',
  'lenovo-logo-png-svg.webp',
  'apple-logo-transparent.png'
]
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }

export default async function run(page) {
  const results = []
  for (const file of FILES) {
    const path = join(DIR, file)
    const mime = MIME[file.slice(file.lastIndexOf('.')).toLowerCase()]
    const dataUrl = `data:${mime};base64,${readFileSync(path).toString('base64')}`
    const out = await page.evaluate(async ({ dataUrl, mime }) => {
      const img = new Image()
      await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('load')); img.src = dataUrl })
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, c.width, c.height)
      const px = d.data
      let cleared = 0
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2]
        const min = Math.min(r, g, b), max = Math.max(r, g, b)
        if (min >= 200 && (max - min) <= 14) {
          px[i + 3] = 0; cleared++
        } else if (min >= 180 && (max - min) <= 14) {
          px[i + 3] = Math.round(255 * (200 - min) / 20); cleared++
        }
      }
      ctx.putImageData(d, 0, 0)
      return { url: c.toDataURL('image/png'), cleared, total: px.length / 4 }
    }, { dataUrl, mime })
    const pngPath = path.replace(/\.(webp|jpe?g)$/i, '.png')
    writeFileSync(pngPath, Buffer.from(out.url.slice(out.url.indexOf(',') + 1), 'base64'))
    results.push(`${file} → ${pngPath.split('/').pop()}: ${Math.round(100 * out.cleared / out.total)}% cleared`)
  }
  return results
}
