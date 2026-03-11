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
        <p style={{ color: '#64748b' }}>
          Click any bar on the chart above to see photos, a description, and attractions for that destination.
        </p>
      </div>
    );
  }

  return (
    <div className="chart destination-info">
      <h2>About {selected.destination}</h2>

      <img
        className="destination-photo"
        src={selected.photo_url}
        alt={`${selected.destination}, New Jersey`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      <p className="destination-known-for">
        <span className="tag-label">Known for</span> {selected.known_for}
      </p>

      <p className="destination-about">{selected.about}</p>

      <h3 className="attractions-heading">Top Attractions</h3>
      <ul className="attractions-list">
        {selected.attractions.map((attraction, i) => (
          <li key={i} className="attraction-chip">{attraction}</li>
        ))}
      </ul>
    </div>
  );
};

export default DestinationInfo;