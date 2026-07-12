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
    const response = NextResponse.rewrite(url);

    // Never let a shared cache reuse the WeChat intercept page for the same
    // secret URL in another browser.
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Only run on secret pages
  matcher: '/s/:path*',
};
