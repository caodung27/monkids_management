import { useEffect, useState } from 'react';
import { authApi } from '@/api/apiService';
import { TokenService } from '@/services/TokenService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'TEACHER';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await authApi.getCurrentUser();
        console.log('useAuth: Current user data:', data);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Check if we have a token before fetching user
    const token = TokenService.getAccessToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login({ email, password });
      console.log('useAuth: Login response:', data);
      if (data.user) {
        setUser(data.user);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      // Clear role cookie on logout
      document.cookie = 'user_role=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}; 