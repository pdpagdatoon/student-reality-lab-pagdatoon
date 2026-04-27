import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

export interface InlineChartPayload {
  type: 'bar' | 'pie' | 'comparison' | 'budget_gauge';
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  unit?: string;
  budget?: number;
}

const COLORS = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
const AFFORDABLE_COLOR = '#14b8a6';
const OVER_BUDGET_COLOR = '#fb7185';

export const InlineChatChart: React.FC<InlineChartPayload> = ({ type, title, data, unit = '$', budget }) => {
  if (type === 'bar' || type === 'comparison') {
    return (
      <div className="chat-inline-chart">
        <p className="chat-inline-chart-title">{title}</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${unit}${v}`} width={45} />
            <Tooltip formatter={(v) => [`${unit}${v}`, '']} />
            <Bar dataKey="value" radius={[3,3,0,0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={budget != null ? (entry.value <= (budget as number) ? AFFORDABLE_COLOR : OVER_BUDGET_COLOR) : (entry.color || COLORS[i % COLORS.length])} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {budget != null && (
          <p className="chat-inline-chart-legend">
            <span style={{ color: AFFORDABLE_COLOR }}>■ Within budget</span>
            &nbsp;&nbsp;
            <span style={{ color: OVER_BUDGET_COLOR }}>■ Over budget</span>
          </p>
        )}
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className="chat-inline-chart">
        <p className="chat-inline-chart-title">{title}</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${unit}${v}`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'budget_gauge') {
    const total = data[0]?.value ?? 0;
    const pct = budget ? Math.min((total / budget) * 100, 100) : 0;
    const isOver = budget != null && total > budget;
    return (
      <div className="chat-inline-chart chat-budget-gauge">
        <p className="chat-inline-chart-title">{title}</p>
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
  }

  return null;
};

export default InlineChatChart;
