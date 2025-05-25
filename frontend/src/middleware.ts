import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = ['/login', '/register', '/', '/about', '/auth/callback', '/auth/login-success', '/auth/oauth-callback']

// OAuth callback paths - these should always be allowed
const oauthPaths = ['/auth/callback', '/auth/login-success', '/auth/oauth-callback']

// Profile paths - must not be redirected away from
const profilePaths = ['/profile/new']

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

  // Check if it's a profile path
  const isProfilePath = profilePaths.some(profilePath =>
    path === profilePath || path.startsWith(`${profilePath}/`)
  )
  
  // Get the JWT token from cookies
  const token = request.cookies.get('accessToken')?.value
  
  // Check for Django session cookies which indicate a successful social auth
  const djangoSessionId = request.cookies.get('sessionid')?.value
  const hasDjangoSession = !!djangoSessionId

  // Check for auth redirect flags in cookies
  const authRedirectCookie = request.cookies.get('auth_redirect')?.value
  const hasAuthRedirectFlag = authRedirectCookie === 'true'

  // Check for auth success flag
  const authSuccessCookie = request.cookies.get('auth_successful')?.value
  const hasAuthSuccess = authSuccessCookie === 'true'
  
  // Check for new user flags in cookies
  const isNewUser = request.cookies.get('isNewUser')?.value === 'true'
  const forceProfileRedirect = request.cookies.get('FORCE_PROFILE_REDIRECT')?.value === 'true'
  
  // Check force profile redirect from query string
  const url = request.nextUrl
  const forceProfileParam = url.searchParams.get('force_profile')
  const isNewUserParam = url.searchParams.get('is_new_user')
  
  // Special case: If user is new and trying to access dashboard, redirect to profile/new
  if ((path === '/dashboard' || path.startsWith('/dashboard/')) && 
      (isNewUser || forceProfileRedirect)) {
    console.log('[Middleware] New user detected trying to access dashboard, redirecting to profile creation')
    return NextResponse.redirect(new URL('/profile/new', request.url))
  }
  
  // Dashboard routes - allow access completely 
  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    console.log('[Middleware] Dashboard access - bypassing auth checks completely');
    return NextResponse.next()
  }
  
  // Profile pages - always allow access
  if (isProfilePath) {
    console.log('[Middleware] Profile page access - always allowed');
    return NextResponse.next()
  }
  
  // If it's the login page and user has token or django session, redirect to dashboard
  // Check for FORCE_PROFILE_REDIRECT flag to prevent redirect loop
  if (path === '/login') {
    // Check for force profile redirect cookie
    const forceProfileRedirect = request.cookies.get('FORCE_PROFILE_REDIRECT')?.value === 'true';
    
    // If force profile redirect is set, don't redirect
    if (forceProfileRedirect) {
      console.log('[Middleware] Login page with FORCE_PROFILE_REDIRECT flag - allowing access');
      return NextResponse.next();
    }
    
    // Otherwise check auth status
    if (token || hasAuthRedirectFlag || hasAuthSuccess || hasDjangoSession) {
      // Add a timestamp check to prevent redirect loops
      const lastRedirect = request.cookies.get('last_redirect_time')?.value;
      const currentTime = Date.now();
      
      if (lastRedirect && (currentTime - parseInt(lastRedirect)) < 2000) {
        console.log('[Middleware] Preventing redirect loop - too soon after last redirect');
        return NextResponse.next();
      }
      
      console.log('[Middleware] Auth credentials found on login page, redirecting to dashboard');
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      
      // Set a timestamp to prevent redirect loops
      response.cookies.set('last_redirect_time', currentTime.toString(), {
        path: '/',
        maxAge: 60 // 1 minute
      });
      
      return response;
    }
  }
  
  // Check for protected pages
  if (!isPublicPath && !isOAuthPath && !isProfilePath) {
    // If no token but has Django session, redirect to auth callback to handle session-to-token
    if (!token && hasDjangoSession) {
      console.log('[Middleware] Django session detected without token, redirecting to auth callback');
      return NextResponse.redirect(new URL('/auth/callback', request.url))
    }
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