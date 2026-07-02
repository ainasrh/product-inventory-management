/**
 * Services Index - Central export for all API services
 * Provides clean imports for all service modules
 */

// Auth services
export * from './authService';

// Product services  
export * from './productService';

// Variant services
export * from './variantService';

// Stock services
export * from './stockService';

// Re-export commonly used services with aliases for convenience
export { 
  login as loginUser,
  logout as logoutUser,
  isAuthenticated as checkAuth
} from './authService';

export {
  getProducts as fetchProducts,
  createProduct as addProduct,
  deleteProduct as removeProduct
} from './productService';

export {
  addStock as purchaseStock,
  removeStock as saleStock,
  getStockReport as fetchStockReport
} from './stockService';