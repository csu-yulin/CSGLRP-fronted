import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ApiResponse } from '../types';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token) {
        // Optimistically set user from localStorage if available
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse stored user", e);
          }
        }

        // Verify with backend
        try {
          const res = await authService.getCurrentUser();
          if (res.data.code === 200) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          } else {
             // Token invalid or other issue
             throw new Error('Token validation failed');
          }
        } catch (error) {
          console.error("Auth verification failed", error);
          // Only logout if it's strictly an auth error, not a network error
          // But for safety, if /auth/me fails, we might assume session is invalid if 401
          // The interceptor handles 401, so here we just stop loading
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, newUser: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    toast.success(`欢迎回来, ${newUser.name}`);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast('已安全退出');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};