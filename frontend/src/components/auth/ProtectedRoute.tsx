'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthCheck from '@/components/AuthCheck';
import { checkTokenAndRefreshIfNeeded } from '@/api/apiService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('admin' | 'teacher')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [hasCheckedRoles, setHasCheckedRoles] = useState(false);

  // Check roles after authentication is confirmed
  useEffect(() => {
    const checkRoles = async () => {
      // Skip if already checked or not authenticated yet
      if (hasCheckedRoles || !isAuthenticated) return;
      
      // If no roles required, allow access
      if (requiredRoles.length === 0) {
        setHasCheckedRoles(true);
        return;
      }
      
      // Verify access token is still valid
      const isTokenValid = await checkTokenAndRefreshIfNeeded();
      
      // If token is invalid, let AuthCheck handle the redirect
      if (!isTokenValid) return;
      
      // Check if user has required role
      if (user) {
        const hasRequiredRole = requiredRoles.some(role => {
          if (role === 'admin') return user.is_admin;
          if (role === 'teacher') return user.is_teacher;
          return false;
        });
        
        if (!hasRequiredRole) {
          console.log('ProtectedRoute: User lacks required role, redirecting to dashboard');
          router.replace('/dashboard');
        }
        
        setHasCheckedRoles(true);
      }
    };
    
    checkRoles();
  }, [isAuthenticated, user, requiredRoles, router, hasCheckedRoles]);
  
  // Use the AuthCheck component to handle token validation and refresh
  return <AuthCheck>{children}</AuthCheck>;
};

export default ProtectedRoute; 