import type { AIProvider, ProviderInfo } from '../types';
import { NativeProvider } from './native';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { GrokProvider } from './grok';
import { OpenRouterProvider } from './openrouter';

// Provider registry
const providers = new Map<string, AIProvider>();

// Register all providers
function registerProviders(): void {
  providers.set('native', new NativeProvider());
  providers.set('openai', new OpenAIProvider());
  providers.set('anthropic', new AnthropicProvider());
  providers.set('gemini', new GeminiProvider());
  providers.set('grok', new GrokProvider());
  providers.set('openrouter', new OpenRouterProvider());
}

// Initialize on module load
registerProviders();

// Public API
export function getProvider(id: string): AIProvider | undefined {
  return providers.get(id);
}

export function getAllProviders(): AIProvider[] {
  return Array.from(providers.values());
}

export function getEnabledProviders(): AIProvider[] {
  return getAllProviders().filter(p => p.isEnabled);
}

export function getActiveProvider(): AIProvider | undefined {
  return getAllProviders().find(p => p.isEnabled && p.isConfigured) || providers.get('native');
}

export function getProviderInfo(id: string): ProviderInfo | undefined {
  const provider = providers.get(id);
  if (!provider) return undefined;

  let status: 'active' | 'configured' | 'not-configured' | 'disabled' = 'not-configured';
  if (provider.isEnabled && provider.isConfigured) {
    status = 'configured';
  } else if (provider.isEnabled) {
    status = 'not-configured';
  }

  // Check if this is the active provider
  const active = getActiveProvider();
  if (active?.id === id) {
    status = 'active';
  }

  return {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    status,
    requiresApiKey: provider.requiresApiKey,
    supportedModels: provider.supportedModels,
  };
}

export function getAllProviderInfo(): ProviderInfo[] {
  return getAllProviders().map(p => getProviderInfo(p.id)!).filter(Boolean);
}

// Re-export types
export type { AIProvider, ProviderInfo } from '../types';
