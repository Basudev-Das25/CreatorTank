import { getActiveProvider, getProvider } from '../providers';
import type { GenerateOptions, GenerateResult, ProviderInfo } from '../types';

// AI Service - high-level interface for AI operations

export async function generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
  const provider = getActiveProvider();
  if (!provider) {
    throw new Error('No AI provider configured. Please enable a provider in Settings > AI Providers.');
  }

  if (!provider.isConfigured && provider.requiresApiKey) {
    throw new Error(`${provider.name} is not configured. Please add your API key in Settings > AI Providers.`);
  }

  return provider.generate(prompt, options);
}

export async function testProvider(providerId: string): Promise<boolean> {
  const provider = getProvider(providerId);
  if (!provider) return false;

  try {
    return await provider.test();
  } catch {
    return false;
  }
}

export async function getProviderModels(providerId: string): Promise<string[]> {
  const provider = getProvider(providerId);
  if (!provider) return [];

  try {
    return await provider.getModels();
  } catch {
    return provider.supportedModels;
  }
}

export function getActiveProviderInfo(): ProviderInfo | null {
  const provider = getActiveProvider();
  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    status: provider.isEnabled ? 'active' : 'disabled',
    requiresApiKey: provider.requiresApiKey,
    supportedModels: provider.supportedModels,
  };
}

export function isAIAvailable(): boolean {
  const provider = getActiveProvider();
  return provider !== undefined && provider.isConfigured;
}

// Future AI features can use these helpers
export async function rewriteScript(content: string, instruction: string): Promise<string> {
  const result = await generateText(
    `Rewrite the following script according to this instruction: "${instruction}"\n\nScript:\n${content}`,
    { systemPrompt: 'You are a professional script editor for content creators. Rewrite the script while maintaining its core message and improving based on the given instruction.' }
  );
  return result.text;
}

export async function generateTitle(content: string): Promise<string> {
  const result = await generateText(
    `Generate a compelling title for this content:\n\n${content.substring(0, 1000)}`,
    { systemPrompt: 'You are a content strategist. Generate a single, engaging title that would attract viewers.' }
  );
  return result.text.trim();
}

export async function generateDescription(content: string): Promise<string> {
  const result = await generateText(
    `Generate a YouTube video description for this content:\n\n${content.substring(0, 2000)}`,
    { systemPrompt: 'You are a YouTube content strategist. Write a compelling description with keywords for SEO.' }
  );
  return result.text;
}

export async function generateHashtags(content: string): Promise<string[]> {
  const result = await generateText(
    `Generate relevant hashtags for this content:\n\n${content.substring(0, 1000)}`,
    { systemPrompt: 'You are a social media expert. Generate 10-15 relevant hashtags, one per line, without the # symbol.' }
  );
  return result.text.split('\n').map(h => h.trim()).filter(h => h.length > 0);
}
