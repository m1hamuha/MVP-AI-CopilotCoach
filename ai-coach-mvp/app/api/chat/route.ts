import { streamText, type UIMessage } from 'ai';
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
    context?: string;
  };

  const system = buildSystemPrompt({
    userGoal: body.goal ?? 'Help improve the solution',
    context: body.context ?? ''
  });

  // Build messages for the model. We avoid heavy conversions and pass through UI messages when possible.
  const messagesForModel: any[] = [
    { role: 'system', content: system },
    ...(body.messages ?? [])
  ];

  const result = streamText({
    model: getModel(),
    messages: messagesForModel,
    temperature: 0.3
  });

  if (typeof (result as any).toUIMessageStreamResponse === 'function') {
    return (result as any).toUIMessageStreamResponse();
  }
  if (typeof (result as any).toDataStreamResponse === 'function') {
    return (result as any).toDataStreamResponse();
  }

  return new Response('Streaming surface not supported', { status: 501 });
}
