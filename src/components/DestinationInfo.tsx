import React from 'react';
import { DestinationRecord } from '../lib/schema';
import { getFallbackImageDataUrl } from '../lib/imageFallback';
import { getDestinationBackupImage, getDestinationPrimaryImage } from '../lib/destinationImages';
import { DESTINATION_LOCATION_META, buildGoogleMapsEmbedUrl, buildGoogleMapsOpenUrl } from '../lib/locationMeta';

interface DestinationInfoProps {
  selectedDestination?: string;
  data: DestinationRecord[];
}

const DestinationInfo: React.FC<DestinationInfoProps> = ({ selectedDestination, data }) => {
  const selected = data.find(d => d.destination === selectedDestination);
  const locationMeta = selected ? DESTINATION_LOCATION_META[selected.destination] : undefined;

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
        src={getDestinationPrimaryImage(selected.destination)}
        alt={`${selected.destination}, New Jersey`}
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.backupApplied) {
            img.dataset.backupApplied = '1';
            img.src = getDestinationBackupImage(selected.destination);
            return;
          }
          img.src = getFallbackImageDataUrl(selected.destination);
        }}
      />

      <p className="destination-known-for">
        <span className="tag-label">Known for</span> {selected.known_for}
      </p>

      <p className="destination-about">{selected.about}</p>

      {locationMeta && (
        <div className="destination-map-wrap">
          <h3 className="attractions-heading">Map Location</h3>
          <iframe
            className="destination-map"
            title={`${selected.destination} map`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={buildGoogleMapsEmbedUrl(locationMeta)}
          />
          <p className="destination-map-meta">
            Coordinates: {locationMeta.latitude.toFixed(4)}, {locationMeta.longitude.toFixed(4)} ·{' '}
            <a href={buildGoogleMapsOpenUrl(locationMeta)} target="_blank" rel="noopener noreferrer">
              Open in Google Maps
            </a>
          </p>
        </div>
      )}

      <h3 className="attractions-heading">Top Attractions</h3>
      <ul className="attractions-list">
        {selected.attractions.map((attraction, i) => (
          <li key={i} className="attraction-chip">{attraction}</li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(DestinationInfo);