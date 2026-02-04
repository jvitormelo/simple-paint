import type { CanvasObject } from './types'
import { getBoundingBox, getHandlePositions } from './hit-testing'

const HANDLE_SIZE = 8
const imageCache = new Map<string, HTMLImageElement>()

function getImage(imageData: string): HTMLImageElement | null {
  if (imageCache.has(imageData)) {
    return imageCache.get(imageData)!
  }
  const img = new Image()
  img.src = imageData
  img.onload = () => imageCache.set(imageData, img)
  if (img.complete) {
    imageCache.set(imageData, img)
    return img
  }
  return null
}

export function renderObject(ctx: CanvasRenderingContext2D, obj: CanvasObject): void {
  ctx.save()
  ctx.strokeStyle = obj.style.strokeColor
  ctx.fillStyle = obj.style.fillColor
  ctx.lineWidth = obj.style.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (obj.type) {
    case 'rectangle':
      if (obj.style.fillColor !== 'transparent') {
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
      }
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
      break

    case 'ellipse':
      ctx.beginPath()
      ctx.ellipse(
        obj.x + obj.width / 2,
        obj.y + obj.height / 2,
        Math.abs(obj.width) / 2,
        Math.abs(obj.height) / 2,
        0,
        0,
        Math.PI * 2
      )
      if (obj.style.fillColor !== 'transparent') {
        ctx.fill()
      }
      ctx.stroke()
      break

    case 'line':
      ctx.beginPath()
      ctx.moveTo(obj.x, obj.y)
      ctx.lineTo(obj.endX, obj.endY)
      ctx.stroke()
      break

    case 'arrow': {
      ctx.beginPath()
      ctx.moveTo(obj.x, obj.y)
      ctx.lineTo(obj.endX, obj.endY)
      ctx.stroke()

      const angle = Math.atan2(obj.endY - obj.y, obj.endX - obj.x)
      const headLength = 15
      ctx.beginPath()
      ctx.moveTo(obj.endX, obj.endY)
      ctx.lineTo(
        obj.endX - headLength * Math.cos(angle - Math.PI / 6),
        obj.endY - headLength * Math.sin(angle - Math.PI / 6)
      )
      ctx.moveTo(obj.endX, obj.endY)
      ctx.lineTo(
        obj.endX - headLength * Math.cos(angle + Math.PI / 6),
        obj.endY - headLength * Math.sin(angle + Math.PI / 6)
      )
      ctx.stroke()
      break
    }

    case 'freehand':
      if (obj.points.length < 2) break
      ctx.beginPath()
      ctx.moveTo(obj.x + obj.points[0].x, obj.y + obj.points[0].y)
      for (let i = 1; i < obj.points.length; i++) {
        ctx.lineTo(obj.x + obj.points[i].x, obj.y + obj.points[i].y)
      }
      ctx.stroke()
      break

    case 'text':
      ctx.font = `${obj.fontSize}px sans-serif`
      ctx.fillStyle = obj.style.strokeColor
      ctx.fillText(obj.text, obj.x, obj.y)
      break

    case 'image': {
      const img = getImage(obj.imageData)
      if (img) {
        ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height)
      }
      break
    }
  }

  ctx.restore()
}

export function renderAllObjects(
  ctx: CanvasRenderingContext2D,
  objects: CanvasObject[]
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const obj of objects) {
    renderObject(ctx, obj)
  }
}

export function renderSelectionHandles(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject
): void {
  const box = getBoundingBox(obj)

  ctx.save()
  ctx.strokeStyle = '#0066ff'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(box.x, box.y, box.width, box.height)
  ctx.setLineDash([])

  const handles = getHandlePositions(obj)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#0066ff'
  ctx.lineWidth = 1

  for (const [, point] of handles) {
    ctx.fillRect(
      point.x - HANDLE_SIZE / 2,
      point.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    )
    ctx.strokeRect(
      point.x - HANDLE_SIZE / 2,
      point.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    )
  }

  ctx.restore()
}

export function renderActiveDrawing(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject | null
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (obj) {
    renderObject(ctx, obj)
  }
}

export function exportToPng(canvas: HTMLCanvasElement): void {
  const link = document.createElement('a')
  link.download = 'painting.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
