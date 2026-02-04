import { useCallback, useEffect, useRef } from 'react'

import { paintStore, addObject, setSelection, setTool, undo, redo, generateId } from '../store'
import { createImage } from '../objects'
import type { CanvasObject, ToolType } from '../types'
import { Toolbar } from './Toolbar'
import { Canvas } from './Canvas'

// Internal clipboard for copied canvas objects
let copiedObjects: CanvasObject[] = []

function pasteImageFromBlob(blob: Blob): void {
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
}

export function PaintApp() {
  const exportRef = useRef<(() => void) | null>(null)

  const handleCopy = useCallback(() => {
    const { objects, selectedIds } = paintStore.state
    if (selectedIds.length === 0) return

    copiedObjects = objects
      .filter((obj) => selectedIds.includes(obj.id))
      .map((obj) => ({ ...obj }))
  }, [])

  // Paste internal copied objects only
  const pasteInternalObjects = useCallback(() => {
    if (copiedObjects.length === 0) return false

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
    return true
  }, [])

  // Handle paste button click (fallback for when paste event isn't available)
  const handlePasteButton = useCallback(async () => {
    if (pasteInternalObjects()) return

    // Try clipboard API (may not work in Firefox without permission)
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          pasteImageFromBlob(blob)
          return
        }
      }
    } catch {
      // Clipboard API failed, prompt user to use Ctrl+V
      alert('Please use Ctrl+V to paste images. Your browser requires keyboard paste for security.')
    }
  }, [pasteInternalObjects])

  const handleExport = useCallback(() => {
    exportRef.current?.()
  }, [])

  // Handle paste event (works in Firefox and all browsers)
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      // First try internal clipboard
      if (pasteInternalObjects()) {
        e.preventDefault()
        return
      }

      // Then try to get image from clipboard data
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            pasteImageFromBlob(blob)
          }
          return
        }
      }
    }

    document.addEventListener('paste', handlePasteEvent)
    return () => document.removeEventListener('paste', handlePasteEvent)
  }, [pasteInternalObjects])

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
        // Note: Ctrl+V is handled by paste event listener for better browser support
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
  }, [handleCopy])

  return (
    <div className="h-screen flex flex-col">
      <Toolbar onPaste={handlePasteButton} onExport={handleExport} />
      <Canvas onExportRef={exportRef} />
    </div>
  )
}
