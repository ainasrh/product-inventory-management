# Product Inventory & Stock Management System

A comprehensive full-stack web application for managing product inventory with variant tracking and stock management. Built with Django REST Framework (backend) and React.js (frontend).

[![Django](https://img.shields.io/badge/Django-6.0-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Deployment](#-deployment)

---

## ✨ Features

### Core Features
- ✅ **Product Management** - Create, read, update, and delete products
- ✅ **Dynamic Variants** - Add multiple variants (size, color, etc.) to products
- ✅ **Auto-Generated Sub-Variants** - Automatic Cartesian product generation
- ✅ **Stock Management** - Track inventory with purchase and sale transactions
- ✅ **Stock Validation** - Prevent negative stock levels
- ✅ **Real-Time Stock Updates** - Automatic TotalStock synchronization
- ✅ **Stock Report** - Comprehensive transaction history with filters
- ✅ **Search & Filter** - Advanced product search and filtering
- ✅ **Pagination** - Efficient data loading with configurable page sizes
- ✅ **Responsive UI** - Works seamlessly on desktop and tablet devices

### Bonus Features Implemented
- 🎁 **JWT Authentication** - Secure token-based authentication
- 🎁 **Role-Based Access Control** - Admin-only routes for sensitive operations
- 🎁 **Product Image Upload** - Support for product images with thumbnails
- 🎁 **CSV Export** - Export stock reports to CSV format
- 🎁 **Soft Delete** - Products marked inactive instead of hard deletion

---

## 🛠 Tech Stack

### Backend
- **Framework:** Django 6.0.6
- **REST API:** Django REST Framework 3.17.1
- **Database:** PostgreSQL 14+ (using psycopg2-binary)
- **Authentication:** JWT (djangorestframework-simplejwt 5.5.1)
- **Image Handling:** django-versatileimagefield 3.1
- **API Documentation:** drf-spectacular 0.29.0
- **CORS:** django-cors-headers 4.9.0
- **Filtering:** django-filter 25.2

### Frontend
- **Framework:** React.js 18+
- **Routing:** React Router DOM 6.28.0
- **HTTP Client:** Axios 1.7.7
- **State Management:** React Context API
- **Styling:** Tailwind CSS 3.3.6
- **Notifications:** React Hot Toast 2.4.1
- **Build Tool:** Vite 8.0.12

### Database
- **PostgreSQL 14+**

---

## 📦 Prerequisites

Ensure you have the following installed on your system:

- **Python:** 3.10 or higher
- **Node.js:** 18.0 or higher
- **npm:** 9.0 or higher
- **PostgreSQL:** 14.0 or higher
- **Git:** Latest version

### Check Versions

```bash
# Check Python version
python --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd product-inventory-management
```

### 2. Backend Setup

#### Step 2.1: Navigate to Backend Directory

```bash
cd backend/inventory_system
```

#### Step 2.2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 2.3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Step 2.4: Configure Environment Variables

```bash
# Copy the example environment file
copy .env.example .env       # Windows
# OR
cp .env.example .env         # macOS/Linux
```

Edit `.env` file with your settings:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Generate a Secret Key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### Step 2.5: Create PostgreSQL Database

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE inventory_db;

# Exit PostgreSQL
\q
```

#### Step 2.6: Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Step 2.7: Create Superuser (Admin Account)

```bash
python manage.py createsuperuser
```

Follow the prompts to create your admin account:
- Username: (e.g., admin)
- Email: (optional)
- Password: (enter a secure password)

**Important:** This superuser account will have admin privileges and can:
- Create, edit, and delete products
- Manage stock transactions
- Access all admin-only features
- Access Django admin panel at http://127.0.0.1:8000/admin/

#### Step 2.8: Create Media Directory (Optional)

```bash
mkdir -p media/uploads
```

### 3. Frontend Setup

#### Step 3.1: Navigate to Frontend Directory

```bash
# From project root
cd frontend/inventory_system
```

#### Step 3.2: Install Node Dependencies

```bash
npm install
```

#### Step 3.3: Configure API Endpoint (Optional)

The API endpoint is already configured in `src/config/apiConfig.js`:

```javascript
// Default: http://127.0.0.1:8000/api
export const API_CONFIG = {
  baseURL: 'http://127.0.0.1:8000/api',
};
```

If your backend runs on a different port, update this file.

---

## ▶️ Running the Application

### Start Backend Server

```bash
# Navigate to backend directory (if not already there)
cd backend/inventory_system

# Activate virtual environment
venv\Scripts\activate    # Windows
source venv/bin/activate # macOS/Linux

# Run Django development server
python manage.py runserver
```

The backend API will be available at: **http://127.0.0.1:8000/api/**

Django Admin panel: **http://127.0.0.1:8000/admin/**

### Start Frontend Server

**Open a new terminal window:**

```bash
# Navigate to frontend directory
cd frontend/inventory_system

# Start Vite development server
npm run dev
```

The frontend application will be available at: **http://localhost:5173/**

---

## 📚 API Documentation

### Swagger UI (Interactive API Documentation)

Once the backend server is running, access the interactive API documentation at:

**Swagger UI:** http://127.0.0.1:8000/api/docs/

**OpenAPI Schema:** http://127.0.0.1:8000/api/schema/

### API Endpoints Overview

#### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/token/refresh/` - Refresh access token

#### Products
- `GET /api/products/` - List all products (paginated, searchable)
- `POST /api/products/` - Create new product with variants
- `GET /api/products/{id}/` - Get product details
- `PUT/PATCH /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product (soft delete)

#### Variants
- `GET /api/products/{id}/variants/` - List product variants
- `POST /api/products/{id}/variants/` - Add variant to product
- `PUT /api/variants/{id}/` - Update variant
- `DELETE /api/variants/{id}/` - Delete variant

#### Sub-Variants
- `GET /api/products/{id}/subvariants/` - List generated sub-variants

#### Stock Management
- `POST /api/stock/purchase/` - Add stock (purchase)
- `POST /api/stock/sale/` - Remove stock (sale)
- `GET /api/stock/` - Get current stock levels
- `GET /api/stock/report/` - Get stock transaction report (filterable)

### Sample API Requests

**Create Product:**
```json
POST /api/products/
{
  "ProductName": "T-Shirt",
  "ProductCode": "TSHIRT-001",
  "HSNCode": "6109",
  "variants": [
    {
      "name": "Size",
      "options": ["S", "M", "L", "XL"]
    },
    {
      "name": "Color",
      "options": ["Red", "Blue", "Black"]
    }
  ]
}
```

**Add Stock:**
```json
POST /api/stock/purchase/
{
  "sub_variant_id": "uuid-here",
  "quantity": 100,
  "notes": "Initial stock from supplier"
}
```

---

## 📁 Project Structure

```
product-inventory-management/
│
├── backend/
│   └── inventory_system/
│       ├── app/                      # Main application
│       │   ├── models.py            # Database models
│       │   ├── serializers.py       # DRF serializers
│       │   ├── views.py             # API views
│       │   ├── services.py          # Business logic
│       │   ├── filters.py           # Query filters
│       │   ├── admin.py             # Django admin config
│       │   └── urls.py              # App URL routing
│       ├── authentication/          # JWT auth app
│       ├── inventory_system/        # Project settings
│       │   ├── settings.py          # Django settings
│       │   └── urls.py              # Main URL routing
│       ├── logs/                    # Application logs
│       ├── media/                   # Uploaded files
│       ├── manage.py                # Django management
│       ├── .env.example             # Environment template
│       └── requirements.txt         # Python dependencies
│
└── frontend/
    └── inventory_system/
        ├── src/
        │   ├── api.js               # Axios configuration
        │   ├── components/          # Reusable components
        │   ├── config/              # App configuration
        │   ├── constants/           # Constants
        │   ├── context/             # React Context (Auth)
        │   ├── layout/              # Layout components
        │   ├── pages/               # Page components
        │   ├── services/            # API service layer
        │   └── utils/               # Utility functions
        ├── .env.example             # Environment template
        ├── package.json             # Node dependencies
        ├── tailwind.config.js       # Tailwind configuration
        └── vite.config.js           # Vite configuration
```

---

## 📖 Usage Guide

### First Time Setup

1. **Access the Application**
   - Open browser and go to http://localhost:5173/

2. **Login with Admin Account**
   - Use the superuser credentials you created during setup
   - Regular users can view products only
   - Admin users can create/edit/delete products and manage stock

3. **Create Your First Product**
   - Click "New Product" button
   - Fill in product details
   - Add variants (e.g., Size: S, M, L)
   - Preview generated sub-variants
   - Submit to create

4. **Add Stock**
   - Go to "Stock Management"
   - Select product and sub-variant
   - Enter quantity
   - Choose "Add Stock" or "Remove Stock"

5. **View Reports**
   - Go to "Stock Report"
   - Apply filters (date range, product, transaction type)
   - Export to CSV if needed

### User Roles

**Admin User (Superuser):**
- ✅ View all products
- ✅ Create new products
- ✅ Edit products
- ✅ Delete/Deactivate products
- ✅ Manage stock (purchase/sale)
- ✅ View stock reports
- ✅ Access Django admin panel

**Regular User:**
- ✅ View products
- ❌ Cannot create/edit/delete
- ❌ Cannot manage stock







## 🎯 Key Features Demonstrated

This project demonstrates proficiency in:

✅ **Backend Development**
- RESTful API design
- Database modeling (PostgreSQL)
- ORM usage (Django ORM)
- Authentication & Authorization (JWT)
- Query optimization (select_related, prefetch_related)
- Error handling & validation
- Logging & debugging
- Transaction management

✅ **Frontend Development**
- React.js (Hooks, Context API)
- Component architecture
- State management
- API integration
- Form handling & validation
- Responsive design
- User experience (UX)

✅ **Full-Stack Integration**
- API consumption
- Authentication flow
- Real-time data updates
- File uploads
- Error handling
- CORS configuration

---


