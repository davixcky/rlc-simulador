import { PRESETS, type RlcParams } from "../lib/rlc";

interface Props {
  params: RlcParams;
  onChange: (p: RlcParams) => void;
}

/**
 * Configuración por control. R y U son lineales; L y C usan escala logarítmica
 * porque varían en varios órdenes de magnitud en la práctica.
 */
const CONTROLS = [
  {
    key: "R" as const,
    label: "Resistencia",
    symbol: "R",
    unit: "Ω",
    min: 0,
    max: 500,
    step: 0.1,
    scale: "linear" as const,
    color: "rose",
    help: "Disipa energía como calor (efecto Joule).",
  },
  {
    key: "L" as const,
    label: "Inductancia",
    symbol: "L",
    unit: "H",
    min: 0.001,
    max: 5,
    step: 0.001,
    scale: "log" as const,
    color: "fuchsia",
    help: "Energía almacenada en el campo magnético — análogo a la masa.",
  },
  {
    key: "C" as const,
    label: "Capacitancia",
    symbol: "C",
    unit: "F",
    min: 1e-6,
    max: 1e-2,
    step: 1e-7,
    scale: "log" as const,
    color: "teal",
    help: "Energía almacenada como diferencia de potencial.",
  },
  {
    key: "U" as const,
    label: "Tensión inicial",
    symbol: "U",
    unit: "V",
    min: 0.1,
    max: 50,
    step: 0.1,
    scale: "linear" as const,
    color: "orange",
    help: "Voltaje al que se cargó previamente el condensador.",
  },
];

const RING: Record<string, string> = {
  rose: "ring-rose-400/30 hover:ring-rose-400/60",
  fuchsia: "ring-fuchsia-400/30 hover:ring-fuchsia-400/60",
  teal: "ring-teal-400/30 hover:ring-teal-400/60",
  orange: "ring-orange-400/30 hover:ring-orange-400/60",
};

const TEXT: Record<string, string> = {
  rose: "text-rose-300",
  fuchsia: "text-fuchsia-300",
  teal: "text-teal-300",
  orange: "text-orange-300",
};

export function ControlPanel({ params, onChange }: Props) {
  return (
    <section className="rounded-2xl bg-stone-900/60 ring-1 ring-stone-700/50 backdrop-blur-sm p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-widest text-orange-300">Parámetros</h2>
        <PresetMenu onChoose={(p) => onChange(p)} />
      </div>

      {CONTROLS.map((c) => {
        const { key, ...rest } = c;
        return (
          <Control
            key={key}
            {...rest}
            value={params[key]}
            onChange={(v) => onChange({ ...params, [key]: v })}
          />
        );
      })}
    </section>
  );
}

function Control(props: {
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  scale: "linear" | "log";
  color: string;
  help: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const { label, symbol, unit, min, max, step, scale, color, help, value, onChange } = props;

  const sliderMin = 0;
  const sliderMax = 1000;
  const sliderValue = scale === "log" ? toLog(value, min, max, sliderMax) : ((value - min) / (max - min)) * sliderMax;
  const onSlider = (v: number) => {
    const real = scale === "log" ? fromLog(v, min, max, sliderMax) : min + (v / sliderMax) * (max - min);
    onChange(clamp(real, min, max));
  };

  return (
    <div className={`rounded-xl bg-stone-900/40 ring-1 ${RING[color]} transition p-3`}>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div>
          <span className={`font-mono text-lg font-bold ${TEXT[color]}`}>{symbol}</span>
          <span className="ml-2 text-xs uppercase tracking-widest text-stone-400">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={scale === "log" ? Math.max(step, value / 100) : step}
            onChange={(e) => onChange(clamp(parseFloat(e.target.value) || 0, min, max))}
            className="bg-stone-950/60 ring-1 ring-stone-700/50 rounded px-2 py-1 text-right font-mono text-sm w-32 focus:outline-none focus:ring-orange-400/60"
          />
          <span className="font-mono text-sm text-stone-400 w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={1}
        value={sliderValue}
        onChange={(e) => onSlider(parseFloat(e.target.value))}
        style={{ ["--track" as never]: `${(sliderValue / sliderMax) * 100}%` }}
      />
      <p className="text-xs text-stone-500 mt-1">{help}</p>
    </div>
  );
}

function PresetMenu({ onChoose }: { onChoose: (p: RlcParams) => void }) {
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx) && PRESETS[idx]) {
          onChoose(PRESETS[idx].params);
          e.target.value = "";
        }
      }}
      className="bg-stone-950/60 ring-1 ring-stone-700/50 rounded-md px-3 py-1 text-xs font-mono text-stone-300 focus:outline-none focus:ring-orange-400/60"
    >
      <option value="" disabled>
        Presets…
      </option>
      {PRESETS.map((p, i) => (
        <option key={p.name} value={i}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function toLog(value: number, min: number, max: number, sliderMax: number): number {
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  const lv = Math.log10(Math.max(value, min));
  return ((lv - lo) / (hi - lo)) * sliderMax;
}

function fromLog(sliderValue: number, min: number, max: number, sliderMax: number): number {
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  return Math.pow(10, lo + (sliderValue / sliderMax) * (hi - lo));
}
