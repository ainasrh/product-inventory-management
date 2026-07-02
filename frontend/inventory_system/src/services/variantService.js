import api from '../api';
import { VARIANT_ENDPOINTS } from '../constants/apiConstants';

/**
 * PUT /api/variants/<uuid>/
 * Body: { name?, options?: [string] }
 * Backend replaces all options if options[] is provided.
 * Also regenerates sub-variants automatically.
 */
export const updateVariant = async (variantId, payload) => {
  const res = await api.put(VARIANT_ENDPOINTS.UPDATE(variantId), payload);
  return res.data;
};

/**
 * DELETE /api/variants/<uuid>/
 * Backend regenerates sub-variants after deletion.
 */
export const deleteVariant = async (variantId) => {
  const res = await api.delete(VARIANT_ENDPOINTS.DELETE(variantId));
  return res.data;
};
