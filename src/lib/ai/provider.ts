// ─── RecoverAI AI Provider Factory ──────────────────────────────────────────────
// Configurable AI provider selection via environment variables.

import type { AIProviderInterface } from '@/lib/types';
import { MockAIProvider } from '@/lib/ai/mock-provider';
import { GeminiAIProvider } from '@/lib/ai/gemini-provider';

let cachedProvider: AIProviderInterface | null = null;

export function getAIProvider(): AIProviderInterface {
  if (cachedProvider) return cachedProvider;

  const provider = process.env.AI_PROVIDER || 'mock';

  switch (provider) {
    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('[AIProvider] GEMINI_API_KEY not set, falling back to mock provider');
        cachedProvider = new MockAIProvider();
      } else {
        cachedProvider = new GeminiAIProvider(apiKey);
      }
      break;
    }
    case 'mock':
    default:
      cachedProvider = new MockAIProvider();
      break;
  }

  console.log(`[AIProvider] Using provider: ${cachedProvider.providerName}`);
  return cachedProvider;
}

export function resetAIProvider(): void {
  cachedProvider = null;
}
