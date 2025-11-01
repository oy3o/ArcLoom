import { GameState } from '@/domain';

export interface GameStateRepository {
  QuickSave(state: GameState): Promise<void>;
  QuickLoad(): Promise<GameState | null>;
  Export(state: GameState): Promise<void>;
  Import(): Promise<GameState | null>;
}