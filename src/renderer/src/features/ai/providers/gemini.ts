import { BaseAIProvider } from './base';
import type { GenerateOptions, GenerateResult } from '../types';

export class GeminiProvider extends BaseAIProvider {
  id = 'gemini';
  name = 'Gemini';
  description = 'Google Gemini models';
  requiresApiKey = true;
  supportedModels = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];

  async test(): Promise<boolean> {
    if (!this.config?.apiKey) return false;

    try {
      const model = this.config.model || this.supportedModels[0];
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${this.config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    if (!this.config?.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const mergedOptions = this.mergeOptions(options);
    const model = mergedOptions.model || this.supportedModels[0];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: mergedOptions.temperature,
            maxOutputTokens: mergedOptions.maxTokens,
          },
          ...(mergedOptions.systemPrompt ? {
            systemInstruction: { parts: [{ text: mergedOptions.systemPrompt }] },
          } : {}),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: model,
      tokens: {
        prompt: data.usageMetadata?.promptTokenCount || 0,
        completion: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }
}
