import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/errors';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const feedbackSchema = z.object({
  messageId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to submit feedback',
        statusCode: 401,
      });
    }

    const body = await req.json();
    const validated = feedbackSchema.parse(body);

    const message = await prisma.message.findUnique({
      where: { id: validated.messageId },
    });

    if (!message) {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Message not found',
        statusCode: 404,
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        messageId: validated.messageId,
        userId: session.user.id,
        rating: validated.rating,
        comment: validated.comment,
      },
    });

    logger.info('Feedback submitted', {
      feedbackId: feedback.id,
      messageId: validated.messageId,
      rating: validated.rating,
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: error.errors[0].message,
        statusCode: 400,
      });
    }
    logger.error('Feedback error', { error }, error as Error);
    return createErrorResponse(error);
  }
}

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

    const feedback = await prisma.feedback.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    logger.error('Get feedback error', { error }, error as Error);
    return createErrorResponse(error);
  }
}
