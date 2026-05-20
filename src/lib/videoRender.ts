/**
 * Renderizado del video — dibuja los gráficos sobre un <canvas> imperativo
 * y captura el flujo con MediaRecorder.
 *
 * El export del video usa el contenedor que el navegador soporte; en Chrome
 * y Firefox eso es WebM. Se intenta MP4 primero (Safari y algunas builds de
 * Chrome lo aceptan); si no, se usa WebM.
 */
import {
  REGIME_COLOR,
  REGIME_LABEL,
  charge,
  current,
  derive,
  fmt,
  type Derived,
  type RlcParams,
} from "./rlc";

export interface VideoOpts {
  width: number;
  height: number;
  fps: number;
  /** Duración del video en segundos (no de la simulación). */
  durationSeconds: number;
  /** Duración simulada que se muestra dentro del video. */
  simulatedSeconds: number;
}

export const DEFAULT_VIDEO_OPTS: VideoOpts = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationSeconds: 12,
  simulatedSeconds: 0, // 0 => derivar de los parámetros
};

interface PlotBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface RenderContext {
  params: RlcParams;
  derived: Derived;
  samples: { t: number; q: number; i: number }[];
  qBox: PlotBox;
  iBox: PlotBox;
  qRange: [number, number];
  iRange: [number, number];
  tMax: number;
  opts: VideoOpts;
}

const BG = "#0c0a09";
const TEXT = "#e7e5e4";
const MUTED = "#a8a29e";
const DIM = "#78716c";
const GRID = "#3f3f46";
const ROSE = "#fb7185";

function buildContext(params: RlcParams, opts: VideoOpts): RenderContext {
  const der = derive(params);
  const tMax =
    opts.simulatedSeconds > 0
      ? opts.simulatedSeconds
      : suggestedSimWindow(der);

  // 30 fps * 12 s = 360 muestras como base; sobrepasar mejora suavidad.
  const samplesCount = Math.max(800, opts.fps * opts.durationSeconds * 3);
  const samples = new Array(samplesCount).fill(0).map((_, k) => {
    const t = (k / (samplesCount - 1)) * tMax;
    return { t, q: charge(t, params, der), i: current(t, params, der) };
  });

  const qVals = samples.map((s) => s.q);
  const iVals = samples.map((s) => s.i);
  const qRange = padRange(Math.min(...qVals), Math.max(...qVals));
  const iRange = padRange(Math.min(...iVals), Math.max(...iVals));

  const margin = { left: 100, right: 80, top: 80, bottom: 80 };
  const gap = 60;
  const plotW = opts.width - margin.left - margin.right;
  const headerH = 180;
  const footerH = 40;
  const totalPlotsH = opts.height - headerH - footerH - gap;
  const plotH = totalPlotsH / 2;

  const qBox: PlotBox = { left: margin.left, top: headerH, width: plotW, height: plotH };
  const iBox: PlotBox = {
    left: margin.left,
    top: headerH + plotH + gap,
    width: plotW,
    height: plotH,
  };

  return { params, derived: der, samples, qBox, iBox, qRange, iRange, tMax, opts };
}

function suggestedSimWindow(d: Derived): number {
  if (d.regime === "subamortiguado") {
    const envWin = -Math.log(0.005) / d.gamma;
    return Math.max(envWin, (d.T ?? 0) * 4);
  }
  return 7 * d.tau;
}

function padRange(min: number, max: number): [number, number] {
  if (min === max) {
    return [min - 1, max + 1];
  }
  const pad = (max - min) * 0.08;
  return [min - pad, max + pad];
}

