import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { DestinationRecord } from '../lib/schema';

interface DistanceScatterProps {
  data: DestinationRecord[];
  selectedDestination?: string;
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

const DistanceScatter: React.FC<DistanceScatterProps> = ({ data, selectedDestination }) => {
  const selected = data.find((d) => d.destination === selectedDestination);
  return (
    <div className="chart">
      <h2>Does Closer Always Mean Cheaper?</h2>
      <p className="chart-copy">
        Each dot is a destination. Closer to Newark (left) isn't always cheaper — lodging cost is the real driver.
        Green = within budget, red = over budget under your current settings.
      </p>
      <div className="chart-legend" aria-label="Distance scatter legend">
        <span className="chart-legend-item"><span className="chart-swatch chart-swatch--ok" /> Within budget</span>
        <span className="chart-legend-item"><span className="chart-swatch chart-swatch--over" /> Over budget</span>
        <span className="chart-legend-item"><span className="chart-swatch chart-swatch--selected" /> Selected destination</span>
        {selected && <span className="chart-legend-item chart-legend-item--meta">Selected: {selected.destination}</span>}
      </div>
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
                stroke={entry.destination === selectedDestination ? '#0f172a' : 'transparent'}
                strokeWidth={entry.destination === selectedDestination ? 2 : 0}
                fillOpacity={entry.destination === selectedDestination ? 1 : 0.9}
              />
            ))}
            <LabelList dataKey="destination" position="top" style={{ fontSize: 11, fill: '#334155', fontWeight: 500 }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(DistanceScatter);