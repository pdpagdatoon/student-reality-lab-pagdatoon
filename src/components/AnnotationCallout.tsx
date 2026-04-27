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
    message = `All 10 destinations exceed your $${controls.budget} budget. Try increasing your budget, shortening the trip, or sharing lodging costs with friends.`;
  } else if (affordableCount === 1 && cheapest) {
    message = `Only ${cheapest.destination} fits your budget at $${cheapest.total_trip_cost}. Split lodging or add a day to see more options.`;
  } else if (cheapest && mostExpensive) {
    message = `${affordableCount} of 10 destinations fit your $${controls.budget} budget — from ${cheapest.destination} ($${cheapest.total_trip_cost}) up to ${mostExpensive.destination} ($${mostExpensive.total_trip_cost}).`;
  } else {
    message = `${affordableCount} of 10 destinations are affordable under your current settings.`;
  }

  return (
    <div className="annotation">
      <h3>Key Insight</h3>
      <p>{message}</p>
    </div>
  );
};

export default AnnotationCallout;