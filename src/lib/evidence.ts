const MAX_INPUT_BYTES = 10 * 1024 * 1024
const MAX_OUTPUT_BYTES = 1.5 * 1024 * 1024
const MAX_FILES = 4
const MAX_EDGE = 1600

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not compress this image.')), 'image/jpeg', quality)
  })
}

export async function compressEvidence(files: FileList | File[]): Promise<File[]> {
  const selected = Array.from(files)
  if (selected.length > MAX_FILES) throw new Error('You can attach up to 4 images.')
  const result: File[] = []
  for (const file of selected) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Evidence must be a JPG, PNG, or WebP image. Videos and other files are not supported yet.')
    }
    if (file.size > MAX_INPUT_BYTES) throw new Error(`${file.name} is too large. Each original image must be under 10 MB.`)
    let bitmap: ImageBitmap
    try { bitmap = await createImageBitmap(file) }
    catch { throw new Error(`Could not open ${file.name}. Try a different image.`) }
    try {
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Your browser could not prepare the image.')
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      let blob = await canvasBlob(canvas, 0.82)
      if (blob.size > MAX_OUTPUT_BYTES) blob = await canvasBlob(canvas, 0.65)
      if (blob.size > MAX_OUTPUT_BYTES) throw new Error(`${file.name} is still too large after compression.`)
      result.push(new File([blob], 'evidence.jpg', { type: 'image/jpeg', lastModified: Date.now() }))
    } finally { bitmap.close() }
  }
  return result
}
