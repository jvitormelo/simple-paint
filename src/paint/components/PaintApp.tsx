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
