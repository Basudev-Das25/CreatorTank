import { BaseAIProvider } from './base';
import type { GenerateOptions, GenerateResult } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  id = 'openai';
  name = 'OpenAI';
  description = 'GPT-4, GPT-4o, and other OpenAI models';
  requiresApiKey = true;
  supportedModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];

  async test(): Promise<boolean> {
    if (!this.config?.apiKey) return false;

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
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
      throw new Error('OpenAI API key not configured');
    }

    const mergedOptions = this.mergeOptions(options);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
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
