import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('opsflow_token');
      const storedUser = localStorage.getItem('opsflow_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setCurrentUser(JSON.parse(storedUser));
          
          // Verify session is valid with database
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setCurrentUser(response.data.data);
            localStorage.setItem('opsflow_user', JSON.stringify(response.data.data));
          }
        } catch (error) {
          console.error('Session validation failed. Logging out.', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data.data;
        setToken(receivedToken);
        setCurrentUser(receivedUser);
        localStorage.setItem('opsflow_token', receivedToken);
        localStorage.setItem('opsflow_user', JSON.stringify(receivedUser));
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('opsflow_token');
    localStorage.removeItem('opsflow_user');
  };

  const value = {
    currentUser,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
