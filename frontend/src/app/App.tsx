'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TokenService } from '@/api/apiService';

export default function App({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = TokenService.getAccessToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
} 
