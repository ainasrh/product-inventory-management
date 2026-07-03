/**
 * Product List Helper Functions
 * Pure utility functions for data transformation and calculations
 */

/**
 * Calculate statistics from product data
 * @param {Array} products - Array of product objects
 * @param {number} totalCount - Total count from API
 * @returns {Object} Statistics object
 */
export function calculateProductStats(products, totalCount) {
  const activeCount = products.filter((p) => p.Active).length;
  const lowStockCount = products.filter((p) => (p.TotalStock ?? 0) < 10).length;

  return {
    totalCount,
    activeCount,
    lowStockCount,
  };
}

/**
 * Extract relative URL from full URL
 * @param {string} fullUrl - Full URL from API
 * @returns {string} Relative URL path
 */
export function extractRelativeUrl(fullUrl) {
  if (!fullUrl) return '';
  return fullUrl.replace(/^https?:\/\/[^/]+/, '');
}

/**
 * Determine stock badge tone based on stock level
 * @param {number} stock - Stock quantity
 * @returns {string} Tone identifier
 */
export function getStockTone(stock) {
  if (stock === 0) return 'danger';
  if (stock < 10) return 'warning';
  return 'success';
}

/**
 * Get tone CSS class mapping
 * @returns {Object} Tone to CSS class mapping
 */
export function getToneClasses() {
  return {
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    neutral: 'bg-slate-500',
  };
}

/**
 * Format product data for detail display
 * @param {Object} product - Product object
 * @returns {Array} Array of [label, value] tuples
 */
export function formatProductDetailFields(product) {
  return [
    ['Name', product.ProductName],
    ['Code', product.ProductCode],
    ['HSN Code', product.HSNCode || '—'],
    ['Total Stock', product.TotalStock ?? 0],
  ];
}
