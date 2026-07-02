# Quick Start Guide

## ⚡ Getting Started (5 minutes)

### 1. Install Dependencies

```bash
cd frontend/inventory_system
npm install
```

**Note**: This may take 3-5 minutes on first run. If npm is slow, try:
```bash
npm install --prefer-offline
```

### 2. Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v8.0.12  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3. Open in Browser

Navigate to: **http://localhost:5173**

You should see the login page.

### 4. Login

Use any credentials that exist in your Django backend. The app will:
1. POST to `/api/token/`
2. Store the JWT in localStorage
3. Redirect to `/products`

If you see "Network error", make sure:
- Django is running at `http://127.0.0.1:8000`
- CORS is enabled in Django settings (should be from backend setup)

---

## 🧪 Testing the App

### 1. Products Page (`/products`)
- You should see a list of products
- Click "+ New Product" to create one
- Use search to filter by name

### 2. Create a Product (`/products/new`)
- Fill in Product Name, Code, HSN Code
- Add at least one variant with options
- Watch the sub-variant preview update
- Submit to create

### 3. Stock Management (`/stock`)
- Select a product → sub-variants auto-populate
- Try "Add Stock" (PURCHASE) to add inventory
- Try "Remove Stock" (SALE) to test validation

### 4. Stock Report (`/reports`)
- View all transactions
- Filter by date, product, type
- Export as CSV
- See running balance calculation

---

## 📚 Project Structure

```
src/
├── App.jsx              # Main router & layout
├── pages/               # 5 page components
├── components/          # 5 reusable components
├── context/             # AuthContext for auth state
├── utils/               # Validators & error handling
└── api.js               # Axios with JWT interceptor
```

---

## 🛠 Available Commands

```bash
npm run dev      # Start dev server (with hot reload)
npm run build    # Build for production
npm run preview  # Test production build locally
npm run lint     # Run ESLint
```

---

## ⚠️ If npm install is stuck

Try:

```bash
# Clear cache and try again
npm cache clean --force
npm install

# Or try with different registry
npm install --registry https://registry.npmjs.org/
```

The main packages being installed:
- `react` & `react-dom` (already installed)
- `react-router-dom` (routing)
- `axios` (HTTP client)
- `react-hot-toast` (notifications)
- `tailwindcss` (styling, via CDN in dev)

---

## 🐛 Troubleshooting

### "Cannot find module 'react-router-dom'"
- npm install is still running
- Wait a few minutes and try again

### "Network error — please check your connection"
- Is Django running at `http://127.0.0.1:8000`?
- Are CORS headers configured in Django?

### "Request failed with status code 401"
- Your JWT token expired
- Log out and log back in
- Token is stored in localStorage, cleared on logout

### Styling is broken (no colors/spacing)
- Tailwind CDN might not have loaded
- Check browser DevTools Network tab for `cdn.tailwindcss.com`
- Refresh page if needed

---

## 📝 Backend API Expectations

The app expects these endpoints at `http://127.0.0.1:8000/api/`:

- `POST /token/` → `{ access, refresh }`
- `GET /products/` → paginated products
- `POST /products/` → create product
- `GET /variants/` → list variants
- `POST /variants/` → create variant
- `POST /products/{id}/generate-sub-variants/` → generate sub-variants
- `GET /stock-transactions/` → list transactions
- `POST /stock-transactions/` → create transaction
- `GET /sub-variants/` → list sub-variants

All endpoints (except `/token/`) require header: `Authorization: Bearer <access_token>`

---

## 🎯 Key Features

### ✅ State Management
- Auth state in Context API
- Page data in local useState
- Simple, traceable data flow

### ✅ Error Handling
- HTTP 400 → "Please fix the highlighted fields"
- HTTP 404 → "Item not found"
- HTTP 409 → "Conflict (e.g., duplicate)"
- HTTP 500 → "Server error"
- Network errors handled gracefully

### ✅ Form Validation
- Required field checks
- Length validation
- Stock availability checks
- Inline error messages

### ✅ Responsive Design
- Desktop (1200px+)
- Tablet (768px)
- Mobile (375px)
- All layouts tested with Tailwind

---

## 🚀 Deploying to Production

### Build
```bash
npm run build
```

This creates a `dist/` folder with optimized production code.

### Deploy
Upload `dist/` to any static host:
- Vercel (`vercel deploy`)
- Netlify (drag & drop or `netlify deploy`)
- GitHub Pages, AWS S3, etc.

---

## 📖 Documentation

For more details, see:
- `README.md` — Architecture & design decisions
- `BUILD_SUMMARY.md` — What was built
- `IMPLEMENTATION_COMPLETE.md` — Full technical summary

---

## ❓ Questions?

Each component and page has inline comments explaining the "why" for interview preparation.

Start with `src/App.jsx` to trace the routing, then explore individual pages.

Happy coding! 🎉
