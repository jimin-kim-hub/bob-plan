import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token || !(await verifyToken(token))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/plan/new', '/mypage', '/settings'],
}
