/**
 * Núcleo de simulación del circuito RLC en serie, EDO de segundo orden:
 *
 *   L · q''(t) + R · q'(t) + q(t)/C = 0
 *
 * Con q(0) = q0 = C·U, i(0) = q'(0) = 0.
 *
 * Las soluciones cerradas para cada régimen se obtienen vía la transformada
 * de Laplace y se evalúan aquí.
 */

export type Regime = "subamortiguado" | "critico" | "sobreamortiguado";

export interface RlcParams {
  /** Inductancia (H) */
  L: number;
  /** Capacitancia (F) */
  C: number;
  /** Resistencia (Ω) */
  R: number;
  /** Tensión inicial de carga (V) — q0 = C·U */
  U: number;
}

export interface Derived {
  q0: number;        // carga inicial [C]
  gamma: number;     // R / (2L) [s^-1]
  omega0: number;    // 1 / sqrt(LC) [rad/s]
  Rcrit: number;     // 2·sqrt(L/C) [Ω]
  regime: Regime;
  /** Frecuencia angular amortiguada — sólo subamortiguado */
  omega?: number;
  /** Periodo — sólo subamortiguado */
  T?: number;
  /** Constante de tiempo τ = 1/γ */
  tau: number;
  /** λ — sólo sobreamortiguado */
  lambda?: number;
  /** Raíces s₁, s₂ del polinomio característico */
  s1?: number;
  s2?: number;
}

const EPS = 1e-6;

export function derive(params: RlcParams): Derived {
  const { L, C, R, U } = params;
  const q0 = C * U;
  const gamma = R / (2 * L);
  const omega0 = 1 / Math.sqrt(L * C);
  const Rcrit = 2 * Math.sqrt(L / C);
  const tau = 1 / gamma;

  if (gamma < omega0 - EPS) {
    const omega = Math.sqrt(omega0 * omega0 - gamma * gamma);
    return {
      q0,
      gamma,
      omega0,
      Rcrit,
      regime: "subamortiguado",
      omega,
      T: (2 * Math.PI) / omega,
      tau,
    };
  }
  if (gamma > omega0 + EPS) {
    const lambda = Math.sqrt(gamma * gamma - omega0 * omega0);
    return {
      q0,
      gamma,
      omega0,
      Rcrit,
      regime: "sobreamortiguado",
      lambda,
      s1: -gamma + lambda,
      s2: -gamma - lambda,
      tau,
    };
  }
  return {
    q0,
    gamma,
    omega0,
    Rcrit,
    regime: "critico",
    tau,
  };
}

/** Solución analítica q(t) por régimen. */
export function charge(t: number, params: RlcParams, d?: Derived): number {
  const der = d ?? derive(params);
  const { q0, gamma } = der;
  const env = Math.exp(-gamma * t);

  if (der.regime === "subamortiguado") {
    const w = der.omega!;
    return q0 * env * (Math.cos(w * t) + (gamma / w) * Math.sin(w * t));
  }
  if (der.regime === "critico") {
    return q0 * (1 + gamma * t) * env;
  }
  const lam = der.lambda!;
  return (
    (q0 / (2 * lam)) *
    env *
    ((gamma + lam) * Math.exp(lam * t) + (lam - gamma) * Math.exp(-lam * t))
  );
}

/** Solución analítica i(t) = dq/dt por régimen. */
export function current(t: number, params: RlcParams, d?: Derived): number {
  const der = d ?? derive(params);
  const { q0, gamma, omega0 } = der;
  const env = Math.exp(-gamma * t);

  if (der.regime === "subamortiguado") {
    const w = der.omega!;
    return -q0 * (omega0 * omega0 / w) * env * Math.sin(w * t);
  }
  if (der.regime === "critico") {
    return -q0 * gamma * gamma * t * env;
  }
  const lam = der.lambda!;
  return -((q0 * omega0 * omega0) / lam) * env * Math.sinh(lam * t);
}

/** Muestra q(t) e i(t) sobre `samples` puntos en [0, tMax]. */
export interface Sample {
  t: number;
  q: number;
  i: number;
}

