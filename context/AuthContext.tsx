
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bg_auth');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse auth user", e);
        localStorage.removeItem('bg_auth');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      // data should contain { token, user }

      setUser(data.user);
      localStorage.setItem('bg_auth', JSON.stringify(data.user));
      localStorage.setItem('bg_auth_token', data.token); // Store token for API calls
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Login failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bg_auth');
    localStorage.removeItem('bg_auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};