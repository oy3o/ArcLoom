export type BackendProvider = 'google' | 'openai';
export type GenerationType = 'text' | 'image';

export interface BackendConfig {
  id: string; // Unique ID, e.g., a timestamp or UUID
  name: string; // User-defined name, e.g., "My OpenAI Key"
  provider: BackendProvider;
  apiKey: string;
  generationType: GenerationType;
  
  // Provider-specific fields
  endpoint?: string; // For custom OpenAI-compatible endpoints
  modelId?: string; // For Google, the specific model like 'gemini-1.5-pro'
}
