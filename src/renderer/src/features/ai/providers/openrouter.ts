import { BaseAIProvider } from './base';
import type { GenerateOptions, GenerateResult } from '../types';

export class OpenRouterProvider extends BaseAIProvider {
  id = 'openrouter';
  name = 'OpenRouter';
  description = 'Access multiple AI models through OpenRouter';
  requiresApiKey = true;
  supportedModels = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'anthropic/claude-sonnet-4-20250514',
    'anthropic/claude-3-haiku-20240307',
    'google/gemini-2.0-flash-001',
    'meta-llama/llama-3.1-405b-instruct',
  ];

  async test(): Promise<boolean> {
    if (!this.config?.apiKey) return false;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
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
      throw new Error('OpenRouter API key not configured');
    }

    const mergedOptions = this.mergeOptions(options);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://creatortank.app',
        'X-Title': 'CreatorTank',
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
      throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
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
