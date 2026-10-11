import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  if (getSessionUserId(request)) return NextResponse.next();

  const loginUrl = new URL('/', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/challenge/:path*'],
};
