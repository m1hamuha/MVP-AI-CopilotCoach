import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip auth for login and auth routes
  if (path.startsWith('/login') || path.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('access_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET!)
    );
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/coach', '/api/chat'],
};