import { GoogleGenAI, Pager, Model } from '@google/genai';
import { AvailableModel } from '@/domain';

let cachedTextModels: Map<string, AvailableModel[] | null> = new Map;
let cachedImageModels: Map<string, AvailableModel[] | null> = new Map;
let loadings: Map<string, Promise<Pager<Model>>> = new Map;

/**
 * Fetches the list of available text-generation models for a given Google AI API key.
 * @param apiKey The Gemini API key to use for the request.
 * @returns A promise that resolves to an array of available text models.
 */
export async function listAvailableTextModels(apiKey: string): Promise<AvailableModel[]> {
  const cached = cachedTextModels.get(apiKey)
  if (cached) return cached

  try {
    let loading = loadings.get(apiKey)
    if (!loading){
      const ai = new GoogleGenAI({ apiKey });
      loading = ai.models.list({config: {pageSize: 100}});
      loadings.set(apiKey, loading)
    }
    const modelListResponse = await loading
    console.log(modelListResponse.page)
    const supportedModels: AvailableModel[] = [];
    for (const model of modelListResponse.page) {
      if (model.supportedActions.includes("generateContent")) {
        supportedModels.push({
          id: model.name,
          name: model.displayName,
        });
      }
    }

    // Sort preferred models to the top
    supportedModels.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    cachedTextModels.set(apiKey, supportedModels)

    return supportedModels;
  } catch (error) {
    console.error("Failed to fetch available text models:", error);
    // Propagate a user-friendly error
    throw new Error("与以太之网的连接已断开");
  }
}

/**
 * Fetches the list of available image-generation models for a given Google AI API key.
 * @param apiKey The Gemini API key to use for the request.
 * @returns A promise that resolves to an array of available image models.
 */
export async function listAvailableImageModels(apiKey: string): Promise<AvailableModel[]> {
  const cached = cachedImageModels.get(apiKey)
  if (cached) return cached

  try {
    let loading = loadings.get(apiKey)
    if (!loading){
      const ai = new GoogleGenAI({ apiKey });
      loading = ai.models.list({config: {pageSize: 100}});
      loadings.set(apiKey, loading)
    }
    const modelListResponse = await loading

    const supportedModels: AvailableModel[] = [];
    for (const model of modelListResponse.page) {
      // Note: Image models often use the "predict" action
      if (model.supportedActions.includes("predict")) {
        supportedModels.push({
          id: model.name,
          name: model.displayName,
        });
      }
    }

    // Sort preferred models to the top
    supportedModels.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    cachedImageModels.set(apiKey, supportedModels)

    return supportedModels;
  } catch (error) {
    console.error("Failed to fetch available image models:", error);
    throw new Error("与以太之网的连接已断开");
  }
}