/**
 * Dibuja un fotograma del video a un progreso dado (0..1) en el contexto del canvas.
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  progress: number
) {
  const { opts, derived, qBox, iBox, qRange, iRange, tMax, samples } = rc;

  // Fondo + gradientes radiales
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, opts.width, opts.height);
  drawRadialGlow(ctx, opts.width * 0.15, opts.height * 0.05, "rgba(15,118,110,0.18)", 700);
  drawRadialGlow(ctx, opts.width * 0.85, opts.height * 0.95, "rgba(194,65,12,0.16)", 800);

  // Encabezado
  const color = REGIME_COLOR[derived.regime];
  ctx.fillStyle = color;
  ctx.font = "20px 'JetBrains Mono', monospace";
  ctx.textBaseline = "top";
  ctx.fillText(`RÉGIMEN · ${REGIME_LABEL[derived.regime].toUpperCase()}`, 60, 50);

  ctx.fillStyle = TEXT;
  ctx.font = "bold 56px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Circuito RLC — respuesta libre", 60, 80);

  // Subtítulo con parámetros
  ctx.fillStyle = MUTED;
  ctx.font = "24px 'JetBrains Mono', monospace";
  ctx.fillText(
    `R = ${fmt(rc.params.R)} Ω · L = ${fmt(rc.params.L)} H · C = ${fmt(rc.params.C)} F · U = ${fmt(rc.params.U)} V`,
    60,
    150
  );

  // Cuántas muestras dibujar según el progreso
  const upTo = Math.max(2, Math.round(progress * samples.length));
  const tCurrent = samples[Math.min(upTo - 1, samples.length - 1)].t;

  drawPlot(
    ctx,
    qBox,
    samples.slice(0, upTo),
    qRange,
    [0, tMax],
    "q",
    "q(t)",
    "C",
    color,
    tMax
  );
  drawPlot(
    ctx,
    iBox,
    samples.slice(0, upTo),
    iRange,
    [0, tMax],
    "i",
    "i(t)",
    "A",
    ROSE,
    tMax
  );

  // Píldora con el tiempo actual
  ctx.fillStyle = MUTED;
  ctx.font = "20px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(`t = ${fmt(tCurrent, 4)} s`, opts.width - 60, opts.height - 50);
  ctx.textAlign = "left";

  // Sello
  ctx.fillStyle = DIM;
  ctx.font = "18px 'JetBrains Mono', monospace";
  ctx.fillText(
    "Simulador EDO RLC · transformada de Laplace",
    60,
    opts.height - 50
  );
}

function drawRadialGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number
) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawPlot(
  ctx: CanvasRenderingContext2D,
  box: PlotBox,
  data: { t: number; q: number; i: number }[],
  yRange: [number, number],
  xRange: [number, number],
  key: "q" | "i",
  title: string,
  unit: string,
  stroke: string,
  tMax: number
) {
  // Marco
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1;
  ctx.strokeRect(box.left, box.top, box.width, box.height);

  // Título del plot
  ctx.fillStyle = stroke;
  ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(`${title}  ·  ${unit}`, box.left, box.top - 38);

  // Cuadrícula y ticks
  const xTicks = 6;
  const yTicks = 5;
  ctx.fillStyle = DIM;
  ctx.font = "16px 'JetBrains Mono', monospace";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= xTicks; i++) {
    const x = box.left + (i / xTicks) * box.width;
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    ctx.moveTo(x, box.top);
    ctx.lineTo(x, box.top + box.height);
    ctx.stroke();
    const t = xRange[0] + (i / xTicks) * (xRange[1] - xRange[0]);
    ctx.textAlign = "center";
    ctx.fillText(fmt(t, 2), x, box.top + box.height + 18);
  }
  for (let i = 0; i <= yTicks; i++) {
    const y = box.top + box.height - (i / yTicks) * box.height;
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    ctx.moveTo(box.left, y);
    ctx.lineTo(box.left + box.width, y);
    ctx.stroke();
    const v = yRange[0] + (i / yTicks) * (yRange[1] - yRange[0]);
    ctx.textAlign = "right";
    ctx.fillText(fmt(v, 2), box.left - 10, y);
  }

  // Eje y = 0
  if (yRange[0] < 0 && yRange[1] > 0) {
    const zeroY =
      box.top + box.height - ((0 - yRange[0]) / (yRange[1] - yRange[0])) * box.height;
    ctx.strokeStyle = "#52525b";
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(box.left, zeroY);
    ctx.lineTo(box.left + box.width, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Curva
  if (data.length < 2) return;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let k = 0; k < data.length; k++) {
    const s = data[k];
    const x = box.left + ((s.t - xRange[0]) / (xRange[1] - xRange[0])) * box.width;
    const y =
      box.top +
      box.height -
      ((s[key] - yRange[0]) / (yRange[1] - yRange[0])) * box.height;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Punto en la cabeza de la curva
  const head = data[data.length - 1];
  const hx =
    box.left + ((head.t - xRange[0]) / (xRange[1] - xRange[0])) * box.width;
  const hy =
    box.top +
    box.height -
    ((head[key] - yRange[0]) / (yRange[1] - yRange[0])) * box.height;
  ctx.fillStyle = stroke;
  ctx.beginPath();
  ctx.arc(hx, hy, 7, 0, Math.PI * 2);
  ctx.fill();
  // halo
  ctx.fillStyle = `${stroke}55`;
  ctx.beginPath();
  ctx.arc(hx, hy, 14, 0, Math.PI * 2);
  ctx.fill();
  void tMax;
}

/**
 * Captura un MP4/WebM del simulador.
 *
 * - Crea un canvas off-DOM con la resolución pedida.
 * - Anima la curva creciendo durante `durationSeconds`.
 * - Devuelve un Blob descargable.
 */
export async function recordVideo(
  params: RlcParams,
  opts: VideoOpts = DEFAULT_VIDEO_OPTS,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; mimeType: string }> {
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d")!;
  const rc = buildContext(params, opts);

  // Pre-dibujar el primer frame para que MediaRecorder no capture un canvas vacío.
  renderFrame(ctx, rc, 0);

  const stream = canvas.captureStream(opts.fps);

  // Intentar varios mime types — preferir MP4 cuando esté disponible.
  const candidates = [
    'video/mp4;codecs="avc1.42E01F"',
    "video/mp4",
    'video/webm;codecs="vp9"',
    'video/webm;codecs="vp8"',
    "video/webm",
  ];
  let chosen = candidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!chosen) {
    throw new Error("MediaRecorder no soporta ningún contenedor de video.");
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: chosen,
    videoBitsPerSecond: 6_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: chosen!.split(";")[0] });
      resolve(blob);
    };
  });

  recorder.start();

  const totalFrames = opts.fps * opts.durationSeconds;
  const frameDurationMs = 1000 / opts.fps;
  const introFrames = Math.round(opts.fps * 0.6); // breve fade-in del título
  const holdFrames = Math.round(opts.fps * 1.5);   // mantener el estado final

  for (let f = 0; f < totalFrames; f++) {
    const tStart = performance.now();
    const drawing = f - introFrames;
    const drawProgress = clamp(drawing / (totalFrames - introFrames - holdFrames), 0, 1);
    renderFrame(ctx, rc, drawProgress);
    onProgress?.(f / totalFrames);
    // Esperar al siguiente "tick" para que captureStream produzca un frame
    const elapsed = performance.now() - tStart;
    const wait = Math.max(0, frameDurationMs - elapsed);
    await sleep(wait);
  }
  onProgress?.(1);

  recorder.stop();
  const blob = await finished;
  return { blob, mimeType: chosen };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Sugiere una extensión para el archivo descargable según el mimeType. */
export function extForMime(mime: string): string {
  if (mime.startsWith("video/mp4")) return "mp4";
  if (mime.startsWith("video/webm")) return "webm";
  return "video";
}
