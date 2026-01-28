import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccessToken, createRefreshToken } from '@/lib/auth';

// Debugful OAuth handshake: bypass real GitHub login when DEBUG_FAKE_OAUTH=1
export async function GET() {
  const debug = process.env.DEBUG_FAKE_OAUTH === '1';
  if (debug) {
    // Ensure a mock user exists
    let user = await prisma.user.findUnique({ where: { githubId: 'debug-123' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: 'debug-123',
          username: 'debug',
          email: 'debug@example.com',
        }
      });
    }
    const accessToken = await createAccessToken(user.id);
    const refreshToken = await createRefreshToken(user.id);
    const response = NextResponse.redirect('/coach');
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
    });
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  }
  // In non-debug mode, guide the user to real OAuth (redirect to GitHub)
  const githubClientId = process.env.GITHUB_CLIENT_ID || '';
  const state = Math.random().toString(36).slice(2);
  const githubAuth = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&state=${state}&scope=read:user`;
  const resp = NextResponse.redirect(githubAuth);
  resp.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60,
  });
  return resp;
}
