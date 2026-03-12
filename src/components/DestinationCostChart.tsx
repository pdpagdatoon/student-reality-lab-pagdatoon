import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DestinationRecord } from '../lib/schema';

interface DestinationCostChartProps {
  data: DestinationRecord[];
  onSelectDestination: (destination: string) => void;
}

const DestinationCostChart: React.FC<DestinationCostChartProps> = ({ data, onSelectDestination }) => {
  return (
    <div className="chart">
      <h2>Destination Cost Comparison</h2>
      <p style={{ color: '#64748b', marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        Total estimated trip cost for each destination under your current budget, trip length, and lodging settings.
        Teal bars are within budget; red bars exceed it. Click any bar to explore its cost breakdown.
      </p>
      <ResponsiveContainer width="100%" height={460}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 80 }}
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
          <Tooltip formatter={(value) => [`$${value}`, 'Total Cost']} />
          <Bar dataKey="total_trip_cost" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.affordability === 'affordable' ? '#14b8a6' : '#fb7185'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DestinationCostChart;