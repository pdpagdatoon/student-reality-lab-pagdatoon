import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DestinationRecord, UserControls } from '../lib/schema';
import { computeEffectiveLodging } from '../lib/transforms';

interface CostBreakdownProps {
  data: DestinationRecord[];
  selectedDestination?: string;
  onSelectDestination: (destination: string) => void;
  controls: UserControls;
}

const CostBreakdown: React.FC<CostBreakdownProps> = ({ data, selectedDestination, onSelectDestination, controls }) => {
  const selected = data.find(d => d.destination === selectedDestination);

  const breakdownData = selected ? [
    { name: 'Travel', cost: selected.travel_cost },
    { name: 'Lodging', cost: computeEffectiveLodging(selected.lodging_per_night, controls.lodgingMode) * Math.max(controls.tripLength - 1, 0) },
    { name: 'Food', cost: selected.avg_food_per_day * controls.tripLength },
    { name: 'Activity', cost: selected.activity_cost },
  ] : [];

  return (
    <div className="chart">
      <h2>Cost Breakdown</h2>
      <p style={{ color: '#64748b', marginTop: 0, marginBottom: 16, fontSize: 14 }}>
        How the total cost splits between travel, lodging, food, and activities for the selected destination.
        Lodging is adjusted by your group size setting.
      </p>
      {!selected && (
        <select onChange={(e) => onSelectDestination(e.target.value)} defaultValue="">
          <option value="" disabled>Select a destination</option>
          {data.map(d => <option key={d.destination} value={d.destination}>{d.destination}</option>)}
        </select>
      )}
      {selected && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={breakdownData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
            <Bar dataKey="cost" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CostBreakdown;