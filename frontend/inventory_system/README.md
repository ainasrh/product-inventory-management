# Product Inventory Management System — Frontend

A clean, interview-ready React frontend for a product inventory management system built with **minimal dependencies and maximum clarity**. Every line of code is simple enough to explain in an interview.

## Why This Architecture?

### State Management: Context API (not Redux)

**Decision**: Use React's built-in **Context API** + local `useState` instead of Redux Toolkit.

**Why**: Redux adds a significant abstraction layer (actions, reducers, middleware, selectors) that isn't justified for this app:
- Auth state is truly global → lives in `AuthContext` ✓
- Products, stock, transactions are page-specific → local `useState` per page ✓  
- No need for time-travel debugging, middleware, or complex async orchestration  
- Context API is part of React, so no new paradigm to learn

**Trade-off**: No centralized store for all state. But that's actually **better for learning** — it makes data flow transparent on each page, and it's the pattern used in most modern codebases (e.g., plain hooks + server libraries like React Query).

## Folder Structure

```
src/
├── api.js                          # Axios instance + interceptors
├── App.jsx                         # Main router + layout
├── main.jsx
├── App.css
├── index.css
│
├── context/
│   └── AuthContext.jsx             # Auth state (token, user, login/logout)
│
├── components/
│   ├── FormInput.jsx               # Reusable: label + input + error
│   ├── Table.jsx                   # Reusable: generic table with row actions
│   ├── Modal.jsx                   # Reusable: overlay + close button
│   ├── LoadingSpinner.jsx
│   └── EmptyState.jsx
│
├── pages/
│   ├── LoginPage.jsx
│   ├── ProductListPage.jsx
│   ├── ProductCreatePage.jsx
│   └── StockManagementPage.jsx
│   └── StockReportPage.jsx
│
└── utils/
    ├── getErrorMessage.js          # Maps HTTP 400/404/409/500 → user messages
    └── validators.js               # Plain validation functions
```

## Four Reusable Components

Every component is **genuinely reused** and easy to justify in an interview:

### 1. **FormInput**
**Used**: 10+ times across all form pages
```jsx
<FormInput
  label="Product Name"
  value={productName}
  onChange={(e) => setProductName(e.target.value)}
  error={errors.productName}
  required
/>
```
**Why reusable**: Every form field follows the same pattern: label + input + inline error below. This component eliminates repetition.

### 2. **Table**
**Used**: Product list, Stock report (anywhere we display rows with actions)
```jsx
<Table 
  columns={[{ key: 'ProductName', label: 'Product' }, ...]}
  rows={products}
  actions={[{ label: 'Edit', onClick: (row) => ... }, ...]}
/>
```
**Why reusable**: The table structure is identical everywhere — headers, rows, optional actions. One component, infinite uses.

### 3. **Modal**
**Used**: Product detail view, delete confirmation
```jsx
<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Product Details">
  {/* any content */}
</Modal>
```
**Why reusable**: A modal is a modal — overlay + close button + content. No app-specific logic needed.

### 4. **LoadingSpinner** & **EmptyState**
**Used**: Every page that fetches data
```jsx
if (loading) return <LoadingSpinner />;
if (data.length === 0) return <EmptyState message="No products yet." />;
```

## Error Handling: Status Code → User Message

**File**: `utils/getErrorMessage.js`

Maps HTTP status codes to specific, user-friendly messages:

| Status | Example Trigger | User Message |
|--------|-----------------|--------------|
| **400** | Validation failed | "Please fix the highlighted fields." |
| **404** | Product not found | "The requested item could not be found." |
| **409** | Duplicate code | "This action conflicts with existing data (e.g. duplicate code)." |
| **500** | Server error | "Something went wrong on our end. Please try again." |
| **Network** | No connection | "Network error — please check your connection." |

**For 400 with field errors**, the backend response shape is:
```json
{ "errors": { "ProductCode": ["Already exists"] } }
```
The function extracts these and maps them onto form state so inline messages appear below the right field.

## Data-Fetching Pattern (Standard Across All Pages)

```javascript
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
    const res = await api.get('/products/');
    setData(res.data.results);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setLoading(false);
  }
}

// Render:
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
if (data.length === 0) return <EmptyState message="No products yet." />;
// else render the data
```

This pattern:
- ✓ Handles loading, error, empty states **explicitly**  
- ✓ No race conditions (try/catch + setLoading in finally)  
- ✓ Consistent across 5 pages  
- ✓ No external caching library (no React Query bloat)

## Validation: Plain Functions, No Yup/Zod

**File**: `utils/validators.js`

