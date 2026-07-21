import type { AIProvider, AIProviderConfig, GenerateOptions, GenerateResult } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract requiresApiKey: boolean;
  abstract supportedModels: string[];

  protected config: AIProviderConfig | null = null;

  get isConfigured(): boolean {
    return this.config !== null && this.config.enabled;
  }

  get isEnabled(): boolean {
    return this.config?.enabled ?? false;
  }

  async configure(config: AIProviderConfig): Promise<void> {
    this.config = config;
  }

  abstract test(): Promise<boolean>;
  abstract generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;

  async getModels(): Promise<string[]> {
    return this.supportedModels;
  }

  protected getDefaultOptions(): GenerateOptions {
    return {
      model: this.config?.model || this.supportedModels[0],
      temperature: this.config?.temperature ?? 0.7,
      maxTokens: this.config?.maxTokens ?? 2048,
    };
  }

  protected mergeOptions(options?: GenerateOptions): GenerateOptions {
    const defaults = this.getDefaultOptions();
    return {
      ...defaults,
      ...options,
    };
  }
}
