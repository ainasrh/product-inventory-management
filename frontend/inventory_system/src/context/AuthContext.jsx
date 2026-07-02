import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAccessToken, storeTokens, clearTokens } from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getAccessToken();
    if (saved) setToken(saved);
    setLoading(false);
  }, []);

  const login = (access, refresh, userData = null) => {
    storeTokens(access, refresh);
    setToken(access);
    setUser(userData);
  };

  const logout = () => {
    clearTokens();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
