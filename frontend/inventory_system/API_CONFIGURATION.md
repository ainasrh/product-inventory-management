# API Configuration - Ultra Simple Setup

## Overview

All API configuration is directly in the code. No .env files, no environment variables - just edit the config file directly.

## Configuration File

**`src/config/apiConfig.js`** - All API settings in one place:

```javascript
export const apiConfig = {
  // Change this URL if your Django server runs on different port
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10000,
  defaultPageSize: 10,
};
```

## Changing API URL

### Method 1: Edit Config File Directly (Recommended)
```javascript
// In src/config/apiConfig.js
export const apiConfig = {
  baseURL: 'http://localhost:8000/api',  // Change this line
  timeout: 10000,
  defaultPageSize: 10,
};
```

### Method 2: Runtime Override (For Testing)
```javascript
import { setApiBaseURL } from './config/apiConfig';
setApiBaseURL('http://localhost:3001/api');
```

## Common Django Server URLs

Just change the `baseURL` in `apiConfig.js` to match your Django server:

```javascript
// Default Django development server
baseURL: 'http://127.0.0.1:8000/api',

// Alternative localhost
baseURL: 'http://localhost:8000/api',

// Different port
baseURL: 'http://127.0.0.1:3001/api',

// Docker container
baseURL: 'http://localhost:8080/api',
```

## Starting the Backend

Make sure your Django server is running:
```bash
cd backend/inventory_system
python manage.py runserver
# or on different port:
python manage.py runserver 127.0.0.1:3001
```

## CORS Configuration

Ensure your Django `settings.py` allows frontend requests:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
]
```

## Troubleshooting

**Backend Not Found:**
1. Check Django server is running: `python manage.py runserver`
2. Edit `src/config/apiConfig.js` to match Django server URL
3. Restart frontend: `npm run dev`

**Wrong Port:**
1. Change `baseURL` in `src/config/apiConfig.js`
2. Restart frontend dev server

That's it! Maximum simplicity for the machine task.