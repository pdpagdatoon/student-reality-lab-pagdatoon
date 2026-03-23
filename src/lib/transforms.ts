import { RawDestinationRow, DestinationRecord, UserControls } from './schema';

const ESTIMATE_BAND_PCT = 0.12;

export const computeEffectiveLodging = (lodgingPerNight: number, lodgingMode: number): number => {
  return lodgingPerNight / lodgingMode;
};

export const computeTotalTripCost = (
  travelCost: number,
  effectiveLodging: number,
  foodPerDay: number,
  activityCost: number,
  tripLength: number
): number => {
  const days = tripLength;
  const nights = Math.max(days - 1, 0);
  return travelCost + (effectiveLodging * nights) + (foodPerDay * days) + activityCost;
};

export const computeAffordability = (totalCost: number, budget: number): 'affordable' | 'over-budget' => {
  return totalCost <= budget ? 'affordable' : 'over-budget';
};

export const enrichDestinationRecords = (rawData: RawDestinationRow[], controls: UserControls): DestinationRecord[] => {
  return rawData.map(row => {
    const effectiveLodging = computeEffectiveLodging(row.lodging_per_night, controls.lodgingMode);
    const totalTripCost = computeTotalTripCost(
      row.travel_cost,
      effectiveLodging,
      row.avg_food_per_day,
      row.activity_cost,
      controls.tripLength
    );
    const affordability = computeAffordability(totalTripCost, controls.budget);
    const totalLow = Math.round(totalTripCost * (1 - ESTIMATE_BAND_PCT));
    const totalHigh = Math.round(totalTripCost * (1 + ESTIMATE_BAND_PCT));
    return {
      ...row,
      total_trip_cost: totalTripCost,
      total_trip_cost_low: totalLow,
      total_trip_cost_high: totalHigh,
      affordability
    };
  });
};

export const findCheapestDestination = (records: DestinationRecord[]): DestinationRecord | null => {
  if (records.length === 0) return null;
  return records.reduce((min, curr) => curr.total_trip_cost < min.total_trip_cost ? curr : min);
};

export const findMostExpensiveDestination = (records: DestinationRecord[]): DestinationRecord | null => {
  if (records.length === 0) return null;
  return records.reduce((max, curr) => curr.total_trip_cost > max.total_trip_cost ? curr : max);
};