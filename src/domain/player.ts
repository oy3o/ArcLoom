import { Power } from './power';
import { Item } from './item';

export interface Player {
  name: string;
  level: number;
  currentPower: Power | null;
  stats: Record<string, number>;
  inventory: Item[];
}
