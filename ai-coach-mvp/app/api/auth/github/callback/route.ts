import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccessToken, createRefreshToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const debug = process.env.DEBUG_FAKE_OAUTH === '1';
  if (debug) {
    let user = await prisma.user.findUnique({ where: { githubId: 'debug-123' } });
    if (!user) {
      user = await prisma.user.create({
        data: { githubId: 'debug-123', username: 'debug', email: 'debug@example.com' }
      });
    }
    const accessToken = await createAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);
    const response = NextResponse.redirect('/coach');
    response.cookies.set('access_token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 15 * 60 });
    response.cookies.set('refresh_token', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 });
    return response;
  }
  // Production path would perform GitHub OAuth; for debugging we expose a 501
  return NextResponse.json({ ok: false, error: 'OAuth not implemented in debug mode' }, { status: 501 });
}
