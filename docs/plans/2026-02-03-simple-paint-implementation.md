# Simple Paint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a simple MS Paint-like application with layer-based editing, supporting shapes, freehand drawing, text, and image paste with move/resize capabilities.

**Architecture:** Dual-canvas React app using TanStack Store for state management. Main canvas renders committed objects, overlay canvas handles active drawing and selection UI. Snapshot-based undo/redo system.

**Tech Stack:** React 19, TypeScript, TanStack Store, HTML Canvas 2D API, TailwindCSS, Vite

---

## Task 1: Create TypeScript Types

**Files:**
- Create: `src/paint/types.ts`

**Step 1: Create the types file with all interfaces**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/paint/types.ts
git commit -m "feat(paint): add TypeScript type definitions"
```

---

## Task 2: Create Paint Store

**Files:**
- Create: `src/paint/store.ts`

**Step 1: Create the store with initial state and actions**

```typescript
import { Store } from '@tanstack/store'
import type { CanvasObject, PaintState, Style, ToolType } from './types'

const MAX_HISTORY = 50

const initialStyle: Style = {
  strokeColor: '#000000',
  fillColor: 'transparent',
  strokeWidth: 2,
}

const initialState: PaintState = {
  objects: [],
  selectedIds: [],
  activeTool: 'select',
  style: initialStyle,
  history: [],
  future: [],
}

export const paintStore = new Store<PaintState>(initialState)

export function generateId(): string {
  return crypto.randomUUID()
}

function pushHistory(state: PaintState): PaintState {
  const history = [...state.history, state.objects].slice(-MAX_HISTORY)
  return { ...state, history, future: [] }
}

export function setTool(tool: ToolType): void {
  paintStore.setState((state) => ({ ...state, activeTool: tool }))
}

export function setStyle(style: Partial<Style>): void {
  paintStore.setState((state) => ({
    ...state,
    style: { ...state.style, ...style },
  }))
}

export function addObject(obj: CanvasObject): void {
  paintStore.setState((state) => {
    const newState = pushHistory(state)
    return { ...newState, objects: [...newState.objects, obj] }
  })
}

export function updateObject(id: string, updates: Partial<CanvasObject>): void {
  paintStore.setState((state) => ({
    ...state,
    objects: state.objects.map((obj) =>
      obj.id === id ? { ...obj, ...updates } : obj
    ),
  }))
}

export function commitObjectUpdate(): void {
  paintStore.setState((state) => pushHistory(state))
}

export function deleteSelected(): void {
  paintStore.setState((state) => {
    if (state.selectedIds.length === 0) return state
    const newState = pushHistory(state)
    return {
      ...newState,
      objects: newState.objects.filter((obj) => !state.selectedIds.includes(obj.id)),
      selectedIds: [],
    }
  })
}

export function setSelection(ids: string[]): void {
  paintStore.setState((state) => ({ ...state, selectedIds: ids }))
}

export function clearSelection(): void {
  paintStore.setState((state) => ({ ...state, selectedIds: [] }))
}

export function undo(): void {
  paintStore.setState((state) => {
    if (state.history.length === 0) return state
    const history = [...state.history]
    const previous = history.pop()!
    return {
      ...state,
      objects: previous,
      history,
      future: [state.objects, ...state.future],
      selectedIds: [],
    }
  })
}

export function redo(): void {
  paintStore.setState((state) => {
    if (state.future.length === 0) return state
    const future = [...state.future]
    const next = future.shift()!
    return {
      ...state,
      objects: next,
      history: [...state.history, state.objects],
      future,
      selectedIds: [],
    }
  })
}
```

**Step 2: Commit**

```bash
git add src/paint/store.ts
git commit -m "feat(paint): add TanStack store with actions"
```

---

## Task 3: Create Object Factory Functions

**Files:**
- Create: `src/paint/objects.ts`

**Step 1: Create factory functions for each object type**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/paint/objects.ts
git commit -m "feat(paint): add object factory functions"
```

---

## Task 4: Create Hit Testing Utilities

**Files:**
- Create: `src/paint/hit-testing.ts`

**Step 1: Create hit testing functions**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/paint/hit-testing.ts
git commit -m "feat(paint): add hit testing utilities"
```

---

## Task 5: Create Canvas Renderer

**Files:**
- Create: `src/paint/renderer.ts`

**Step 1: Create the rendering functions**

```typescript
import type { CanvasObject, HandlePosition, Point } from './types'
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
```

**Step 2: Commit**

```bash
git add src/paint/renderer.ts
git commit -m "feat(paint): add canvas rendering functions"
```

---

## Task 6: Create Toolbar Components

**Files:**
- Create: `src/paint/components/ToolButton.tsx`
- Create: `src/paint/components/ColorPicker.tsx`
- Create: `src/paint/components/StrokeWidthSlider.tsx`
- Create: `src/paint/components/Toolbar.tsx`

**Step 1: Create ToolButton component**

```tsx
import type { ReactNode } from 'react'

