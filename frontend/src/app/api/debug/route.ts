import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  const debugInfo = {
    cookies: allCookies.map(c => ({ name: c.name, value: c.value })),
    hasAccessToken: allCookies.some(c => c.name === 'accessToken'),
    hasRefreshToken: allCookies.some(c => c.name === 'refreshToken'),
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(debugInfo);
} 