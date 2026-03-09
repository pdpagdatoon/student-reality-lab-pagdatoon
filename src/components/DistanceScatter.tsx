import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DestinationRecord } from '../lib/schema';

interface DistanceScatterProps {
  data: DestinationRecord[];
}

const DistanceScatter: React.FC<DistanceScatterProps> = ({ data }) => {
  return (
    <div className="chart">
      <h2>Distance vs Cost</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={data}>
          <CartesianGrid />
          <XAxis type="number" dataKey="distance_miles" name="Distance (miles)" />
          <YAxis type="number" dataKey="total_trip_cost" name="Total Cost ($)" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [`$${value}`, name]} />
          <Scatter name="Destinations" dataKey="total_trip_cost" fill="#06b6d4" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistanceScatter;