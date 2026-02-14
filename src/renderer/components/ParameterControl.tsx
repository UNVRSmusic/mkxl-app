interface ParameterControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  displayValue?: (value: number) => string;
}

export default function ParameterControl({
  label,
  value,
  min,
  max,
  onChange,
  displayValue,
}: ParameterControlProps) {
  const display = displayValue ? displayValue(value) : value.toString();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-gray-400 font-medium">{label}</label>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />

      <div className="text-center">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= min && val <= max) {
              onChange(val);
            }
          }}
          className="input text-sm text-center w-20 px-2 py-1"
        />
        {displayValue && (
          <div className="text-xs text-gray-500 mt-1">{display}</div>
        )}
      </div>
    </div>
  );
}