interface ToolButtonProps {
  icon: ReactNode
  label: string
  active?: boolean
  onClick: () => void
}

export function ToolButton({ icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`p-2 rounded hover:bg-gray-200 ${
        active ? 'bg-blue-100 ring-2 ring-blue-500' : ''
      }`}
    >
      {icon}
    </button>
  )
}
```

**Step 2: Create ColorPicker component**

```tsx
interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  allowTransparent?: boolean
}

export function ColorPicker({
  label,
  value,
  onChange,
  allowTransparent,
}: ColorPickerProps) {
  const isTransparent = value === 'transparent'

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={isTransparent ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 cursor-pointer border border-gray-300 rounded"
        />
        {allowTransparent && (
          <button
            type="button"
            onClick={() => onChange(isTransparent ? '#ffffff' : 'transparent')}
            className={`px-2 py-1 text-xs rounded ${
              isTransparent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            None
          </button>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Create StrokeWidthSlider component**

```tsx
interface StrokeWidthSliderProps {
  value: number
  onChange: (width: number) => void
}

export function StrokeWidthSlider({ value, onChange }: StrokeWidthSliderProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Width</label>
      <input
        type="range"
        min="1"
        max="20"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20"
      />
      <span className="text-sm text-gray-600 w-6">{value}</span>
    </div>
  )
}
```

**Step 4: Create Toolbar component**

```tsx
import { useStore } from '@tanstack/react-store'
import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  ClipboardPaste,
  Undo2,
  Redo2,
  Download,
} from 'lucide-react'

import { paintStore, setTool, setStyle, undo, redo } from '../store'
import type { ToolType } from '../types'
import { ToolButton } from './ToolButton'
import { ColorPicker } from './ColorPicker'
import { StrokeWidthSlider } from './StrokeWidthSlider'

interface ToolbarProps {
  onPaste: () => void
  onExport: () => void
}

const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
  { type: 'select', icon: <MousePointer2 size={20} />, label: 'Select (V)' },
  { type: 'pencil', icon: <Pencil size={20} />, label: 'Pencil (P)' },
  { type: 'rectangle', icon: <Square size={20} />, label: 'Rectangle (R)' },
  { type: 'ellipse', icon: <Circle size={20} />, label: 'Ellipse (E)' },
  { type: 'line', icon: <Minus size={20} />, label: 'Line (L)' },
  { type: 'arrow', icon: <MoveRight size={20} />, label: 'Arrow (A)' },
  { type: 'text', icon: <Type size={20} />, label: 'Text (T)' },
]

export function Toolbar({ onPaste, onExport }: ToolbarProps) {
  const activeTool = useStore(paintStore, (s) => s.activeTool)
  const style = useStore(paintStore, (s) => s.style)
  const canUndo = useStore(paintStore, (s) => s.history.length > 0)
  const canRedo = useStore(paintStore, (s) => s.future.length > 0)

  return (
    <div className="flex items-center gap-4 p-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1">
        {tools.map((tool) => (
          <ToolButton
            key={tool.type}
            icon={tool.icon}
            label={tool.label}
            active={activeTool === tool.type}
            onClick={() => setTool(tool.type)}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-gray-300" />

      <ToolButton
        icon={<ClipboardPaste size={20} />}
        label="Paste Image (Ctrl+V)"
        onClick={onPaste}
      />

      <div className="w-px h-8 bg-gray-300" />

      <ColorPicker
        label="Stroke"
        value={style.strokeColor}
        onChange={(color) => setStyle({ strokeColor: color })}
      />

      <ColorPicker
        label="Fill"
        value={style.fillColor}
        onChange={(color) => setStyle({ fillColor: color })}
        allowTransparent
      />

      <StrokeWidthSlider
        value={style.strokeWidth}
        onChange={(width) => setStyle({ strokeWidth: width })}
      />

      <div className="w-px h-8 bg-gray-300" />

      <div className="flex items-center gap-1">
        <ToolButton
          icon={<Undo2 size={20} />}
          label="Undo (Ctrl+Z)"
          onClick={undo}
        />
        <ToolButton
          icon={<Redo2 size={20} />}
          label="Redo (Ctrl+Y)"
          onClick={redo}
        />
      </div>

      <div className="w-px h-8 bg-gray-300" />

      <ToolButton
        icon={<Download size={20} />}
        label="Export PNG"
        onClick={onExport}
      />
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add src/paint/components/
git commit -m "feat(paint): add toolbar components"
```

---

## Task 7: Create Canvas Component

**Files:**
- Create: `src/paint/components/Canvas.tsx`

**Step 1: Create the dual-canvas component with mouse handlers**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@tanstack/react-store'

import {
  paintStore,
  addObject,
  updateObject,
  commitObjectUpdate,
  setSelection,
  clearSelection,
  deleteSelected,
} from '../store'
import type { CanvasObject, HandlePosition, Point } from '../types'
import {
  createRectangle,
  createEllipse,
  createLine,
  createArrow,
  createFreehand,
  createText,
  createImage,
} from '../objects'
import {
  findObjectAtPoint,
  findHandleAtPoint,
  getBoundingBox,
  getResizeCursor,
} from '../hit-testing'
import {
  renderAllObjects,
  renderActiveDrawing,
  renderSelectionHandles,
} from '../renderer'

interface CanvasProps {
  onExportRef: React.MutableRefObject<(() => void) | null>
}

type DragMode = 'none' | 'drawing' | 'moving' | 'resizing'

export function Canvas({ onExportRef }: CanvasProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  const objects = useStore(paintStore, (s) => s.objects)
  const selectedIds = useStore(paintStore, (s) => s.selectedIds)
  const activeTool = useStore(paintStore, (s) => s.activeTool)
  const style = useStore(paintStore, (s) => s.style)

  const [dragMode, setDragMode] = useState<DragMode>('none')
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [activeObject, setActiveObject] = useState<CanvasObject | null>(null)
  const [resizeHandle, setResizeHandle] = useState<HandlePosition | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [cursor, setCursor] = useState('default')

  const selectedObject = selectedIds.length === 1
    ? objects.find((o) => o.id === selectedIds[0]) ?? null
    : null

  // Resize canvas to fill container
  useEffect(() => {
    const resize = () => {
      const container = containerRef.current
      const mainCanvas = mainCanvasRef.current
      const overlayCanvas = overlayCanvasRef.current
      if (!container || !mainCanvas || !overlayCanvas) return

      const { width, height } = container.getBoundingClientRect()
      mainCanvas.width = width
      mainCanvas.height = height
      overlayCanvas.width = width
      overlayCanvas.height = height
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Render main canvas when objects change
  useEffect(() => {
    const ctx = mainCanvasRef.current?.getContext('2d')
    if (ctx) {
      renderAllObjects(ctx, objects)
    }
  }, [objects])

  // Render overlay (selection handles + active drawing)
  useEffect(() => {
    const ctx = overlayCanvasRef.current?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    if (activeObject) {
      renderActiveDrawing(ctx, activeObject)
    }

    if (selectedObject && dragMode !== 'drawing') {
      renderSelectionHandles(ctx, selectedObject)
    }
  }, [activeObject, selectedObject, dragMode])

  // Export function
  onExportRef.current = useCallback(() => {
    const canvas = mainCanvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'painting.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = mainCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e)
    setDragStart(point)

    if (activeTool === 'select') {
      // Check if clicking on a resize handle of selected object
      if (selectedObject) {
        const handle = findHandleAtPoint(point, selectedObject)
        if (handle) {
          setDragMode('resizing')
          setResizeHandle(handle)
          return
        }
      }

      // Check if clicking on an object
      const clickedObject = findObjectAtPoint(point, objects)
      if (clickedObject) {
        setSelection([clickedObject.id])
        setDragMode('moving')
      } else {
        clearSelection()
      }
      return
    }

    if (activeTool === 'text') {
      setTextInput({ x: point.x, y: point.y })
      setTimeout(() => textInputRef.current?.focus(), 0)
      return
    }

    // Start drawing
    setDragMode('drawing')

    if (activeTool === 'pencil') {
      setActiveObject({
        id: '',
        type: 'freehand',
        x: point.x,
        y: point.y,
        points: [{ x: 0, y: 0 }],
        style: { ...style },
      })
    } else if (activeTool === 'rectangle') {
      setActiveObject(createRectangle(point.x, point.y, 0, 0, style))
    } else if (activeTool === 'ellipse') {
      setActiveObject(createEllipse(point.x, point.y, 0, 0, style))
    } else if (activeTool === 'line') {
      setActiveObject(createLine(point.x, point.y, point.x, point.y, style))
    } else if (activeTool === 'arrow') {
      setActiveObject(createArrow(point.x, point.y, point.x, point.y, style))
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e)

    // Update cursor
    if (activeTool === 'select' && selectedObject) {
      const handle = findHandleAtPoint(point, selectedObject)
      if (handle) {
        setCursor(getResizeCursor(handle))
      } else if (findObjectAtPoint(point, objects)) {
        setCursor('move')
      } else {
        setCursor('default')
      }
    } else if (activeTool === 'text') {
      setCursor('text')
    } else if (activeTool !== 'select') {
      setCursor('crosshair')
    } else {
      setCursor('default')
    }

    if (!dragStart || dragMode === 'none') return

    if (dragMode === 'moving' && selectedObject) {
      const dx = point.x - dragStart.x
      const dy = point.y - dragStart.y
      updateObject(selectedObject.id, {
        x: selectedObject.x + dx,
        y: selectedObject.y + dy,
        ...(selectedObject.type === 'line' || selectedObject.type === 'arrow'
          ? { endX: selectedObject.endX + dx, endY: selectedObject.endY + dy }
          : {}),
      } as Partial<CanvasObject>)
      setDragStart(point)
      return
    }

    if (dragMode === 'resizing' && selectedObject && resizeHandle) {
      const box = getBoundingBox(selectedObject)
      let newX = box.x
      let newY = box.y
      let newWidth = box.width
      let newHeight = box.height

      if (resizeHandle.includes('w')) {
        newWidth = box.x + box.width - point.x
        newX = point.x
      }
      if (resizeHandle.includes('e')) {
        newWidth = point.x - box.x
      }
      if (resizeHandle.includes('n')) {
        newHeight = box.y + box.height - point.y
        newY = point.y
      }
      if (resizeHandle.includes('s')) {
        newHeight = point.y - box.y
      }

      if (
        selectedObject.type === 'rectangle' ||
        selectedObject.type === 'ellipse' ||
        selectedObject.type === 'image'
      ) {
        updateObject(selectedObject.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        })
      } else if (
        selectedObject.type === 'line' ||
        selectedObject.type === 'arrow'
      ) {
        updateObject(selectedObject.id, {
          x: newX,
          y: newY,
          endX: newX + newWidth,
          endY: newY + newHeight,
        })
      }
      return
    }

    if (dragMode === 'drawing' && activeObject) {
      if (activeObject.type === 'freehand') {
        setActiveObject({
          ...activeObject,
          points: [
            ...activeObject.points,
            { x: point.x - activeObject.x, y: point.y - activeObject.y },
          ],
        })
      } else if (
        activeObject.type === 'rectangle' ||
        activeObject.type === 'ellipse'
      ) {
        setActiveObject({
          ...activeObject,
          width: point.x - dragStart.x,
          height: point.y - dragStart.y,
        })
      } else if (activeObject.type === 'line' || activeObject.type === 'arrow') {
        setActiveObject({
          ...activeObject,
          endX: point.x,
          endY: point.y,
        })
      }
    }
  }

  const handleMouseUp = () => {
    if (dragMode === 'drawing' && activeObject) {
      if (activeObject.type === 'freehand') {
        addObject(createFreehand(
          activeObject.points.map((p) => ({
            x: p.x + activeObject.x,
            y: p.y + activeObject.y,
          })),
          style
        ))
      } else {
        addObject({ ...activeObject, id: crypto.randomUUID() })
      }
    }

    if (dragMode === 'moving' || dragMode === 'resizing') {
      commitObjectUpdate()
    }

    setDragMode('none')
    setDragStart(null)
    setActiveObject(null)
    setResizeHandle(null)
  }

  const handleTextSubmit = (text: string) => {
    if (text && textInput) {
      addObject(createText(textInput.x, textInput.y, text, style))
    }
    setTextInput(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!textInput) {
          deleteSelected()
        }
      }
      if (e.key === 'Escape') {
        clearSelection()
        setTextInput(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [textInput])

  return (
    <div ref={containerRef} className="flex-1 relative bg-white overflow-hidden">
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0"
      />
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {textInput && (
        <input
          ref={textInputRef}
          type="text"
          className="absolute border border-blue-500 px-1 outline-none"
          style={{ left: textInput.x, top: textInput.y - 20 }}
          onBlur={(e) => handleTextSubmit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTextSubmit((e.target as HTMLInputElement).value)
            }
            if (e.key === 'Escape') {
              setTextInput(null)
            }
          }}
        />
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/paint/components/Canvas.tsx
git commit -m "feat(paint): add dual-canvas component with interactions"
```

---

## Task 8: Create PaintApp Component

**Files:**
- Create: `src/paint/components/PaintApp.tsx`
- Create: `src/paint/index.ts`

**Step 1: Create PaintApp component**

```tsx
import { useCallback, useEffect, useRef } from 'react'

import { paintStore, addObject, setSelection, setTool, undo, redo } from '../store'
import { createImage } from '../objects'
import type { ToolType } from '../types'
import { Toolbar } from './Toolbar'
import { Canvas } from './Canvas'

export function PaintApp() {
  const exportRef = useRef<(() => void) | null>(null)

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const reader = new FileReader()
          reader.onload = (e) => {
            const imageData = e.target?.result as string
            const img = new Image()
            img.onload = () => {
              const obj = createImage(
                50,
                50,
                img.width,
                img.height,
                imageData,
                paintStore.state.style
              )
              addObject(obj)
              setSelection([obj.id])
            }
            img.src = imageData
          }
          reader.readAsDataURL(blob)
          break
        }
      }
    } catch (err) {
      console.error('Failed to paste image:', err)
    }
  }, [])

  const handleExport = useCallback(() => {
    exportRef.current?.()
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
        }
        if (e.key === 'y') {
          e.preventDefault()
          redo()
        }
        if (e.key === 'v') {
          handlePaste()
        }
      }

      // Tool shortcuts
      const toolShortcuts: Record<string, ToolType> = {
        v: 'select',
        p: 'pencil',
        r: 'rectangle',
        e: 'ellipse',
        l: 'line',
        a: 'arrow',
        t: 'text',
      }
      if (!e.ctrlKey && !e.metaKey && toolShortcuts[e.key]) {
        setTool(toolShortcuts[e.key])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePaste])

  return (
    <div className="h-screen flex flex-col">
      <Toolbar onPaste={handlePaste} onExport={handleExport} />
      <Canvas onExportRef={exportRef} />
    </div>
  )
}
```

**Step 2: Create barrel export**

```typescript
export { PaintApp } from './components/PaintApp'
export { paintStore } from './store'
export type * from './types'
```

**Step 3: Commit**

```bash
git add src/paint/components/PaintApp.tsx src/paint/index.ts
git commit -m "feat(paint): add PaintApp container with keyboard shortcuts"
```

---

## Task 9: Integrate with Routes

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/__root.tsx`

**Step 1: Update index route to render PaintApp**

Replace the entire content of `src/routes/index.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { PaintApp } from '../paint'

export const Route = createFileRoute('/')({ component: PaintApp })
```

**Step 2: Update root route to remove Header**

In `src/routes/__root.tsx`, remove the Header import and component:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Simple Paint',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
```

**Step 3: Commit**

```bash
git add src/routes/index.tsx src/routes/__root.tsx
git commit -m "feat: integrate PaintApp with routes"
```

---

## Task 10: Test the Application

**Step 1: Start the dev server**

```bash
npm run dev
```

**Step 2: Manual testing checklist**

Test each feature:
- [ ] Select tool: click objects to select, drag to move
- [ ] Pencil tool: freehand drawing
- [ ] Rectangle tool: drag to create rectangles
- [ ] Ellipse tool: drag to create ellipses
- [ ] Line tool: drag to create lines
- [ ] Arrow tool: drag to create arrows
- [ ] Text tool: click to add text
- [ ] Paste image: Ctrl+V with image in clipboard
- [ ] Move objects: select and drag
- [ ] Resize objects: drag handles on selected object
- [ ] Delete: select object and press Delete
- [ ] Undo/Redo: Ctrl+Z / Ctrl+Y
- [ ] Stroke color: changes affect new objects
- [ ] Fill color: changes affect new objects
- [ ] Stroke width: changes affect new objects
- [ ] Export PNG: downloads image

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete simple paint implementation"
```

---

## Summary

**Files created:**
- `src/paint/types.ts` - TypeScript interfaces
- `src/paint/store.ts` - TanStack Store with actions
- `src/paint/objects.ts` - Object factory functions
- `src/paint/hit-testing.ts` - Click detection utilities
- `src/paint/renderer.ts` - Canvas rendering functions
- `src/paint/components/ToolButton.tsx`
- `src/paint/components/ColorPicker.tsx`
- `src/paint/components/StrokeWidthSlider.tsx`
- `src/paint/components/Toolbar.tsx`
- `src/paint/components/Canvas.tsx`
- `src/paint/components/PaintApp.tsx`
- `src/paint/index.ts` - Barrel export

**Files modified:**
- `src/routes/index.tsx` - Render PaintApp
- `src/routes/__root.tsx` - Remove Header, update title
