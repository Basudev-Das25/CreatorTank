import { BaseAIProvider } from './base';
import type { GenerateOptions, GenerateResult } from '../types';

export class GrokProvider extends BaseAIProvider {
  id = 'grok';
  name = 'Grok';
  description = 'xAI Grok models';
  requiresApiKey = true;
  supportedModels = ['grok-2', 'grok-2-mini'];

  async test(): Promise<boolean> {
    if (!this.config?.apiKey) return false;

    try {
      const response = await fetch('https://api.x.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    if (!this.config?.apiKey) {
      throw new Error('Grok API key not configured');
    }

    const mergedOptions = this.mergeOptions(options);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: mergedOptions.model,
        messages: [
          ...(mergedOptions.systemPrompt ? [{ role: 'system', content: mergedOptions.systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Grok API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      model: data.model,
      tokens: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
      },
    };
  }
}
