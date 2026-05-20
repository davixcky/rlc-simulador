import {
  type Derived,
  REGIME_COLOR,
  REGIME_DESCRIPTION,
  REGIME_LABEL,
  fmt,
} from "../lib/rlc";

interface Props {
  derived: Derived;
}

export function DerivedStrip({ derived }: Props) {
  const color = REGIME_COLOR[derived.regime];

  return (
    <section
      className="rounded-2xl bg-stone-900/60 ring-1 ring-stone-700/50 backdrop-blur-sm p-5"
      style={{ boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
        <span
          className="font-mono text-xs uppercase tracking-widest"
          style={{ color }}
        >
          régimen
        </span>
        <span className="font-bold text-lg" style={{ color }}>
          {REGIME_LABEL[derived.regime]}
        </span>
      </div>
      <p className="text-sm text-stone-400 mb-4">{REGIME_DESCRIPTION[derived.regime]}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="γ" hint="amortiguamiento" value={`${fmt(derived.gamma)} s⁻¹`} />
        <Stat label="ω₀" hint="frecuencia natural" value={`${fmt(derived.omega0)} rad/s`} />
        <Stat label="R_crit" hint="resistencia crítica" value={`${fmt(derived.Rcrit)} Ω`} />
        <Stat label="τ" hint="constante de tiempo" value={`${fmt(derived.tau)} s`} />
        {derived.omega !== undefined && (
          <Stat label="ω" hint="pseudo-frecuencia" value={`${fmt(derived.omega)} rad/s`} />
        )}
        {derived.T !== undefined && (
          <Stat label="T" hint="periodo" value={`${fmt(derived.T)} s`} />
        )}
        {derived.lambda !== undefined && (
          <Stat label="λ" hint="exponente real" value={`${fmt(derived.lambda)} s⁻¹`} />
        )}
        {derived.s1 !== undefined && derived.s2 !== undefined && (
          <Stat
            label="s₁, s₂"
            hint="raíces"
            value={`${fmt(derived.s1)}, ${fmt(derived.s2)}`}
          />
        )}
        <Stat label="q₀" hint="carga inicial" value={`${fmt(derived.q0)} C`} />
      </div>
    </section>
  );
}

function Stat({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-950/50 ring-1 ring-stone-700/40 px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-base text-stone-100">{label}</span>
        <span className="text-[10px] uppercase tracking-widest text-stone-500">{hint}</span>
      </div>
      <div className="font-mono text-sm text-stone-300 mt-0.5">{value}</div>
    </div>
  );
}
