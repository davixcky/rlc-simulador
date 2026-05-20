import { useState } from "react";
import type { RlcParams } from "../lib/rlc";
import {
  DEFAULT_VIDEO_OPTS,
  extForMime,
  recordVideo,
  type VideoOpts,
} from "../lib/videoRender";

interface Props {
  params: RlcParams;
}

type State =
  | { stage: "idle" }
  | { stage: "rendering"; progress: number }
  | { stage: "done"; url: string; ext: string; mime: string }
  | { stage: "error"; message: string };

export function VideoExport({ params }: Props) {
  const [state, setState] = useState<State>({ stage: "idle" });
  const [duration, setDuration] = useState<number>(DEFAULT_VIDEO_OPTS.durationSeconds);

  const run = async () => {
    setState({ stage: "rendering", progress: 0 });
    try {
      const opts: VideoOpts = {
        ...DEFAULT_VIDEO_OPTS,
        durationSeconds: duration,
      };
      const { blob, mimeType } = await recordVideo(params, opts, (p) =>
        setState({ stage: "rendering", progress: p })
      );
      const url = URL.createObjectURL(blob);
      setState({ stage: "done", url, ext: extForMime(mimeType), mime: mimeType });
    } catch (err) {
      setState({
        stage: "error",
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  };

  return (
    <section className="rounded-2xl bg-stone-900/60 ring-1 ring-stone-700/50 backdrop-blur-sm p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-mono uppercase tracking-widest text-fuchsia-300">
          Exportar video
        </h2>
        <span className="text-xs text-stone-500">1920×1080 · 30 fps</span>
      </div>

      <p className="text-xs text-stone-400 mb-4">
        Renderiza un clip con la respuesta q(t) e i(t) dibujándose con los parámetros actuales.
      </p>

      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs text-stone-400 font-mono">Duración:</label>
        <input
          type="range"
          min={4}
          max={30}
          step={1}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10))}
          disabled={state.stage === "rendering"}
          className="flex-1"
          style={{ ["--track" as never]: `${((duration - 4) / 26) * 100}%` }}
        />
        <span className="font-mono text-sm text-fuchsia-300 w-12 text-right">
          {duration} s
        </span>
      </div>

      {state.stage === "idle" && (
        <button
          onClick={run}
          className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-500 hover:from-fuchsia-400 hover:to-orange-400 transition px-4 py-3 font-bold text-stone-900"
        >
          Generar video
        </button>
      )}

      {state.stage === "rendering" && (
        <div>
          <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-orange-400 transition-all"
              style={{ width: `${state.progress * 100}%` }}
            />
          </div>
          <div className="text-xs text-stone-400 font-mono mt-2 text-center">
            Renderizando… {Math.round(state.progress * 100)}%
          </div>
        </div>
      )}

      {state.stage === "done" && (
        <div className="space-y-2">
          <video
            src={state.url}
            controls
            className="w-full rounded-lg ring-1 ring-stone-700/50"
          />
          <div className="flex gap-2">
            <a
              href={state.url}
              download={`rlc-simulacion.${state.ext}`}
              className="flex-1 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 transition px-4 py-2.5 font-bold text-stone-900 text-center text-sm"
            >
              Descargar .{state.ext}
            </a>
            <button
              onClick={() => setState({ stage: "idle" })}
              className="rounded-xl bg-stone-800 hover:bg-stone-700 transition px-4 py-2.5 text-sm text-stone-300"
            >
              De nuevo
            </button>
          </div>
          <p className="text-[11px] text-stone-500 font-mono">{state.mime}</p>
        </div>
      )}

      {state.stage === "error" && (
        <div className="rounded-lg bg-rose-500/10 ring-1 ring-rose-400/40 p-3 text-sm text-rose-300">
          <strong>Error:</strong> {state.message}
          <button
            onClick={() => setState({ stage: "idle" })}
            className="block mt-2 text-xs underline"
          >
            Reintentar
          </button>
        </div>
      )}
    </section>
  );
}
