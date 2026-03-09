import React from 'react';
import { DestinationRecord, UserControls } from '../lib/schema';

interface AnnotationCalloutProps {
  cheapest: DestinationRecord | null;
  mostExpensive: DestinationRecord | null;
  controls: UserControls;
  data: DestinationRecord[];
}

const AnnotationCallout: React.FC<AnnotationCalloutProps> = ({ cheapest, mostExpensive, controls, data }) => {
  const affordableCount = data.filter(d => d.affordability === 'affordable').length;
  let message = '';

  if (affordableCount === 0) {
    message = `All destinations exceed your budget of $${controls.budget}. Try increasing your budget, shortening the trip, or sharing lodging costs.`;
  } else if (cheapest) {
    message = `The most affordable destination under your current settings is ${cheapest.destination} at $${cheapest.total_trip_cost}.`;
  } else {
    message = `With your current settings, ${affordableCount} destinations are affordable. The most expensive affordable one is ${mostExpensive?.destination} at $${mostExpensive?.total_trip_cost}.`;
  }

  return (
    <div className="annotation">
      <h3>Key Insight</h3>
      <p>{message}</p>
    </div>
  );
};

export default AnnotationCallout;