import { prisma } from '@/lib/prisma';
import { AppError, ERROR_CODES } from '@/lib/errors';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

export async function rateLimitOrThrow(userId: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

  const requestCount = await prisma.requestLog.count({
    where: {
      userId,
      createdAt: {
        gte: windowStart
      }
    }
  });

  if (requestCount >= MAX_REQUESTS) {
    throw new AppError(
      'Rate limit exceeded. Please try again later.',
      ERROR_CODES.RATE_LIMITED,
      429
    );
  }

  await prisma.requestLog.create({
    data: {
      userId,
      createdAt: now
    }
  });
}

export async function rateLimitByIp(ip: string, endpoint: string) {
  const RATE_LIMIT_WINDOW_IP = 60 * 1000; // 1 minute
  const MAX_REQUESTS_IP = 30;

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_IP);

  const requestCount = await prisma.requestLog.count({
    where: {
      ip,
      endpoint,
      createdAt: {
        gte: windowStart
      }
    }
  });

  if (requestCount >= MAX_REQUESTS_IP) {
    throw new AppError(
      'Too many requests from this IP. Please try again later.',
      ERROR_CODES.RATE_LIMITED,
      429
    );
  }
}