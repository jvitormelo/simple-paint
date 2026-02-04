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
