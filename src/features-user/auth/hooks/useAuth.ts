import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest } from '../types/authTypes';

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }

  if (err instanceof Error) {
    return err.message || fallback;
  }

  return fallback;
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    setAuth,
    setToken,
    logout: clearStore,
    markSessionChecked,
    user,
    token,
    isAuthenticated,
    isSessionChecked,
  } = useAuthStore();

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      if (response.code === 1000 && response.result.authenticated && response.result.token) {
        setToken(response.result.token);
        const userResponse = await authService.getMyInfo();
        setAuth(userResponse.result, response.result.token);
        return { success: true };
      }

      const message = response.message || 'Login failed';
      setError(message);
      return { success: false, message };
    } catch (err: unknown) {
      clearStore();
      const message = getErrorMessage(err, 'Login failed');
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
      markSessionChecked();
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      if (response.code === 1000) {
        return { success: true };
      }

      const message = response.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Registration failed');
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      markSessionChecked();
      return { success: false };
    }

    setIsLoading(true);
    setError(null);
    try {
      const introspection = await authService.introspect(storedToken);
      if (introspection.code !== 1000 || !introspection.result.valid) {
        clearStore();
        return { success: false };
      }

      const userResponse = await authService.getMyInfo();
      setAuth(userResponse.result, storedToken);
      return { success: true };
    } catch (err: unknown) {
      clearStore();
      setError(getErrorMessage(err, 'Unable to restore your session'));
      return { success: false };
    } finally {
      setIsLoading(false);
      markSessionChecked();
    }
  }, [clearStore, markSessionChecked, setAuth]);

  const logout = async () => {
    const activeToken = localStorage.getItem('token');
    if (activeToken) {
      try {
        await authService.logout(activeToken);
      } catch (err) {
        console.warn('Logout endpoint failed; clearing local session.', err);
      }
    }
    clearStore();
  };

  return {
    user,
    token,
    isAuthenticated,
    isSessionChecked,
    isLoading,
    error,
    login,
    register,
    initializeAuth,
    logout,
  };
};
