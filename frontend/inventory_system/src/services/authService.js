import api from '../api';
import { AUTH_ENDPOINTS, STORAGE_KEYS } from '../constants/apiConstants';

/** POST /api/auth/login/  →  { access, refresh } */
export const login = async (username, password) => {
  const res = await api.post(AUTH_ENDPOINTS.LOGIN, { username, password });
  return res.data; // { access, refresh }
};

/** POST /api/auth/register/ */
export const register = async ({ username, email, password, password_confirm }) => {
  const res = await api.post(AUTH_ENDPOINTS.REGISTER, {
    username, email, password, password_confirm,
  });
  return res.data;
};

/** POST /api/auth/refresh/ */
export const refreshAccessToken = async (refresh) => {
  const res = await api.post(AUTH_ENDPOINTS.REFRESH, { refresh });
  return res.data; // { access }
};

export const storeTokens = (access, refresh) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
  if (refresh) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const getAccessToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
