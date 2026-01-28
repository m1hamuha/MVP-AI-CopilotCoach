import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const response = NextResponse.redirect('/login');
  
  // Clear cookies
  response.cookies.set('access_token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  return response;
}