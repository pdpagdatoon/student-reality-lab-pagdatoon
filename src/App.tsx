import React, { useState, useMemo } from 'react';
import { loadData } from './lib/loadData';
import { enrichDestinationRecords } from './lib/transforms';
import { UserControls } from './lib/schema';
import Controls from './components/Controls';
import DestinationCostChart from './components/DestinationCostChart';
import CostBreakdown from './components/CostBreakdown';
import DistanceScatter from './components/DistanceScatter';
import DestinationInfo from './components/DestinationInfo';
import StoryText from './components/StoryText';
import AnnotationCallout from './components/AnnotationCallout';
import './index.css';

const App: React.FC = () => {
  const rawData = loadData();
  const [controls, setControls] = useState<UserControls>({
    budget: 500,
    tripLength: 3,
    lodgingMode: 1,
  });

  const enrichedData = useMemo(() => enrichDestinationRecords(rawData, controls), [rawData, controls]);

  const affordableDestinations = useMemo(
    () => enrichedData.filter((destination) => destination.affordability === 'affordable'),
    [enrichedData]
  );

  const cheapestAffordable = useMemo(() => {
    if (!affordableDestinations.length) {
      return null;
    }

    return affordableDestinations.reduce((cheapest, current) =>
      current.total_trip_cost < cheapest.total_trip_cost ? current : cheapest
    );
  }, [affordableDestinations]);

  const mostExpensiveAffordable = useMemo(() => {
    if (!affordableDestinations.length) {
      return null;
    }

    return affordableDestinations.reduce((mostExpensive, current) =>
      current.total_trip_cost > mostExpensive.total_trip_cost ? current : mostExpensive
    );
  }, [affordableDestinations]);

  const handleControlsChange = (newControls: Partial<UserControls>) => {
    setControls(prev => ({ ...prev, ...newControls }));
  };

  return (
    <div className="container">
      <h1>Spring Break on a Student Budget: New Jersey Edition</h1>
      <p className="claim">Most popular New Jersey shore destinations exceed a typical student travel budget unless the trip length is short or lodging costs are shared.</p>

      <Controls controls={controls} onChange={handleControlsChange} />

      <AnnotationCallout
        cheapest={cheapestAffordable}
        mostExpensive={mostExpensiveAffordable}
        controls={controls}
        data={enrichedData}
      />

      <DestinationCostChart data={enrichedData} onSelectDestination={(dest) => handleControlsChange({ selectedDestination: dest })} />

      <CostBreakdown data={enrichedData} selectedDestination={controls.selectedDestination} onSelectDestination={(dest) => handleControlsChange({ selectedDestination: dest })} controls={controls} />

      <DestinationInfo selectedDestination={controls.selectedDestination} data={enrichedData} />

      <DistanceScatter data={enrichedData} />

      <StoryText />
    </div>
  );
};

export default App;