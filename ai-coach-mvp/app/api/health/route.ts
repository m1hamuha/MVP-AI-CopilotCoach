import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unknown',
    },
    uptime: process.uptime(),
  };

  const checks: Promise<void>[] = [];
  const statusCodes: number[] = [];

  checks.push(
    prisma
      .$queryRaw`SELECT 1`
      .then(() => {
        healthCheck.services.database = 'healthy';
        statusCodes.push(200);
      })
      .catch((error) => {
        healthCheck.services.database = 'unhealthy';
        statusCodes.push(503);
        console.error('Database health check failed:', error);
      })
  );

  await Promise.all(checks);

  const isHealthy = statusCodes.every((code) => code === 200);
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(healthCheck, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
