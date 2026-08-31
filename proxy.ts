import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (_auth, req) => {
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
};
