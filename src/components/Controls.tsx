import React from 'react';
import { UserControls } from '../lib/schema';

interface ControlsProps {
  controls: UserControls;
  onChange: (changes: Partial<UserControls>) => void;
}

const Controls: React.FC<ControlsProps> = ({ controls, onChange }) => {
  return (
    <div className="controls">
      <div className="control">
        <label htmlFor="budget">Budget ($)</label>
        <input
          id="budget"
          type="range"
          min="100"
          max="1000"
          value={controls.budget}
          onChange={(e) => onChange({ budget: Number(e.target.value) })}
        />
        <span>{controls.budget}</span>
      </div>
      <div className="control">
        <label htmlFor="tripLength">Trip Length (days)</label>
        <select
          id="tripLength"
          value={controls.tripLength}
          onChange={(e) => onChange({ tripLength: Number(e.target.value) })}
        >
          {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="control">
        <label htmlFor="lodgingMode">Lodging Mode</label>
        <select
          id="lodgingMode"
          value={controls.lodgingMode}
          onChange={(e) => onChange({ lodgingMode: Number(e.target.value) })}
        >
          <option value={1}>Solo (1 person)</option>
          <option value={2}>With 1 friend (2 total)</option>
          <option value={3}>With 2 friends (3 total)</option>
          <option value={4}>With 3 friends (4 total)</option>
        </select>
      </div>
    </div>
  );
};

export default Controls;