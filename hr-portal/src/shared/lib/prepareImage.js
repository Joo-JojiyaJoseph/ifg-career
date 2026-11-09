/**
 * Shrinks a large photo in the browser before it is uploaded, so uploads stay well under the server's
 * limit (PHP allows 2 MB by default) and go up faster. Small images, SVGs and GIFs are left as they are.
 * Resolves to { file, note } where note describes any change, for example "Resized from 6.2 MB to 420 KB".
 */
const RASTER = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 1.5 * 1024 * 1024
const MAX_SIDE = 2400

export function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export async function prepareImage(file) {
  if (!file || !RASTER.includes(file.type) || typeof createImageBitmap !== 'function') return { file, note: null }

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { file, note: null }
  }

  const largest = Math.max(bitmap.width, bitmap.height)
  if (file.size <= MAX_BYTES && largest <= MAX_SIDE) {
    bitmap.close?.()
    return { file, note: null }
  }

  const scale = Math.min(1, MAX_SIDE / largest)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  // WebP keeps transparency (logos) and is small; browsers that cannot encode it fall back to JPEG.
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  const type = blob?.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
  const output = type === 'image/webp' ? blob : await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!output || output.size >= file.size) return { file, note: null }

  const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg')
  return {
    file: new File([output], name, { type, lastModified: Date.now() }),
    note: `Resized from ${formatBytes(file.size)} to ${formatBytes(output.size)} for a faster upload.`,
  }
}
