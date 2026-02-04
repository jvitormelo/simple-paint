import { useCallback, useEffect, useRef } from 'react'

import { paintStore, addObject, setSelection, setTool, undo, redo, generateId } from '../store'
import { createImage } from '../objects'
import type { CanvasObject, ToolType } from '../types'
import { Toolbar } from './Toolbar'
import { Canvas } from './Canvas'

// Internal clipboard for copied canvas objects
let copiedObjects: CanvasObject[] = []

export function PaintApp() {
  const exportRef = useRef<(() => void) | null>(null)

  const handleCopy = useCallback(() => {
    const { objects, selectedIds } = paintStore.state
    if (selectedIds.length === 0) return

    copiedObjects = objects
      .filter((obj) => selectedIds.includes(obj.id))
      .map((obj) => ({ ...obj }))
  }, [])

  const handlePaste = useCallback(async () => {
    // First, check if we have copied canvas objects
    if (copiedObjects.length > 0) {
      const newIds: string[] = []
      for (const obj of copiedObjects) {
        const newObj = {
          ...obj,
          id: generateId(),
          x: obj.x + 20,
          y: obj.y + 20,
        } as CanvasObject
        addObject(newObj)
        newIds.push(newObj.id)
      }
      // Update copied objects position for next paste
      copiedObjects = copiedObjects.map((obj) => ({
        ...obj,
        x: obj.x + 20,
        y: obj.y + 20,
      }))
      setSelection(newIds)
      return
    }

    // Otherwise, try to paste from system clipboard
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
        if (e.key === 'c') {
          handleCopy()
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
  }, [handleCopy, handlePaste])

  return (
    <div className="h-screen flex flex-col">
      <Toolbar onPaste={handlePaste} onExport={handleExport} />
      <Canvas onExportRef={exportRef} />
    </div>
  )
}
