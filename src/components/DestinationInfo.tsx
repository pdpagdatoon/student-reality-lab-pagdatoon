import React from 'react';
import { DestinationRecord } from '../lib/schema';

interface DestinationInfoProps {
  selectedDestination?: string;
  data: DestinationRecord[];
}

const DestinationInfo: React.FC<DestinationInfoProps> = ({ selectedDestination, data }) => {
  const selected = data.find(d => d.destination === selectedDestination);

  if (!selected) {
    return (
      <div className="chart">
        <h2>Destination Information</h2>
        <p>Select a destination from the chart above to see what it's known for and its biggest attractions.</p>
      </div>
    );
  }

  return (
    <div className="chart">
      <h2>About {selected.destination}</h2>
      <p><strong>Known for:</strong> {selected.known_for}</p>
      <p><strong>Biggest attractions:</strong> {selected.attractions}</p>
    </div>
  );
};

export default DestinationInfo;