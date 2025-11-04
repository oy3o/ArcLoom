import { NarrativeService, ImageService, BackendRepository } from '@/app';
import { AnyBackendConfig, isBackendPool } from '@/domain';
import { Gemini } from './gemini';
import { Open } from './openai';
import { RotatingImageService, RotatingNarrativeService } from './rotating';

const cachedTextModels: Map<string, Gemini> = new Map;
const cachedImageModels: Map<string, Gemini> = new Map;

/**
 * Creates an instance of a narrative service based on the provided backend configuration.
 * This factory can create a standard service for a single API key or a rotating
 * service for a pool of keys.
 *
 * @param config The backend configuration selected by the user.
 * @param repository A repository instance needed by rotating services to fetch underlying keys.
 * @returns An instance of a class that implements the `NarrativeService` interface.
 */
export function createNarrativeService(config: AnyBackendConfig, repository: BackendRepository): NarrativeService {
  if (isBackendPool(config)) {
    return new RotatingNarrativeService(config, repository);
  }

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
 * Creates an instance of an image service based on the provided backend configuration.
 * This factory can create a standard service for a single API key or a rotating
 * service for a pool of keys.
 *
 * @param config The backend configuration selected by the user.
 * @param repository A repository instance needed by rotating services to fetch underlying keys.
 * @returns An instance of a class that implements the `ImageService` interface, or null.
 */
export function createImageService(config: AnyBackendConfig, repository: BackendRepository): ImageService | null {
  if (isBackendPool(config)) {
    return new RotatingImageService(config, repository);
  }

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
