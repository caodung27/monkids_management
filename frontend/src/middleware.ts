import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = ['/login', '/register', '/', '/about', '/auth/callback', '/auth/login-success', '/auth/oauth-callback']

// OAuth callback paths - these should always be allowed
const oauthPaths = ['/auth/callback', '/auth/login-success', '/auth/oauth-callback']

export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname
  
  // Check if it's a public path
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
  
  // Check if it's an OAuth callback path
  const isOAuthPath = oauthPaths.some(oauthPath => 
    path === oauthPath || path.startsWith(`${oauthPath}/`)
  )
  
  // Get the JWT token from cookies
  const token = request.cookies.get('accessToken')?.value
  
  // Check for auth redirect flags in cookies
  const authRedirectCookie = request.cookies.get('auth_redirect')?.value
  const hasAuthRedirectFlag = authRedirectCookie === 'true'
  
  // Dashboard routes - allow access completely 
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    console.log('[Middleware] Dashboard access - bypassing auth checks completely');
    return NextResponse.next()
  }
  
  // OAuth callback routes - always allow
  if (isOAuthPath) {
    console.log('[Middleware] Allowing access to auth callback routes');
    return NextResponse.next()
  }
  
  // If it's the login page and user has token, redirect to dashboard
  if (path === '/login' && (token || hasAuthRedirectFlag)) {
    console.log('[Middleware] Token found on login page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Continue with the request for all other cases
  return NextResponse.next()
}

// Configure which paths should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 