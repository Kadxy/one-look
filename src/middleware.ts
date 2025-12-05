// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';

    // Detect WeChat (MicroMessenger) or generic crawlers if strict mode needed
    const isWeChat = /MicroMessenger/i.test(userAgent);

    // Only intercept the "read/view" paths
    if (isWeChat && request.nextUrl.pathname.startsWith('/view/')) {
        return new NextResponse(
            `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <title>Open in Browser</title>
        <style>
          body { 
            background-color: #f3f4f6; 
            font-family: -apple-system, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            color: #333;
          }
          .icon { font-size: 4rem; margin-bottom: 20px; }
          .text { font-size: 1.2rem; font-weight: 500; text-align: center; padding: 0 20px;}
          .arrow { 
            position: absolute; 
            top: 20px; 
            right: 20px; 
            font-size: 2rem;
            animation: bounce 1.5s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        </style>
      </head>
      <body>
        <div class="arrow">↗️</div>
        <div class="icon">🔒</div>
        <div class="text">
          <p>For security reasons,</p>
          <p>please open in system browser.</p>
        </div>
      </body>
      </html>
      `,
            {
                headers: { 'content-type': 'text/html; charset=utf-8' },
                status: 200
            }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/view/:path*',
};