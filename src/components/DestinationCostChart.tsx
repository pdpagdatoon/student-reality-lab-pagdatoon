import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DestinationRecord } from '../lib/schema';

interface DestinationCostChartProps {
  data: DestinationRecord[];
  onSelectDestination: (destination: string) => void;
  selectedDestination?: string;
}

const DestinationCostChart: React.FC<DestinationCostChartProps> = ({ data, onSelectDestination, selectedDestination }) => {
  const affordableCount = data.filter((entry) => entry.affordability === 'affordable').length;
  return (
    <div className="chart">
      <h2>Destination Cost Comparison</h2>
      <p className="chart-copy">
        Total estimated trip cost for each destination under your current budget, trip length, and lodging settings.
        Teal bars are within budget; red bars exceed it. Click any bar to explore its cost breakdown.
      </p>
      <div className="chart-legend" aria-label="Cost chart legend">
        <span className="chart-legend-item"><span className="chart-swatch chart-swatch--ok" /> Within budget</span>
        <span className="chart-legend-item"><span className="chart-swatch chart-swatch--over" /> Over budget</span>
        <span className="chart-legend-item"><span className="chart-swatch chart-swatch--selected" /> Selected destination</span>
        <span className="chart-legend-item chart-legend-item--meta">{affordableCount} affordable destination{affordableCount === 1 ? '' : 's'}</span>
      </div>
      <ResponsiveContainer width="100%" height={460}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 96 }}
          onClick={(state) => {
            if (state && state.activePayload && state.activePayload[0]) {
              onSelectDestination(state.activePayload[0].payload.destination);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="destination"
            angle={-40}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 12, fill: '#334155' }}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            label={{ value: 'Total Trip Cost ($)', angle: -90, position: 'insideLeft', offset: 10, fill: '#475569' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, _name, payload) => {
              const row = payload?.payload as DestinationRecord | undefined;
              if (!row) return [`$${value}`, 'Total Cost'];
              return [
                `$${row.total_trip_cost} (range: $${row.total_trip_cost_low}-$${row.total_trip_cost_high})`,
                'Estimated Total',
              ];
            }}
          />
          <Bar dataKey="total_trip_cost" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.affordability === 'affordable' ? '#14b8a6' : '#fb7185'}
                stroke={entry.destination === selectedDestination ? '#0f172a' : 'transparent'}
                strokeWidth={entry.destination === selectedDestination ? 2 : 0}
                fillOpacity={entry.destination === selectedDestination ? 1 : 0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(DestinationCostChart);