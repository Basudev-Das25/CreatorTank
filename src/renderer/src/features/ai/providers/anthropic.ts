import { BaseAIProvider } from './base';
import type { GenerateOptions, GenerateResult } from '../types';

export class AnthropicProvider extends BaseAIProvider {
  id = 'anthropic';
  name = 'Claude';
  description = 'Anthropic Claude models';
  requiresApiKey = true;
  supportedModels = ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];

  async test(): Promise<boolean> {
    if (!this.config?.apiKey) return false;

    try {
      // Anthropic doesn't have a models endpoint, so we test with a minimal request
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model || this.supportedModels[0],
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return response.ok || response.status === 400; // 400 means auth works but request was minimal
    } catch {
      return false;
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    if (!this.config?.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const mergedOptions = this.mergeOptions(options);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: mergedOptions.model,
        max_tokens: mergedOptions.maxTokens,
        ...(mergedOptions.systemPrompt ? { system: mergedOptions.systemPrompt } : {}),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.content[0]?.text || '',
      model: data.model,
      tokens: {
        prompt: data.usage?.input_tokens || 0,
        completion: data.usage?.output_tokens || 0,
      },
    };
  }
}
