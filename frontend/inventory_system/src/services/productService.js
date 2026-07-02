import api from '../api';
import { PRODUCT_ENDPOINTS } from '../constants/apiConstants';

/**
 * GET /api/products/
 * Params: search, Active, IsFavourite, page, page_size
 * Returns DRF pagination: { count, next, previous, results }
 */
export const getProducts = async (params = {}) => {
  const res = await api.get(PRODUCT_ENDPOINTS.LIST, { params });
  return res.data; // paginated { count, next, previous, results }
};

/**
 * GET /api/products/<uuid>/
 * Returns full detail: product fields + variants[] + sub_variants[]
 */
export const getProduct = async (id) => {
  const res = await api.get(PRODUCT_ENDPOINTS.DETAIL(id));
  return res.data;
};

/**
 * POST /api/products/
 * Body: { ProductName, ProductCode, HSNCode, IsFavourite, Active,
 *         variants: [{ name, options: [string] }] }
 * Backend creates product + variants + sub-variants in one call.
 * ProductImage is separate (PATCH after creation).
 */
export const createProduct = async (payload) => {
  const res = await api.post(PRODUCT_ENDPOINTS.CREATE, payload);
  return res.data;
};

/**
 * PATCH /api/products/<uuid>/
 * Body: any subset of { ProductName, ProductCode, HSNCode, IsFavourite, Active, ProductImage }
 * Use FormData when sending an image file.
 */
export const updateProduct = async (id, payload) => {
  const isFile = payload instanceof FormData;
  const res = await api.patch(PRODUCT_ENDPOINTS.UPDATE(id), payload, {
    headers: isFile ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data;
};

/**
 * DELETE /api/products/<uuid>/   — soft delete (sets Active=false)
 */
export const deleteProduct = async (id) => {
  const res = await api.delete(PRODUCT_ENDPOINTS.DELETE(id));
  return res.data;
};

// ── Variants nested under product ────────────────────────────────────────

/**
 * GET /api/products/<uuid>/variants/
 */
export const getProductVariants = async (productId) => {
  const res = await api.get(PRODUCT_ENDPOINTS.VARIANTS(productId));
  return res.data; // array of variants with options[]
};

/**
 * POST /api/products/<uuid>/variants/
 * Body: { name, options: [string] }
 */
export const addVariant = async (productId, { name, options }) => {
  const res = await api.post(PRODUCT_ENDPOINTS.VARIANTS(productId), { name, options });
  return res.data;
};

/**
 * GET /api/products/<uuid>/subvariants/
 * Returns paginated list: { count, next, previous, results }
 * Each item: { id, sku, stock, price, options[] }
 */
export const getSubVariants = async (productId) => {
  const res = await api.get(PRODUCT_ENDPOINTS.SUB_VARIANTS(productId));
  // May be paginated or plain array depending on size
  return res.data;
};
