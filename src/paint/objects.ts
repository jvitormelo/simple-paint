import type {
  ArrowObject,
  EllipseObject,
  FreehandObject,
  ImageObject,
  LineObject,
  Point,
  RectangleObject,
  Style,
  TextObject,
} from './types'
import { generateId } from './store'

export function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Style
): RectangleObject {
  return {
    id: generateId(),
    type: 'rectangle',
    x,
    y,
    width,
    height,
    style: { ...style },
  }
}

export function createEllipse(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Style
): EllipseObject {
  return {
    id: generateId(),
    type: 'ellipse',
    x,
    y,
    width,
    height,
    style: { ...style },
  }
}

export function createLine(
  x: number,
  y: number,
  endX: number,
  endY: number,
  style: Style
): LineObject {
  return {
    id: generateId(),
    type: 'line',
    x,
    y,
    endX,
    endY,
    style: { ...style },
  }
}

export function createArrow(
  x: number,
  y: number,
  endX: number,
  endY: number,
  style: Style
): ArrowObject {
  return {
    id: generateId(),
    type: 'arrow',
    x,
    y,
    endX,
    endY,
    style: { ...style },
  }
}

export function createFreehand(points: Point[], style: Style): FreehandObject {
  const minX = Math.min(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y))
  return {
    id: generateId(),
    type: 'freehand',
    x: minX,
    y: minY,
    points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
    style: { ...style },
  }
}

export function createText(
  x: number,
  y: number,
  text: string,
  style: Style,
  fontSize = 16
): TextObject {
  return {
    id: generateId(),
    type: 'text',
    x,
    y,
    text,
    fontSize,
    style: { ...style },
  }
}

export function createImage(
  x: number,
  y: number,
  width: number,
  height: number,
  imageData: string,
  style: Style
): ImageObject {
  return {
    id: generateId(),
    type: 'image',
    x,
    y,
    width,
    height,
    imageData,
    style: { ...style },
  }
}
