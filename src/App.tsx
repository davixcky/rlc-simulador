import { useMemo, useState } from "react";
import { Header } from "./components/Header";
import { ControlPanel } from "./components/ControlPanel";
import { DerivedStrip } from "./components/DerivedStrip";
import { ChargePlot, CurrentPlot } from "./components/Plots";
import { VideoExport } from "./components/VideoExport";
import {
  derive,
  sample,
  suggestedTMax,
  type RlcParams,
} from "./lib/rlc";

const DEFAULT_PARAMS: RlcParams = {
  L: 0.375,
  C: 9e-5,
  R: 2.0,
  U: 5.0,
};

function App() {
  const [params, setParams] = useState<RlcParams>(DEFAULT_PARAMS);
  // Permitir al usuario fijar la ventana de tiempo manualmente, o calcular automáticamente.
  const [autoT, setAutoT] = useState(true);
  const [tMaxOverride, setTMaxOverride] = useState<number>(0.5);

  const derived = useMemo(() => derive(params), [params]);
  const tMax = autoT ? suggestedTMax(derived) : tMaxOverride;
  const data = useMemo(() => sample(params, tMax, 600), [params, tMax]);

  return (
    <div className="min-h-screen pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-8 grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <ControlPanel params={params} onChange={setParams} />

          <section className="rounded-2xl bg-stone-900/60 ring-1 ring-stone-700/50 backdrop-blur-sm p-5">
            <h2 className="text-sm font-mono uppercase tracking-widest text-orange-300 mb-3">
              Ventana de tiempo
            </h2>
            <label className="flex items-center gap-2 text-sm text-stone-300 mb-3">
              <input
                type="checkbox"
                checked={autoT}
                onChange={(e) => setAutoT(e.target.checked)}
                className="accent-orange-400"
              />
              Calcular automáticamente
            </label>
            {!autoT && (
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-400 font-mono">t_max</span>
                  <span className="font-mono text-sm text-stone-200">
                    {tMaxOverride.toPrecision(3)} s
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.log10(derived.tau / 10)}
                  max={Math.log10(derived.tau * 30)}
                  step={0.01}
                  value={Math.log10(tMaxOverride)}
                  onChange={(e) => setTMaxOverride(Math.pow(10, parseFloat(e.target.value)))}
                  style={{
                    ["--track" as never]:
                      `${
                        ((Math.log10(tMaxOverride) - Math.log10(derived.tau / 10)) /
                          (Math.log10(derived.tau * 30) - Math.log10(derived.tau / 10))) *
                        100
                      }%`,
                  }}
                />
              </div>
            )}
            <p className="text-xs text-stone-500 mt-2">
              Tiempo total mostrado en las gráficas. Auto = varios τ ó periodos.
            </p>
          </section>

          <VideoExport params={params} />
        </aside>

        <div className="space-y-5 min-w-0">
          <DerivedStrip derived={derived} />
          <ChargePlot data={data} derived={derived} />
          <CurrentPlot data={data} derived={derived} />
          <Footnote />
        </div>
      </main>
    </div>
  );
}

function Footnote() {
  return (
    <footer className="rounded-2xl bg-stone-900/40 ring-1 ring-stone-800/60 p-4 text-xs text-stone-500 leading-relaxed">
      <p>
        Las soluciones se obtienen analíticamente mediante la transformada de Laplace
        de la EDO{" "}
        <span className="font-mono text-stone-300">
          L · q̈ + R · q̇ + q/C = 0
        </span>{" "}
        con condiciones iniciales{" "}
        <span className="font-mono text-stone-300">q(0) = C·U</span> e{" "}
        <span className="font-mono text-stone-300">i(0) = 0</span>. Las soluciones
        cerradas evaluadas son las descritas en Ciobanu et al. (2023) y formalizadas
        en Mäkilä (2006).
      </p>
    </footer>
  );
}

export default App;
