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
