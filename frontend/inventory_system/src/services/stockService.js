import api from '../api';
import { STOCK_ENDPOINTS } from '../constants/apiConstants';

/**
 * POST /api/stock/purchase/
 * Body: { sub_variant_id: uuid, quantity: number, notes?: string }
 * Returns StockTransaction object
 */
export const purchaseStock = async ({ sub_variant_id, quantity, notes = '' }) => {
  const res = await api.post(STOCK_ENDPOINTS.PURCHASE, {
    sub_variant_id,
    quantity: Number(quantity),
    notes,
  });
  return res.data;
};

/**
 * POST /api/stock/sale/
 * Body: { sub_variant_id: uuid, quantity: number, notes?: string }
 * Returns StockTransaction object
 * 409 if insufficient stock — backend message: "Insufficient stock. Available: X, requested: Y."
 */
export const saleStock = async ({ sub_variant_id, quantity, notes = '' }) => {
  const res = await api.post(STOCK_ENDPOINTS.SALE, {
    sub_variant_id,
    quantity: Number(quantity),
    notes,
  });
  return res.data;
};

/**
 * GET /api/stock/
 * Returns paginated list of sub-variants with current stock levels.
 * Each item: { id, product_id, product_code, product_name, sku, stock, options[] }
 */
export const getStockLevels = async (params = {}) => {
  const res = await api.get(STOCK_ENDPOINTS.LEVELS, { params });
  return res.data;
};

/**
 * GET /api/stock/report/
 * Filter params: start_date, end_date, product_id (uuid), transaction_type
 * Returns paginated StockTransaction list.
 * Each item: { id, product, product_code, product_name,
 *              sub_variant, sub_variant_sku,
 *              transaction_type, quantity, notes, created_by, created_at }
 */
export const getStockReport = async (params = {}) => {
  // Remove empty params before sending
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const res = await api.get(STOCK_ENDPOINTS.REPORT, { params: cleanParams });
  return res.data;
};
