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
