import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export function getModel() {
  const provider = process.env.LLM_PROVIDER ?? 'openai';

  if (provider === 'anthropic') {
    return anthropic(process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest');
  }
  return openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini');
}