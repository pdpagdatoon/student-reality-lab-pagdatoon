export interface RawDestinationRow {
  destination: string;
  distance_miles: number;
  travel_cost: number;
  lodging_per_night: number;
  avg_food_per_day: number;
  activity_cost: number;
  known_for: string;
  about: string;
  attractions: string[];
  photo_url: string;
}

export interface DestinationRecord extends RawDestinationRow {
  total_trip_cost: number;
  total_trip_cost_low: number;
  total_trip_cost_high: number;
  affordability: 'affordable' | 'over-budget';
}

export interface UserControls {
  budget: number;
  tripLength: number;
  lodgingMode: number; // 1 = solo, 2 = split with 1 friend, 3 = split with 2 friends, 4 = split with 3 friends
  selectedDestination?: string;
}