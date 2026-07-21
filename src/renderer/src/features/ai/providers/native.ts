import { BaseAIProvider } from './base';
import type { GenerateOptions, GenerateResult } from '../types';

export class NativeProvider extends BaseAIProvider {
  id = 'native';
  name = 'Native';
  description = 'Built-in AI provider — works offline with no configuration required';
  requiresApiKey = false;
  supportedModels = ['local-model'];

  async test(): Promise<boolean> {
    // Native provider is always available
    return true;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    // Native provider stub — returns a placeholder response
    // In production, this would use a local model (e.g., via onnxruntime, transformers.js)
    const mergedOptions = this.mergeOptions(options);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      text: `[Native AI] This is a placeholder response. Configure an external AI provider (OpenAI, Claude, Gemini, etc.) for actual AI-powered features. Your prompt was: "${prompt.substring(0, 100)}..."`,
      model: mergedOptions.model || 'local-model',
      tokens: {
        prompt: prompt.split(/\s+/).length,
        completion: 20,
      },
    };
  }
}
