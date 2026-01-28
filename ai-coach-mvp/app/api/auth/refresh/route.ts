import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createAccessToken, createRefreshToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }
  
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      token: await hashToken(refreshToken),
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!tokenRecord) {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
  
  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
  const newRefreshToken = await createRefreshToken(tokenRecord.userId);
  
  // Create new access token
  const accessToken = await createAccessToken(tokenRecord.userId);
  
  const response = NextResponse.json({ ok: true });
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 // 15 minutes
  });
  
  response.cookies.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
  
  return response;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}