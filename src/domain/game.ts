import { Player } from './player';
import { Companion } from './companion';
import { WorldLoreItem, MainQuest } from './world';
import { NarrativeBlock, PlayerChoice } from './narrative';

// --- Setup & Config Types ---

export interface AvailableModel {
  id: string;
  displayName: string;
}

export type GameGenre = '随机' | '玄幻' | '奇幻' | '修仙' | '游戏' | '悬疑';
export type GameEra = '随机' | '现代' | '古代' | '未来' | '近现代' | '近未来';
export type ProtagonistGender = '随机' | '男性' | '女性' | '无性别生物';
export type RomanceType = '随机' | '无女主' | '单女主' | '多女主';

export interface GameSetupOptions {
  modelId: string;
  imageModelId: string;
  isImageGenerationEnabled: boolean;
  genre: GameGenre;
  era: GameEra;
  gender: ProtagonistGender;
  romance: RomanceType;
}

// --- Core GameState ---

export interface GameState {
  player: Player;
  companions: Companion[];
  world: {
    location: string;
    time: string;
    lore: WorldLoreItem[];
    mainQuests: MainQuest[];
    playerStatsSchema: { name: string; description: string; }[];
  };
  narrativeLog: NarrativeBlock[];
  currentChoices: PlayerChoice[];
  setup: GameSetupOptions;
}
// --- Initial State Constant ---

export const INITIAL_GAME_STATE: GameState = {
  player: {
    name: '',
    level: 1,
    currentPower: null,
    stats: {
      "力量": 10,
      "敏捷": 10,
      "智力": 10,
      "精神": 10,
    },
    inventory: [],
  },
  companions: [],
  world: {
    location: '未知',
    time: '时代未定',
    lore: [],
    mainQuests: [],
    playerStatsSchema: [],
  },
  narrativeLog: [],
  currentChoices: [],
  setup: {
    modelId: '',//'models/gemini-pro-latest',
    imageModelId: '',//'imagen-4.0-ultra-generate-001',
    isImageGenerationEnabled: true,
    genre: '随机',
    era: '随机',
    gender: '随机',
    romance: '随机',
  }
};
