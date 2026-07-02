# Service Architecture Documentation

## Overview

This React frontend follows a **Service Layer Pattern** with centralized API management for better maintainability, testability, and code organization.

## Service Layer Benefits

### 1. **Centralized API Management**
- All API calls organized into dedicated service modules
- Constants centralized in `apiConstants.js` for consistent configuration  
- Single Axios instance with global interceptors
- Clear separation between UI logic and data fetching

### 2. **Improved Maintainability**
- Change API URLs/logic in one place
- Easy to add new endpoints or modify existing ones
- Consistent error handling across all API calls
- No scattered API calls throughout components

### 3. **Better Testability**
- Services can be easily unit tested in isolation
- Components can be tested with mocked services
- Clear function signatures and JSDoc documentation
- Predictable input/output patterns

### 4. **Enhanced Reusability**
- Services can be imported and used anywhere
- Common patterns abstracted into reusable functions
- Consistent pagination, filtering, and error handling

## Service Structure

```
services/
├── index.js           # Centralized exports & aliases
├── authService.js     # Authentication & token management
├── productService.js  # Product CRUD operations
├── variantService.js  # Variant & sub-variant operations
└── stockService.js    # Stock transactions & reporting
```

## Usage Examples

### Old Approach (Direct API Calls)
```javascript
// Scattered throughout components
const res = await api.post('/products/', formData);
const variants = await api.get(`/variants/?product=${productId}`);
const transactions = await api.get('/stock-transactions/', { params });
```

### New Approach (Service Layer)
```javascript
// Clean, documented service functions
import { createProduct, getVariantsByProduct, getStockReport } from '../services';

const product = await createProduct(productData, imageFile);
const variants = await getVariantsByProduct(productId);
const report = await getStockReport(filters);
```

## Service Functions Reference

### Authentication Service (`authService.js`)
- `login(username, password)` - Authenticate user & get tokens
- `refreshToken(token)` - Refresh access token  
- `logout()` - Clear stored tokens
- `getAccessToken()` - Get current access token
- `isAuthenticated()` - Check if user is logged in

### Product Service (`productService.js`)  
- `getProducts(params)` - Get paginated products with search/filters
- `getProduct(id)` - Get single product details
- `createProduct(data, image)` - Create product with optional image
- `updateProduct(id, data, image)` - Update existing product
- `deleteProduct(id)` - Delete product
- `generateSubVariants(id)` - Generate sub-variants from variants

### Variant Service (`variantService.js`)
- `getVariantsByProduct(productId)` - Get variants for specific product
- `getSubVariantsByProduct(productId)` - Get sub-variants for product
- `createVariant(data)` - Create new variant with options
- `updateVariant(id, data)` - Update existing variant
- `deleteVariant(id)` - Delete variant

### Stock Service (`stockService.js`)
- `getStockTransactions(params)` - Get paginated stock transactions
- `addStock(productId, subVariantId, quantity, notes)` - Add stock (PURCHASE)
- `removeStock(productId, subVariantId, quantity, notes)` - Remove stock (SALE)
- `getStockReport(filters)` - Get filtered transactions for reporting
- `createStockTransaction(data)` - Generic transaction creation

## Constants Organization

### API Configuration (`apiConstants.js`)
```javascript
export const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000/api',
  TIMEOUT: 10000,
  DEFAULT_PAGE_SIZE: 10,
};

export const AUTH_ENDPOINTS = {
  LOGIN: '/token/',
  REFRESH: '/token/refresh/',
};

export const PRODUCT_ENDPOINTS = {
  LIST: '/products/',
  CREATE: '/products/',
  DETAIL: (id) => `/products/${id}/`,
  // ...
};
```

This approach makes it easy to:
- Change API base URL in one place
- Add new endpoints systematically  
- Maintain consistent URL patterns
- Support environment-specific configuration

## Integration with Components

### Standard Pattern (Used in All Pages)
```javascript
import { getProducts, deleteProduct } from '../services/productService';

function ProductListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const response = await getProducts(searchParams);
      setData(response.results || response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Clean, readable component logic...
}
```

## Benefits for Interview

1. **Professional Architecture**: Demonstrates understanding of software design patterns
2. **Scalability**: Easy to add new features and endpoints
3. **Maintainability**: Changes are isolated and predictable
4. **Testability**: Clear separation of concerns enables better testing
5. **Code Quality**: Consistent patterns and documentation throughout
6. **Industry Standard**: Follows common patterns used in production applications

This service layer architecture makes the codebase more professional, maintainable, and easier to explain during technical interviews.