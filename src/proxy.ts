import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // Detect WeChat
  const isWeChat = /MicroMessenger/i.test(userAgent);

  // Intercept /s/ paths in WeChat
  if (isWeChat && request.nextUrl.pathname.startsWith('/s/')) {
    // Rewrite to the internal /wechat page (keeps URL the same)
    const url = request.nextUrl.clone();
    url.pathname = '/wechat';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only run on secret pages
  matcher: '/s/:path*',
};