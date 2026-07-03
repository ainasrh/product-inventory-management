import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAccessToken, storeTokens, clearTokens } from '../services/authService';
import api from '../api';


export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(null);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getAccessToken();
    if (saved) {
      setToken(saved);
      fetchUser(saved);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (accessToken) => {
    try {
      const res = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(res.data);
    } catch (err) {
      // token invalid/expired — clear everything
      clearTokens();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (access, refresh, userData = null) => {
    storeTokens(access, refresh);
    setToken(access);

    if (userData) {
      setUser(userData);
    } else {
      await fetchUser(access);
    }
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