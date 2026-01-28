import { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

export async function requireUser(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function createAccessToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
}

export async function createRefreshToken(userId: string) {
  const token = crypto.randomUUID();
  
  await prisma.refreshToken.create({
    data: {
      token: await hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  return token;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}