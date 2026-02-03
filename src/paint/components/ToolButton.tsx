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
