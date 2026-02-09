import { streamText, type UIMessage } from 'ai';
import { openRouterModels, type ModelId, getOpenRouterHeaders } from '@/lib/openrouter';
import { buildSystemPrompt } from '@/lib/prompt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { rateLimitOrThrow } from '@/lib/security';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to use the chat',
        statusCode: 401,
      });
    }

    await rateLimitOrThrow(session.user.id);

    const body = await req.json() as {
      messages: UIMessage[];
      goal?: string;
      context?: string;
      model?: ModelId;
    };

    const modelId = (body.model && body.model in openRouterModels) 
      ? body.model as ModelId 
      : 'gpt-4o-mini';
    const modelInfo = openRouterModels[modelId];

    const system = buildSystemPrompt({
      userGoal: body.goal ?? 'Help improve the solution',
      context: body.context ?? ''
    });

    const messagesForModel: any[] = [
      { role: 'system', content: system },
      ...(body.messages ?? [])
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        ...getOpenRouterHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelInfo.id,
        messages: messagesForModel,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error', {
        status: response.status,
        body: errorText,
        model: modelId,
      });
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const completion = await response.json();

    const totalTokens = completion.usage?.total_tokens ?? 0;
    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;

    await prisma.message.create({
      data: {
        userId: session.user.id,
        role: 'assistant',
        content: completion.choices?.[0]?.message?.content ?? '',
        model: modelId,
        tokens: totalTokens,
        cost: totalTokens > 0 ? completion.cost ?? 0 : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CHAT_COMPLETED',
        metadata: {
          model: modelId,
          tokens: totalTokens,
          cost: completion.cost,
        },
      },
    });

    return new Response(JSON.stringify(completion), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Chat error', { error }, error as Error);
    return createErrorResponse(error);
  }
}
