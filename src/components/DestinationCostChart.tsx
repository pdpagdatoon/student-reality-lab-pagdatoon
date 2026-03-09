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
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={data} 
          onClick={(state) => {
            if (state && state.activePayload && state.activePayload[0]) {
              onSelectDestination(state.activePayload[0].payload.destination);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="destination" />
          <YAxis label={{ value: 'Total Trip Cost ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`$${value}`, 'Total Cost']} />
          <Bar dataKey="total_trip_cost">
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