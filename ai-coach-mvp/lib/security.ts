import { prisma } from '@/lib/prisma';

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
    throw new Error('Rate limit exceeded');
  }
  
  await prisma.requestLog.create({
    data: {
      userId,
      createdAt: now
    }
  });
}