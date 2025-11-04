import { OpenAI } from 'openai';
import { AvailableModel } from '@/domain';

const textKeywords = ['gpt', 'davinci', 'babbage', 'text-embedding', 'instruct', 'codex', 'moderation', 'o1', 'o3', 'o4', 'command-a', 'command-r'];
const nonTextKeywords = ['image', 'audio', 'sora', 'tts', 'whisper', 'transcribe'];
const imageKeywords = ['dall-e', 'sora', 'image'];

/**
 * Fetches the list of available text-generation models from an OpenAI-compatible endpoint.
 * This also serves as a way to verify the API key and endpoint.
 * @param apiKey The API key to use for the request.
 * @param endpoint An optional custom endpoint URL.
 * @returns A promise that resolves to an array of available text models.
 */
export async function listAvailableOpenAITextModels(apiKey: string, endpoint?: string): Promise<AvailableModel[]> {
  try {
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: endpoint,
      dangerouslyAllowBrowser: true,
    });

    const response = await client.models.list().catch(() => {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: endpoint.replace("compatibility/", ''),
        dangerouslyAllowBrowser: true,
      });
      return client.models.list();
    });
    const allModels = [response.data, response.body, response.body?.data, response.body?.models].find(arr => {
      return Array.isArray(arr) && arr.length > 0;
    }) || [];

    // Filter for models that are likely for chat/text generation
    const supportedModels = allModels
      .filter(model => {
        const id = model.id || model.name;
        // 必须包含至少一个文本关键字
        const hasTextKeyword = textKeywords.some(keyword => id.includes(keyword));
        // 且不能包含任何非文本关键字
        const hasNonTextKeyword = nonTextKeywords.some(keyword => id.includes(keyword));
        return hasTextKeyword && !hasNonTextKeyword;
      })
      .map(model => ({
        id: model.id || model.name,
        name: model.id || model.name, // OpenAI models use their ID as the display name
      }));

    if (supportedModels.length === 0) {
      throw new Error("与以太之网的连接已断开");
    }

    // Sort to bring preferred models like GPT-4 to the top
    supportedModels.sort((a, b) => {
      return b.id.localeCompare(a.id); // Sort descending for newer versions
    });

    return supportedModels;

  } catch (error) {
    console.error("Failed to fetch available OpenAI models:", error);
    // Propagate a user-friendly error
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error("以太之网拒绝了你的请求");
      }
      if (error.status === 404) {
        throw new Error("无效的以太之网访问端点");
      }
    }
    throw new Error("与以太之网的连接已断开");
  }
}


/**
 * Fetches the list of available image-generation models from an OpenAI-compatible endpoint.
 */
export async function listAvailableOpenAIImageModels(apiKey: string, endpoint?: string): Promise<AvailableModel[]> {
  try {
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: endpoint,
      dangerouslyAllowBrowser: true,
    });

    const response = await client.models.list().catch(() => {
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: endpoint.replace("compatibility/", ''),
        dangerouslyAllowBrowser: true,
      });
      return client.models.list();
    });
    const allModels = [response.data, response.body, response.body?.data].find(arr => {
      return Array.isArray(arr) && arr.length > 0;
    }) || [];

    // Filter for models that are likely for chat/text generation
    const supportedModels = allModels
      .filter(model => {
        // 检查当前模型的 id 是否包含任何一个关键字
        return imageKeywords.some(keyword => model.id.includes(keyword));
      })
      .map(model => ({
        id: model.id,
        name: model.id, // OpenAI models use their ID as the display name
      }));

    if (supportedModels.length === 0) {
      throw new Error("与以太之网的连接已断开");
    }

    // Sort to bring preferred models like GPT-4 to the top
    supportedModels.sort((a, b) => {
      return b.id.localeCompare(a.id); // Sort descending for newer versions
    });

    return supportedModels;

  } catch (error) {
    console.error("Failed to fetch available OpenAI models:", error);
    // Propagate a user-friendly error
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error("以太之网拒绝了你的请求");
      }
      if (error.status === 404) {
        throw new Error("无效的以太之网访问端点");
      }
    }
    throw new Error("与以太之网的连接已断开");
  }
}
