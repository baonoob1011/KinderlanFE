import { useEffect, useState, useCallback } from 'react';
import { authUtils } from '../services/api';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: string | null;
  userEmail: string | null;
  isTokenExpired: boolean;
  logout: () => void;
  checkAuth: () => void;
  tokenInfo: any;
}

/**
 * Hook for managing authentication state
 * Provides real-time authentication status and utilities
 */
export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState<boolean>(true);

  const checkAuth = useCallback(() => {
    const loggedIn = authUtils.isLoggedIn();
    const expired = authUtils.isTokenExpired();
    const role = authUtils.getUserRole();
    const email = authUtils.getUserEmail();

    setIsAuthenticated(loggedIn && !expired);
    setIsTokenExpired(expired);
    setUserRole(role);
    setUserEmail(email);
    setIsLoading(false);

    // Debug info
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Status:', {
        loggedIn,
        expired,
        role,
        email,
        tokenInfo: authUtils.getTokenInfo()
      });
    }
  }, []);

  const logout = useCallback(() => {
    authUtils.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail(null);
    setIsTokenExpired(true);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up periodic token expiration check (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (authUtils.isLoggedIn()) {
        const expired = authUtils.isTokenExpired();
        setIsTokenExpired(expired);
        
        if (expired) {
          console.log('Token expired, authentication status updated');
          setIsAuthenticated(false);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for localStorage changes (token updates from other tabs)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === 'refreshToken') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  return {
    isAuthenticated,
    isLoading,
    userRole,
    userEmail,
    isTokenExpired,
    logout,
    checkAuth,
    tokenInfo: authUtils.getTokenInfo(),
  };
};

export default useAuth;