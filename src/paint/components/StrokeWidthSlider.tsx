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
