import type { CanvasObject, HandlePosition, Point } from './types'

const HANDLE_SIZE = 8

export function getBoundingBox(obj: CanvasObject): {
  x: number
  y: number
  width: number
  height: number
} {
  switch (obj.type) {
    case 'rectangle':
    case 'ellipse':
    case 'image':
      return { x: obj.x, y: obj.y, width: obj.width, height: obj.height }
    case 'line':
    case 'arrow':
      return {
        x: Math.min(obj.x, obj.endX),
        y: Math.min(obj.y, obj.endY),
        width: Math.abs(obj.endX - obj.x),
        height: Math.abs(obj.endY - obj.y),
      }
    case 'freehand': {
      const xs = obj.points.map((p) => p.x + obj.x)
      const ys = obj.points.map((p) => p.y + obj.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      return {
        x: minX,
        y: minY,
        width: Math.max(...xs) - minX,
        height: Math.max(...ys) - minY,
      }
    }
    case 'text':
      return { x: obj.x, y: obj.y - obj.fontSize, width: 100, height: obj.fontSize }
  }
}

export function pointInObject(point: Point, obj: CanvasObject): boolean {
  const box = getBoundingBox(obj)
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  )
}

export function findObjectAtPoint(
  point: Point,
  objects: CanvasObject[]
): CanvasObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    if (pointInObject(point, objects[i])) {
      return objects[i]
    }
  }
  return null
}

export function getHandlePositions(obj: CanvasObject): Map<HandlePosition, Point> {
  const box = getBoundingBox(obj)
  const handles = new Map<HandlePosition, Point>()
  const { x, y, width, height } = box

  handles.set('nw', { x, y })
  handles.set('n', { x: x + width / 2, y })
  handles.set('ne', { x: x + width, y })
  handles.set('w', { x, y: y + height / 2 })
  handles.set('e', { x: x + width, y: y + height / 2 })
  handles.set('sw', { x, y: y + height })
  handles.set('s', { x: x + width / 2, y: y + height })
  handles.set('se', { x: x + width, y: y + height })

  return handles
}

export function findHandleAtPoint(
  point: Point,
  obj: CanvasObject
): HandlePosition | null {
  const handles = getHandlePositions(obj)
  for (const [position, handlePoint] of handles) {
    const halfSize = HANDLE_SIZE / 2
    if (
      point.x >= handlePoint.x - halfSize &&
      point.x <= handlePoint.x + halfSize &&
      point.y >= handlePoint.y - halfSize &&
      point.y <= handlePoint.y + halfSize
    ) {
      return position
    }
  }
  return null
}

export function getResizeCursor(handle: HandlePosition): string {
  const cursors: Record<HandlePosition, string> = {
    nw: 'nwse-resize',
    n: 'ns-resize',
    ne: 'nesw-resize',
    w: 'ew-resize',
    e: 'ew-resize',
    sw: 'nesw-resize',
    s: 'ns-resize',
    se: 'nwse-resize',
  }
  return cursors[handle]
}
