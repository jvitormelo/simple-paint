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
