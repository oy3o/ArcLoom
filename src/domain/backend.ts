export type BackendProvider = 'google' | 'openai';
export type GenerationType = 'text' | 'image';

/**
 * Represents a single, individual API key configuration.
 */
export interface BackendConfig {
  configType: 'single'
  id: string; // Unique ID, e.g., a timestamp or UUID
  name: string; // User-defined name, e.g., "My OpenAI Key"
  provider: BackendProvider;
  apiKey: string;
  generationType: GenerationType;
  
  // Provider-specific fields
  endpoint?: string; // For custom OpenAI-compatible endpoints
  modelId?: string; // For Google, the specific model like 'gemini-1.5-pro'
}

/**
 * Represents a pool of multiple API keys for rotation.
 */
export interface BackendPoolConfig {
  configType: 'pool'; // Distinguishes this from a single config
  id: string; // Unique ID for the pool
  name: string; // User-defined name, e.g., "Google Text Pool"
  provider: BackendProvider;
  generationType: GenerationType;
  backendIds: string[]; // An array of IDs of the BackendConfig objects in this pool
}

export type AnyBackendConfig = BackendConfig | BackendPoolConfig;
export const isBackendPool = (config: AnyBackendConfig): config is BackendPoolConfig => config.configType === 'pool';
