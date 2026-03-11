import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { DestinationRecord } from '../lib/schema';

interface DistanceScatterProps {
  data: DestinationRecord[];
}

// Custom tooltip showing destination name and both values
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: DestinationRecord }[] }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <strong>{d.destination}</strong>
        <div>Distance: {d.distance_miles} miles from Newark</div>
        <div>Total cost: ${d.total_trip_cost.toFixed(0)}</div>
        <div style={{ color: d.affordability === 'affordable' ? '#14b8a6' : '#fb7185', fontWeight: 600 }}>
          {d.affordability === 'affordable' ? '✓ Within budget' : '✗ Over budget'}
        </div>
      </div>
    );
  }
  return null;
};

const DistanceScatter: React.FC<DistanceScatterProps> = ({ data }) => {
  return (
    <div className="chart">
      <h2>Does Closer Always Mean Cheaper?</h2>
      <p style={{ color: '#64748b', marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        Each dot is a destination. Closer to Newark (left) isn't always cheaper — lodging cost is the real driver.
        Green = within budget, red = over budget under your current settings.
      </p>
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="distance_miles"
            name="Distance"
            label={{ value: 'Distance from Newark (miles)', position: 'insideBottom', offset: -20, fill: '#475569' }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="total_trip_cost"
            name="Total Cost"
            label={{ value: 'Total Trip Cost ($)', angle: -90, position: 'insideLeft', offset: 10, fill: '#475569' }}
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Destinations" data={data} fill="#06b6d4">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.affordability === 'affordable' ? '#14b8a6' : '#fb7185'}
              />
            ))}
            <LabelList dataKey="destination" position="top" style={{ fontSize: 11, fill: '#334155', fontWeight: 500 }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistanceScatter;