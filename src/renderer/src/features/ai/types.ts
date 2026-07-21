// AI Provider Types

export interface AIProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  customEndpoint?: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerateResult {
  text: string;
  model: string;
  tokens?: {
    prompt: number;
    completion: number;
  };
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  isConfigured: boolean;
  isEnabled: boolean;
  requiresApiKey: boolean;
  supportedModels: string[];

  configure(config: AIProviderConfig): Promise<void>;
  test(): Promise<boolean>;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  getModels(): Promise<string[]>;
}

export type ProviderStatus = 'active' | 'configured' | 'not-configured' | 'disabled';

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  status: ProviderStatus;
  requiresApiKey: boolean;
  supportedModels: string[];
}
