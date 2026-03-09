import data from '../../data/processed.json';
import { RawDestinationRow } from './schema';

export const loadData = (): RawDestinationRow[] => {
  return data as RawDestinationRow[];
};