export function sample(
  params: RlcParams,
  tMax: number,
  samples: number = 800
): Sample[] {
  const der = derive(params);
  const out: Sample[] = new Array(samples);
  for (let k = 0; k < samples; k++) {
    const t = (k / (samples - 1)) * tMax;
    out[k] = {
      t,
      q: charge(t, params, der),
      i: current(t, params, der),
    };
  }
  return out;
}

/**
 * Sugerencia de tMax que muestre la respuesta sin recortarla. Cubre
 * varias constantes de tiempo τ y, en el subamortiguado, varios periodos.
 */
export function suggestedTMax(d: Derived): number {
  if (d.regime === "subamortiguado") {
    // Hasta que la envolvente decaiga ≈ 1%
    const envWin = -Math.log(0.01) / d.gamma;
    const periods = (d.T ?? 0) * 4;
    return Math.max(envWin, periods);
  }
  // Régimen aperiódico — varios τ
  return 7 * d.tau;
}

/**
 * Integrador numérico RK4 de la EDO. Útil como referencia y, eventualmente,
 * para verificar contra la solución cerrada.
 */
export function integrateRK4(
  params: RlcParams,
  tMax: number,
  samples: number = 800
): Sample[] {
  const { L, C, R } = params;
  const der = derive(params);
  const h = tMax / (samples - 1);
  let q = der.q0;
  let i = 0;

  const rhs = (q_: number, i_: number) => {
    // dq/dt = i ; di/dt = -(R/L)·i - q/(LC)
    return [i_, -(R / L) * i_ - (1 / (L * C)) * q_];
  };

  const out: Sample[] = [{ t: 0, q, i }];
  for (let k = 1; k < samples; k++) {
    const t = k * h;
    const [k1q, k1i] = rhs(q, i);
    const [k2q, k2i] = rhs(q + (h / 2) * k1q, i + (h / 2) * k1i);
    const [k3q, k3i] = rhs(q + (h / 2) * k2q, i + (h / 2) * k2i);
    const [k4q, k4i] = rhs(q + h * k3q, i + h * k3i);
    q = q + (h / 6) * (k1q + 2 * k2q + 2 * k3q + k4q);
    i = i + (h / 6) * (k1i + 2 * k2i + 2 * k3i + k4i);
    out.push({ t, q, i });
  }
  return out;
}

/** Formatea un número en notación científica/ingenieril. */
export function fmt(value: number, digits: number = 4): string {
  if (!isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs < 1e-2 || abs >= 1e4) {
    const exp = Math.floor(Math.log10(abs));
    const mantissa = value / Math.pow(10, exp);
    return `${mantissa.toFixed(digits - 1)} × 10${superscript(exp)}`;
  }
  return value.toPrecision(digits);
}

function superscript(n: number): string {
  const map: Record<string, string> = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return n
    .toString()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
}

export const REGIME_LABEL: Record<Regime, string> = {
  subamortiguado: "Subamortiguado",
  critico: "Críticamente amortiguado",
  sobreamortiguado: "Sobreamortiguado",
};

export const REGIME_DESCRIPTION: Record<Regime, string> = {
  subamortiguado:
    "Oscilación amortiguada — la carga oscila mientras la envolvente exponencial la atenúa.",
  critico:
    "Retorno aperiódico en el mínimo tiempo posible, sin oscilación.",
  sobreamortiguado:
    "Descarga aperiódica lenta dominada por la raíz real de menor magnitud.",
};

export const REGIME_COLOR: Record<Regime, string> = {
  subamortiguado: "#fdba74",
  critico: "#f0abfc",
  sobreamortiguado: "#5eead4",
};

export const PRESETS: { name: string; params: RlcParams; note: string }[] = [
  {
    name: "Subamortiguado · Ciobanu 2023",
    params: { L: 0.375, C: 9e-5, R: 2, U: 5 },
    note: "Mismos valores que el caso amortiguado de Ciobanu et al. (2023).",
  },
  {
    name: "Críticamente amortiguado",
    params: { L: 0.375, C: 9e-5, R: 129.1, U: 5 },
    note: "R = R_crit = 2√(L/C) — frontera entre régimenes.",
  },
  {
    name: "Sobreamortiguado",
    params: { L: 0.375, C: 9e-5, R: 300, U: 5 },
    note: "R > R_crit — sin oscilación.",
  },
];
