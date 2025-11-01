import { NarrativeService, ImageService } from '@/app';
import { BackendConfig } from '@/domain';
import { Gemini } from './gemini';
import { Open } from './openai';

const cachedTextModels: Map<string, Gemini> = new Map;
const cachedImageModels: Map<string, Gemini> = new Map;

/**
 * Creates an instance of a narrative service based on the provided backend configuration.
 * This acts as a factory, decoupling the application logic from the concrete
 * implementation of the AI services.
 * 
 * @param config The backend configuration selected by the user.
 * @returns An instance of a class that implements the NarrativeService interface.
 */
export function createNarrativeService(config: BackendConfig): NarrativeService {
  switch (config.provider) {
    case 'google':
      let model = cachedTextModels.get(config.apiKey)
      if (!model) {
        model = new Gemini(config)
        cachedTextModels.set(config.apiKey, model)
      }
      model.updateConfig(config)
      return model;

    case 'openai':
      return new Open(config);

    default:
      // This ensures that if we add a new provider to the type, we handle it here.
      const exhaustiveCheck: never = config.provider;
      throw new Error(`无法理解目标叙述者的语言: ${exhaustiveCheck}`);
  }
}

/**
 * Factory function to create an image service instance.
 * Note: This is a simplified factory for demonstration. In a larger app,
 * this might live in the `infra` layer as well.
 */
export function createImageService(config: BackendConfig): ImageService | null {
  switch (config.provider) {
    case 'google':
      let model = cachedImageModels.get(config.apiKey)
      if (!model) {
        model = new Gemini(config)
        cachedImageModels.set(config.apiKey, model)
      }
      model.updateConfig(config)
      return model;

    case 'openai':
      return new Open(config);

    default:
      // This ensures that if we add a new provider to the type, we handle it here.
      const exhaustiveCheck: never = config.provider;
      throw new Error(`无法理解目标回想者的语言: ${exhaustiveCheck}`);
  }
}
