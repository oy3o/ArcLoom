import { GameStateRepository, BackendRepository } from '@/app'
import { GameState, AnyBackendConfig } from '@/domain';
import { importJson, exportJson } from '@/pkg/json-helpers';

export class LocalStorageRepository implements GameStateRepository, BackendRepository {
  private readonly QUICKSAVE_KEY = 'arcloom-quicksave';
  private readonly BACKENDS_KEY = 'arcloom-backends';

  private prepareStateForSave(state: GameState): object {
    // Strip runtime-only data like base64 image URLs before saving
    return {
      ...state,
      narrativeLog: state.narrativeLog.map(({ imageUrl, ...block }) => block),
      companions: state.companions.map(({ imageUrl, ...companion }) => companion),
    };
  }

  async QuickSave(state: GameState): Promise<void> {
    const stateToSave = this.prepareStateForSave(state);
    localStorage.setItem(this.QUICKSAVE_KEY, JSON.stringify(stateToSave));
    return Promise.resolve();
  }

  async QuickLoad(): Promise<GameState | null> {
    const savedData = localStorage.getItem(this.QUICKSAVE_KEY);
    if (!savedData) {
      return Promise.resolve(null);
    }
    try {
      return Promise.resolve(JSON.parse(savedData) as GameState);
    } catch (e) {
      console.error("Failed to parse quicksave data:", e);
      return Promise.reject(new Error("世界线已遗失"));
    }
  }

  async Export(state: GameState): Promise<void> {
    const getBaseName = () => {
      const powerSystem = state.world.lore.find(item => item.type === 'Power');
      if (powerSystem?.title) {
        const parts = powerSystem.title.split(/:|：|\(|（/);
        const name = (parts.length > 1 ? parts[1] : parts[0]).trim();
        if (name.length > 1) return name;
      }
      return state.setup.genre !== '随机' ? state.setup.genre : '时空标记';
    };
    const baseName = getBaseName();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${baseName}-${timestamp}.json`;

    const stateToSave = this.prepareStateForSave(state);
    exportJson(stateToSave, filename);
    return Promise.resolve();
  }

  async Import(): Promise<GameState | null> {
    try {
      const loadedState = await importJson<GameState>();
      // Basic validation
      if (loadedState && loadedState.player && loadedState.world) {
        return loadedState;
      }
      throw new Error("标记可能被邪神污染");
    } catch (err) {
      // Propagate error to be handled by the UI layer
      throw err;
    }
  }

  async GetAll(): Promise<AnyBackendConfig[]> {
    const data = localStorage.getItem(this.BACKENDS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async Add(config: AnyBackendConfig): Promise<void> {
    const allConfigs = await this.GetAll();
    // Prevent duplicates by checking for existing ID or a uniquely identifying combination
    if (allConfigs.some(c => c.id === config.id)) {
      // In case of duplication, overwrite with a new name if needed
      if (config.configType === 'pool') {
        throw new Error(`Backend Pool with ID ${config.id} already exists.`);
      }
      // For single configs from duplication, we allow this to proceed.
    }

    const updatedConfigs = [...allConfigs.filter(c => c.id !== config.id), config];
    localStorage.setItem(this.BACKENDS_KEY, JSON.stringify(updatedConfigs));
  }

  async Remove(id: string): Promise<void> {
    let allConfigs = await this.GetAll();
    // Also remove this ID from any pools that might contain it
    allConfigs.forEach(c => {
      if (c.configType === 'pool' && c.backendIds.includes(id)) {
        c.backendIds = c.backendIds.filter(bid => bid !== id);
      }
    });
    const updatedConfigs = allConfigs.filter(c => c.id !== id);
    localStorage.setItem(this.BACKENDS_KEY, JSON.stringify(updatedConfigs));
  }

  async Update(config: AnyBackendConfig): Promise<void> {
    const allConfigs = await this.GetAll();
    const index = allConfigs.findIndex(c => c.id === config.id);
    if (index === -1) {
      // If not found, treat it as an Add operation
      const updatedConfigs = [...allConfigs, config];
      localStorage.setItem(this.BACKENDS_KEY, JSON.stringify(updatedConfigs));
    } else {
      allConfigs[index] = config;
      localStorage.setItem(this.BACKENDS_KEY, JSON.stringify(allConfigs));
    }
  }

  async GetById(id: string): Promise<AnyBackendConfig | null> {
    const allConfigs = await this.GetAll();
    return allConfigs.find(c => c.id === id) || null;
  }
}
