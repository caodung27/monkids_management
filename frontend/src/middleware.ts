import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = ['/auth/login', '/auth/register', '/', '/about']

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname
  
  // Check if it's a public path
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
  
  // Get the JWT token from cookies
  const token = request.cookies.get('accessToken')?.value
  
  // If on login page and has token, redirect to dashboard
  if (path === '/auth/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If not public path and no token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

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