Inline validation. Easy to read, easy to explain:

```javascript
export function validateProductName(name) {
  if (!name || !name.trim()) {
    return 'Product Name is required.';
  }
  if (name.trim().length < 2) {
    return 'Product Name must be at least 2 characters.';
  }
  return null; // valid
}
```

Called on form submit:
```javascript
function validateForm() {
  const newErrors = {};
  const nameErr = validateProductName(productName);
  if (nameErr) newErrors.productName = nameErr;
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}
```

No schema library overhead — just `if` statements.

## Pages

### LoginPage (`/login`)
- Username + password form
- Posts to `/api/token/`
- Stores JWT in localStorage
- Redirects to `/products` on success
- Shows user-friendly error via `getErrorMessage()`

### ProductListPage (`/products`)
- Paginated product table (uses `<Table />`)
- Search with debounce (500ms)
- Row actions: View, Edit, Delete
- Delete confirmation via `<Modal />`
- Product detail modal showing variants + sub-variants

### ProductCreatePage (`/products/new`)
- Form fields: Name, Code, HSN, Image (with preview)
- Variant builder: add/remove variants, input options
- Live sub-variant preview (cartesian product of variant options)
- Step 1: POST product  
- Step 2: POST variants with options  
- Step 3: POST generate-sub-variants endpoint
- Form-level + field-level error display

### StockManagementPage (`/stock`)
- Toggle: Add Stock (PURCHASE) vs Remove Stock (SALE)
- Dropdown: Select product → fetches sub-variants
- Input: Quantity + notes
- Validation: On SALE, blocks if quantity > available stock
- Success toast + form clear on submit

### StockReportPage (`/reports`)
- Filters: Date range, Product, Transaction type, Page size
- Paginated transaction table (uses `<Table />`)
- Running balance: accumulated client-side via loop
- CSV export: plain Blob + download link (no library)
- Prev/Next pagination

## Tech Stack

- **React 18** — functional components, hooks only
- **React Router v6** — simple `<Routes>` + `<Navigate>`
- **Axios** — HTTP client with interceptor for JWT token
- **Context API** — auth state only (no Redux)
- **Tailwind CSS** — utility classes for responsive design (sm:/md:/lg: prefixes)
- **react-hot-toast** — success/error toast notifications
- **Vite** — fast build tool

## Setup

```bash
cd frontend/inventory_system
npm install
npm run dev
```

Server runs at `http://localhost:5173`

Make sure the Django backend is running at `http://127.0.0.1:8000`

## Justifications for Interview

### 1. "Why Context API instead of Redux?"
> Redux is overkill here. Auth is global, so it lives in Context. Page data is isolated in useState. No shared state between pages. Redux shines with complex async flows, time-travel debugging, middleware — none of which we need. This keeps the code simple and clear.

### 2. "Why no validation library (Yup/Zod)?"
> Plain `if` checks are easier to understand and debug. A library adds cognitive overhead. For this scope, 20 lines of validators.js is clearer than learning schema DSL syntax.

### 3. "Why no React Query?"
> No caching strategy needed per the spec. useEffect + useState handles loading/error/empty states perfectly. React Query is great for complex caching, but here it would add boilerplate without benefit.

### 4. "How do you handle responsive design?"
> Tailwind's `sm:`, `md:`, `lg:` prefixes. The grid layout on the stock report page uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` to reflow on tablet (768px) and desktop (1024px+).

### 5. "Talk through error handling"
> Every API call is wrapped in try/catch. The catch block passes the error to `getErrorMessage()`, which reads `err.response.status` and returns a specific message. For 400 validation errors, we also extract field-level errors and map them onto form state so the user sees red boxes under the wrong fields.

### 6. "How do you avoid unnecessary re-renders?"
> Dependency arrays on useEffect. For example, `useEffect(() => { fetchProducts(); }, [currentUrl])` means we only re-fetch when the URL changes. No infinite loops. Components don't re-render unless props/state actually change.

## Responsive Testing

Test at:
- **Desktop**: 1200px+
- **Tablet**: 768px (iPad)
- **Mobile**: 375px (small phone)

Use browser DevTools' responsive mode. All tables, modals, and forms reflow correctly.

## Code Quality Checklist

- ✓ No unused imports
- ✓ Consistent naming (camelCase for vars/functions, PascalCase for components)
- ✓ Meaningful component names
- ✓ All dependency arrays properly filled
- ✓ No console.log in production code (only during development)
- ✓ Proper error boundaries via try/catch
- ✓ Loading, error, empty states on every data-fetching page

---

**Ready for interview**. Every line of code is simple, justified, and explainable.
