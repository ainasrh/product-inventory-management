/**
 * API Constants
 * All endpoint paths and shared constants — derived from actual backend urls.py
 */
import { apiConfig } from '../config/apiConfig';

export const API_CONFIG = {
  BASE_URL: apiConfig.baseURL,
  TIMEOUT:  apiConfig.timeout,
  DEFAULT_PAGE_SIZE: apiConfig.defaultPageSize,
};

// ── Auth  (prefix: /api/auth/) ────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register/',
  LOGIN:    '/auth/login/',
  REFRESH:  '/auth/refresh/',
};

// ── Products  (prefix: /api/products/) ───────────────────────────────────
export const PRODUCT_ENDPOINTS = {
  LIST:   '/products/',
  CREATE: '/products/',
  DETAIL: (id) => `/products/${id}/`,
  UPDATE: (id) => `/products/${id}/`,
  DELETE: (id) => `/products/${id}/`,       // soft-delete (sets Active=false)

  // Variants nested under product
  VARIANTS:       (productId) => `/products/${productId}/variants/`,
  SUB_VARIANTS:   (productId) => `/products/${productId}/subvariants/`,
};

// ── Standalone Variant  (/api/variants/<id>/) ────────────────────────────
export const VARIANT_ENDPOINTS = {
  UPDATE: (id) => `/variants/${id}/`,
  DELETE: (id) => `/variants/${id}/`,
};

// ── Stock  (prefix: /api/stock/) ─────────────────────────────────────────
export const STOCK_ENDPOINTS = {
  PURCHASE: '/stock/purchase/',
  SALE:     '/stock/sale/',
  LEVELS:   '/stock/',             // GET — all sub-variant stock levels
  REPORT:   '/stock/report/',      // GET — transactions with filters
};

// ── Transaction types (matches backend TextChoices) ──────────────────────
export const TRANSACTION_TYPES = {
  PURCHASE:   'PURCHASE',
  SALE:       'SALE',
  ADJUSTMENT: 'ADJUSTMENT',
};

// ── Local-storage keys ───────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'access_token',
  REFRESH_TOKEN: 'refresh_token',
};

// ── Pagination ───────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE:  20,
  PAGE_SIZE_OPTIONS: [10, 20, 50],
};
