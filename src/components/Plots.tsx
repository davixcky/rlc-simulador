import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type Derived, type Sample, REGIME_COLOR, fmt } from "../lib/rlc";

const qFormatter = (value: unknown): [string, string] => [
  `${fmt(Number(value))} C`,
  "q(t)",
];
const iFormatter = (value: unknown): [string, string] => [
  `${fmt(Number(value))} A`,
  "i(t)",
];

interface Props {
  data: Sample[];
  derived: Derived;
}

export function ChargePlot({ data, derived }: Props) {
  const color = REGIME_COLOR[derived.regime];
  return (
    <PlotShell title="Carga q(t)" subtitle="C — Coulomb" color={color}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 24 }}>
          <defs>
            <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#3f3f46" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => fmt(v, 2)}
            stroke="#78716c"
            fontSize={11}
            label={{
              value: "t (s)",
              position: "insideBottom",
              offset: -8,
              fill: "#a8a29e",
              fontSize: 12,
            }}
          />
          <YAxis
            stroke="#78716c"
            fontSize={11}
            tickFormatter={(v) => fmt(v, 2)}
            label={{
              value: "q (C)",
              angle: -90,
              position: "insideLeft",
              fill: "#a8a29e",
              fontSize: 12,
            }}
          />
          <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 4" />
          <Tooltip
            contentStyle={{
              background: "rgba(12,10,9,0.95)",
              border: "1px solid #44403c",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            labelFormatter={(v) => `t = ${fmt(v as number)} s`}
            formatter={qFormatter}
          />
          <Line
            type="monotone"
            dataKey="q"
            stroke="url(#qGrad)"
            strokeWidth={2.2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </PlotShell>
  );
}

export function CurrentPlot({ data, derived }: Props) {
  const color = REGIME_COLOR[derived.regime];
  return (
    <PlotShell title="Corriente i(t)" subtitle="A — Ampere" color={color}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 24 }}>
          <CartesianGrid stroke="#3f3f46" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => fmt(v, 2)}
            stroke="#78716c"
            fontSize={11}
            label={{
              value: "t (s)",
              position: "insideBottom",
              offset: -8,
              fill: "#a8a29e",
              fontSize: 12,
            }}
          />
          <YAxis
            stroke="#78716c"
            fontSize={11}
            tickFormatter={(v) => fmt(v, 2)}
            label={{
              value: "i (A)",
              angle: -90,
              position: "insideLeft",
              fill: "#a8a29e",
              fontSize: 12,
            }}
          />
          <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 4" />
          <Tooltip
            contentStyle={{
              background: "rgba(12,10,9,0.95)",
              border: "1px solid #44403c",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            labelFormatter={(v) => `t = ${fmt(v as number)} s`}
            formatter={iFormatter}
          />
          <Line
            type="monotone"
            dataKey="i"
            stroke="#fb7185"
            strokeWidth={2.2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </PlotShell>
  );
}

function PlotShell({
  title,
  subtitle,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-stone-900/60 ring-1 ring-stone-700/50 backdrop-blur-sm p-4 flex flex-col">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div
            className="text-xs uppercase tracking-widest font-mono"
            style={{ color }}
          >
            {subtitle}
          </div>
          <h3 className="text-base font-bold text-stone-100">{title}</h3>
        </div>
      </div>
      <div className="w-full h-[320px]">{children}</div>
    </div>
  );
}
