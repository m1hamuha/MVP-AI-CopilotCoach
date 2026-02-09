import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
  goal: z.string().optional(),
  context: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
        statusCode: 401,
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        goal: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    logger.error('Get conversations error', { error }, error as Error);
    return createErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
        statusCode: 401,
      });
    }

    const body = await req.json();
    const validated = createConversationSchema.parse(body);

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: validated.title,
        goal: validated.goal,
        context: validated.context,
        model: 'gpt-4o-mini',
      },
    });

    logger.info('Conversation created', {
      conversationId: conversation.id,
      userId: session.user.id,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: error.errors[0].message,
        statusCode: 400,
      });
    }
    logger.error('Create conversation error', { error }, error as Error);
    return createErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
        statusCode: 401,
      });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Conversation ID is required',
        statusCode: 400,
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!conversation) {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
        statusCode: 404,
      });
    }

    await prisma.conversation.delete({
      where: { id },
    });

    logger.info('Conversation deleted', { conversationId: id, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete conversation error', { error }, error as Error);
    return createErrorResponse(error);
  }
}
