import { useState, useCallback } from 'react';
import { generateText, isAIAvailable } from '../services/aiService';
import type { GenerateOptions } from '../types';

interface UseAIReturn {
  generate: (prompt: string, options?: GenerateOptions) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
  isAvailable: boolean;
  clearError: () => void;
}

export function useAI(): UseAIReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, options?: GenerateOptions): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateText(prompt, options);
      return result.text;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generate,
    isGenerating,
    error,
    isAvailable: isAIAvailable(),
    clearError,
  };
}
