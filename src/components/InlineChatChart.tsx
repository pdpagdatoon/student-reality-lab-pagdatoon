import React from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface InlineChartPayload {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'comparison' | 'budget_gauge';
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
  data: Array<{ label: string; value: number; color?: string }>;
  unit?: string;
  budget?: number;
  xKey?: string;
  yKey?: string;
}

const COLORS = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
const AFFORDABLE_COLOR = '#14b8a6';
const OVER_BUDGET_COLOR = '#fb7185';

const getChartType = (payload: InlineChartPayload) => payload.chartType || payload.type;

const fallbackSvgChart = (data: InlineChartPayload['data'], unit: string) => {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <svg viewBox="0 0 320 220" className="chat-inline-chart-fallback" role="img" aria-label="Chart fallback view">
      {data.map((item, index) => {
        const barWidth = 320 / Math.max(data.length, 1) - 18;
        const x = 10 + index * (barWidth + 18);
        const height = (item.value / max) * 150;
        const y = 170 - height;
        return (
          <g key={`${item.label}-${index}`}>
            <rect x={x} y={y} width={barWidth} height={height} rx="8" fill={item.color || COLORS[index % COLORS.length]} />
            <text x={x + barWidth / 2} y={190} textAnchor="middle" fontSize="11" fill="#475569">{item.label}</text>
            <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize="11" fill="#0f172a">{unit}{item.value}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const InlineChatChart: React.FC<InlineChartPayload> = ({ type, title, data, unit = '$', budget }) => {
  const chartType = getChartType({ type, title, data, unit, budget });

  const copyData = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  let chartContent: React.ReactNode = null;

  if (chartType === 'bar' || chartType === 'comparison') {
    chartContent = (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${unit}${v}`} width={56} />
          <Tooltip formatter={(v) => [`${unit}${v}`, 'Cost']} />
          <Legend />
          <Bar dataKey="value" name="Value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`${entry.label}-${index}`}
                fill={budget != null ? (entry.value <= budget ? AFFORDABLE_COLOR : OVER_BUDGET_COLOR) : (entry.color || COLORS[index % COLORS.length])}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  } else if (chartType === 'line') {
    chartContent = (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${unit}${v}`} width={56} />
          <Tooltip formatter={(v) => [`${unit}${v}`, 'Cumulative cost']} />
          <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  } else if (chartType === 'pie') {
    chartContent = (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={82}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${unit}${v}`, 'Share']} />
        </PieChart>
      </ResponsiveContainer>
    );
  } else if (chartType === 'scatter') {
    chartContent = (
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 12, right: 12, bottom: 20, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="label" name="Budget" tick={{ fontSize: 11 }} tickFormatter={(v) => `${unit}${v}`} />
          <YAxis type="number" dataKey="value" name="Total cost" tick={{ fontSize: 11 }} tickFormatter={(v) => `${unit}${v}`} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v) => `${unit}${v}`} />
          <Scatter name="Destinations" data={data} fill="#14b8a6" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  } else if (chartType === 'budget_gauge') {
    const total = data[0]?.value ?? 0;
    const pct = budget ? Math.min((total / budget) * 100, 100) : 0;
    const isOver = budget != null && total > budget;
    chartContent = (
      <div className="chat-budget-gauge">
        <div className="gauge-track">
          <div className={`gauge-fill ${isOver ? 'gauge-fill--over' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="gauge-labels">
          <span>{unit}{total} estimated</span>
          <span>Budget: {unit}{budget}</span>
        </div>
        <p className={`gauge-verdict ${isOver ? 'gauge-verdict--over' : 'gauge-verdict--ok'}`}>
          {isOver ? `⚠️ $${total - (budget ?? 0)} over budget` : `✅ $${(budget ?? 0) - total} to spare`}
        </p>
      </div>
    );
  } else {
    chartContent = fallbackSvgChart(data, unit);
  }

  return (
    <div className="chat-inline-chart">
      {title ? <p className="chat-inline-chart-title">{title}</p> : null}
      {chartContent}
      <div className="chat-inline-chart-actions">
        <button type="button" className="chat-inline-chart-copy" onClick={copyData}>
          📋 Copy data
        </button>
      </div>
      {budget != null && (chartType === 'bar' || chartType === 'comparison') && (
        <p className="chat-inline-chart-legend">
          <span style={{ color: AFFORDABLE_COLOR }}>■ Within budget</span>
          <span style={{ color: OVER_BUDGET_COLOR }}>■ Over budget</span>
        </p>
      )}
    </div>
  );
};

export default InlineChatChart;
