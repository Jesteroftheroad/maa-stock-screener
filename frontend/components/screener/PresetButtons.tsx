"use client";

const PRESETS = [
  { id: "buffett",           label: "Buffett" },
  { id: "undervalued_tech",  label: "Undervalued Tech" },
  { id: "dividend_kings",    label: "Dividend Kings" },
  { id: "breakout_today",    label: "Breakout Today" },
  { id: "short_squeeze",     label: "Short Squeeze" },
  { id: "high_growth_ca",    label: "High Growth CA" },
  { id: "peter_lynch_growth",label: "Peter Lynch" },
  { id: "covered_call",      label: "Covered Calls" },
];

interface PresetButtonsProps {
  activePreset: string | null;
  onSelect: (preset: string) => void;
}

export function PresetButtons({ activePreset, onSelect }: PresetButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {PRESETS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            activePreset === id
              ? "border-blue-500 bg-blue-500/20 text-blue-400"
              : "border-current text-muted-var hover:border-blue-500/40 hover:text-blue-400"
          }`}
          style={{ borderColor: activePreset === id ? undefined : "var(--border)" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
