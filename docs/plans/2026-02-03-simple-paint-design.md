# Simple Paint - Design Document

## Overview

A simple MS Paint-like application built with React, TypeScript, and HTML Canvas 2D. Features layer-based editing where objects remain selectable and editable after placement.

## Features

- **Drawing tools**: Freehand pencil, rectangle, ellipse, line, arrow, text
- **Image paste**: Paste images from clipboard (Ctrl+V)
- **Object manipulation**: Select, move, and resize any object after creation
- **Styling**: Stroke color, fill color, stroke width
- **Undo/Redo**: Full history support (Ctrl+Z / Ctrl+Y)
- **Export**: Download canvas as PNG

## Architecture

### Core Layers

1. **UI Layer** - React components for toolbar and controls
2. **State Layer** - TanStack Store managing canvas objects and tool state
3. **Render Layer** - Canvas 2D rendering triggered by state changes

### Object Model

All drawable items are stored as objects in an array:

```typescript
interface CanvasObject {
  id: string
  type: 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text' | 'image' | 'freehand'
  x: number
  y: number
  width?: number
  height?: number
  points?: { x: number; y: number }[]  // for freehand/lines
  style: {
    strokeColor: string
    fillColor: string
    strokeWidth: number
  }
  text?: string        // for text objects
  imageData?: string   // for image objects (data URL)
}
```

### State Structure

```typescript
interface PaintState {
  objects: CanvasObject[]
  selectedIds: string[]
  activeTool: ToolType
  style: {
    strokeColor: string
    fillColor: string
    strokeWidth: number
  }
  history: CanvasObject[][]  // past states for undo
  future: CanvasObject[][]   // for redo
}
```

## UI Layout

```
┌─────────────────────────────────────────────────┐
│  Toolbar (top)                                  │
│  [Select][Pencil][Rect][Ellipse][Line][Arrow]   │
│  [Text][Paste] | Colors | Width | [Undo][Redo]  │
├─────────────────────────────────────────────────┤
│                                                 │
│              Canvas Area                        │
│         (fills remaining viewport)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components

- `PaintApp` - Main container, handles keyboard shortcuts
- `Toolbar` - Horizontal bar with tools and options
  - `ToolButton` - Tool selection buttons
  - `ColorPicker` - Stroke and fill color pickers
  - `StrokeWidthSlider` - Line thickness control
  - `ExportButton` - Download as PNG
- `Canvas` - Wrapper managing dual canvas elements

## Rendering Strategy

### Dual Canvas Approach

For performance, two stacked canvases:

1. **Main canvas** (bottom) - Renders all committed objects
2. **Overlay canvas** (top) - Renders active drawing and selection handles

This avoids re-rendering everything on every mouse move during drawing.

### Render Triggers

- **Main canvas**: Re-renders on object add/delete/move/style change
- **Overlay canvas**: Re-renders on mouse move during drawing/dragging

### Drawing Methods by Type

| Type | Canvas API |
|------|------------|
| Rectangle | `strokeRect()` / `fillRect()` |
| Ellipse | `ellipse()` + `stroke()` / `fill()` |
| Line | `moveTo()` + `lineTo()` + `stroke()` |
| Arrow | Line + triangle head via `lineTo()` |
| Freehand | `moveTo()` + multiple `lineTo()` + `stroke()` |
| Text | `fillText()` |
| Image | `drawImage()` |

## Interaction Model

### Tool Behaviors

| Tool | Click | Drag |
|------|-------|------|
| Select | Select object under cursor, or deselect | Move object, or drag selection box |
| Pencil | Start drawing | Draw freehand path |
| Rectangle | - | Draw from corner to corner |
| Ellipse | - | Draw within bounding box |
| Line | - | Draw from start to end |
| Arrow | - | Draw line with arrowhead |
| Text | Open inline text input | - |

### Selection & Manipulation

When an object is selected:
- 8 resize handles appear (corners + edge midpoints)
- Dragging object body moves it
- Dragging handles resizes it
- Freehand paths: move only, no resize

### Paste Image Flow

1. User presses Ctrl+V or clicks Paste button
2. Read image from clipboard API
3. Create image object centered on canvas
4. Auto-select for immediate move/resize

## Keyboard Shortcuts

- `Ctrl+Z` - Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo
- `Ctrl+V` - Paste image from clipboard
- `Delete` / `Backspace` - Delete selected objects
- `Escape` - Deselect / cancel current action

## Undo/Redo System

Snapshot-based approach:
- Before each modifying action, push current `objects[]` to `history`
- On undo: move current to `future`, pop from `history`
- On redo: move current to `history`, pop from `future`
- New actions clear the `future` stack
- History limited to 50 states for memory efficiency

### History Triggers

- Object created (after mouse up)
- Object moved/resized (after mouse up)
- Object deleted
- Object style changed

## File Structure

```
src/
├── components/
│   ├── PaintApp.tsx        # Main app container
│   ├── Toolbar.tsx         # Tool bar with all controls
│   ├── ToolButton.tsx      # Individual tool button
│   ├── ColorPicker.tsx     # Color selection
│   ├── StrokeWidthSlider.tsx
│   └── Canvas.tsx          # Dual canvas wrapper
├── stores/
│   └── paint-store.ts      # TanStack store for state
├── lib/
│   ├── renderer.ts         # Canvas rendering functions
│   ├── objects.ts          # Object creation helpers
│   ├── hit-testing.ts      # Click detection on objects
│   └── history.ts          # Undo/redo logic
└── types/
    └── paint.ts            # TypeScript interfaces
```

## Technical Decisions

- **Canvas 2D over SVG/WebGL**: Best performance-to-complexity ratio for this use case
- **Layer-based over destructive**: Enables move/resize after placement as requested
- **Dual canvas**: Separates frequent updates (drawing) from infrequent ones (committed objects)
- **TanStack Store**: Already in dependencies, lightweight, reactive
- **Snapshot history**: Simpler than command pattern, acceptable memory trade-off
