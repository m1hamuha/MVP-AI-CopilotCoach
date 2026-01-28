import { streamText, convertToCoreMessages, type UIMessage } from 'ai';
import { getModel } from '@/lib/llm';
import { buildSystemPrompt } from '@/lib/prompt';
import { requireUser } from '@/lib/auth';
import { rateLimitOrThrow } from '@/lib/security';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  await rateLimitOrThrow(user.id);

  const body = await req.json() as {
    messages: UIMessage[];
    goal?: string;
    context?: string; // you can paste diff/code/description here
  };

  const system = buildSystemPrompt({
    userGoal: body.goal ?? 'Help improve the solution',
    context: body.context ?? ''
  });

  const result = streamText({
    model: getModel(),
    messages: [
      { role: 'system', content: system },
      ...(await convertToCoreMessages(body.messages))
    ],
    temperature: 0.3
  });

  return result.toDataStreamResponse();
}