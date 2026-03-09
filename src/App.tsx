import React, { useState, useMemo } from 'react';
import { loadData } from './lib/loadData';
import { enrichDestinationRecords, findCheapestDestination, findMostExpensiveDestination } from './lib/transforms';
import { UserControls } from './lib/schema';
import Controls from './components/Controls';
import DestinationCostChart from './components/DestinationCostChart';
import CostBreakdown from './components/CostBreakdown';
import DistanceScatter from './components/DistanceScatter';
import AnnotationCallout from './components/AnnotationCallout';
import DestinationInfo from './components/DestinationInfo';
import StoryText from './components/StoryText';
import './index.css';

const App: React.FC = () => {
  const rawData = loadData();
  const [controls, setControls] = useState<UserControls>({
    budget: 500,
    tripLength: 3,
    lodgingMode: 1,
  });

  const enrichedData = useMemo(() => enrichDestinationRecords(rawData, controls), [rawData, controls]);

  const cheapest = findCheapestDestination(enrichedData);
  const mostExpensive = findMostExpensiveDestination(enrichedData);

  const handleControlsChange = (newControls: Partial<UserControls>) => {
    setControls(prev => ({ ...prev, ...newControls }));
  };

  return (
    <div className="container">
      <h1>Spring Break on a Student Budget: New Jersey Edition</h1>
      <p className="claim">Most popular New Jersey shore destinations exceed a typical student travel budget unless the trip length is short or lodging costs are shared.</p>

      <Controls controls={controls} onChange={handleControlsChange} />

      <AnnotationCallout cheapest={cheapest} mostExpensive={mostExpensive} controls={controls} data={enrichedData} />

      <DestinationCostChart data={enrichedData} onSelectDestination={(dest) => handleControlsChange({ selectedDestination: dest })} />

      <CostBreakdown data={enrichedData} selectedDestination={controls.selectedDestination} onSelectDestination={(dest) => handleControlsChange({ selectedDestination: dest })} controls={controls} />

      <DestinationInfo selectedDestination={controls.selectedDestination} data={enrichedData} />

      <DistanceScatter data={enrichedData} />

      <StoryText />
    </div>
  );
};

export default App;