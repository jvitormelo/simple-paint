export type ToolType =
  | 'select'
  | 'pencil'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'

export interface Point {
  x: number
  y: number
}

export interface Style {
  strokeColor: string
  fillColor: string
  strokeWidth: number
}

export interface BaseObject {
  id: string
  type: ToolType | 'image' | 'freehand'
  x: number
  y: number
  style: Style
}

export interface RectangleObject extends BaseObject {
  type: 'rectangle'
  width: number
  height: number
}

export interface EllipseObject extends BaseObject {
  type: 'ellipse'
  width: number
  height: number
}

export interface LineObject extends BaseObject {
  type: 'line'
  endX: number
  endY: number
}

export interface ArrowObject extends BaseObject {
  type: 'arrow'
  endX: number
  endY: number
}

export interface FreehandObject extends BaseObject {
  type: 'freehand'
  points: Point[]
}

export interface TextObject extends BaseObject {
  type: 'text'
  text: string
  fontSize: number
}

export interface ImageObject extends BaseObject {
  type: 'image'
  width: number
  height: number
  imageData: string
}

export type CanvasObject =
  | RectangleObject
  | EllipseObject
  | LineObject
  | ArrowObject
  | FreehandObject
  | TextObject
  | ImageObject

export interface PaintState {
  objects: CanvasObject[]
  selectedIds: string[]
  activeTool: ToolType
  style: Style
  history: CanvasObject[][]
  future: CanvasObject[][]
}

export type HandlePosition =
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se'
