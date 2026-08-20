import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  admin: AdminUser | null;
  token: null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  updateAdminState: (user: AdminUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token] = useState<null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.getMe();
        setAdmin(user);
      } catch (err) {
        console.error('Session expired or invalid', err);
        setAdmin(null);
      } finally {
        // give a smooth feel for the loading screen
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, pass: string) => {
    const res = await api.login(username, pass);
    setAdmin(res.admin);
  };

  const logout = () => {
    api.logout().catch(() => undefined);
    setAdmin(null);
  };

  const updateAdminState = (user: AdminUser) => {
    setAdmin(user);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        updateAdminState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
