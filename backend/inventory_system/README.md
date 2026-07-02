# Product Inventory System — Django REST API

A production-quality REST API for managing products, configurable variants/sub-variants, and stock transactions (purchase/sale) with full data integrity guarantees.

## Tech Stack

- **Backend:** Django 6 + Django REST Framework
- **Database:** PostgreSQL
- **Auth:** JWT (Simple JWT)
- **Docs:** drf-spectacular (Swagger/OpenAPI)

---

## Setup

### 1. Clone & create virtual environment

```bash
cd backend/inventory_system
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure database

Create a PostgreSQL database named `inventory_system` and edit `.env`:

```env
DB_NAME=inventory_system
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### 4. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create superuser

```bash
python manage.py createsuperuser
```

### 6. Start server

```bash
python manage.py runserver
```

### 7. Access

- **API:** http://localhost:8000/api/
- **Swagger Docs:** http://localhost:8000/api/docs/
- **Admin:** http://localhost:8000/admin/

---

## Authentication

All API endpoints require JWT authentication.

### Obtain token

```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

Use the `access` token in subsequent requests:

```
Authorization: Bearer <access_token>
```

---

## API Endpoints & Example Requests

### Products

#### Create product with variants

```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Shirt",
    "ProductCode": "PROD-001",
    "HSNCode": "6205",
    "variants": [
      {"name": "size", "options": ["S", "M", "L"]},
      {"name": "color", "options": ["Red", "Blue", "Black"]}
    ]
  }'
```

This auto-generates 9 sub-variants (3 sizes × 3 colors).

#### List products (paginated)

```bash
curl http://localhost:8000/api/products/?page=1&page_size=10 \
  -H "Authorization: Bearer <token>"
```

#### Get single product

```bash
curl http://localhost:8000/api/products/<product-uuid>/ \
  -H "Authorization: Bearer <token>"
```

#### Update product

```bash
curl -X PUT http://localhost:8000/api/products/<product-uuid>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ProductName": "Premium Shirt", "HSNCode": "6205A"}'
```

#### Soft-delete product

```bash
curl -X DELETE http://localhost:8000/api/products/<product-uuid>/ \
  -H "Authorization: Bearer <token>"
```

---

### Variants

#### Add variant to product

```bash
curl -X POST http://localhost:8000/api/products/<product-uuid>/variants/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "material", "options": ["Cotton", "Polyester"]}'
```

#### List variants

```bash
curl http://localhost:8000/api/products/<product-uuid>/variants/ \
  -H "Authorization: Bearer <token>"
```

#### Update variant

```bash
curl -X PUT http://localhost:8000/api/variants/<variant-uuid>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "size", "options": ["XS", "S", "M", "L", "XL"]}'
```

#### Delete variant

```bash
curl -X DELETE http://localhost:8000/api/variants/<variant-uuid>/ \
  -H "Authorization: Bearer <token>"
```

#### List sub-variants

```bash
curl http://localhost:8000/api/products/<product-uuid>/subvariants/ \
  -H "Authorization: Bearer <token>"
```

---

### Stock

#### Add stock (purchase)

```bash
curl -X POST http://localhost:8000/api/stock/purchase/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sub_variant_id": "<sub-variant-uuid>",
    "quantity": 50,
    "notes": "Initial stock from supplier"
  }'
```

#### Remove stock (sale)

```bash
curl -X POST http://localhost:8000/api/stock/sale/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sub_variant_id": "<sub-variant-uuid>",
    "quantity": 5,
    "notes": "Customer order #1234"
  }'
```

> **Note:** Selling more than available stock returns `409 Conflict`.

#### Current stock levels

```bash
curl http://localhost:8000/api/stock/ \
  -H "Authorization: Bearer <token>"
```

#### Stock report (filterable)

```bash
# All transactions
curl http://localhost:8000/api/stock/report/ \
  -H "Authorization: Bearer <token>"

# Filter by date range
curl "http://localhost:8000/api/stock/report/?start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer <token>"

# Filter by product and type
curl "http://localhost:8000/api/stock/report/?product_id=<uuid>&transaction_type=PURCHASE" \
  -H "Authorization: Bearer <token>"

# Paginated
curl "http://localhost:8000/api/stock/report/?page=1&page_size=20" \
  -H "Authorization: Bearer <token>"
```

---

## Running Tests

```bash
python manage.py test app -v 2
```

---

## Project Structure

```
inventory_system/
├── app/
│   ├── models.py         # Products, ProductVariant, VariantOption, SubVariant, StockTransaction
│   ├── serializers.py     # Read/write serializers for all models
│   ├── views.py           # API views (9 endpoints)
│   ├── urls.py            # URL routing
│   ├── services.py        # Business logic (sub-variant generation, stock mutations)
│   ├── filters.py         # django-filter FilterSets
│   ├── admin.py           # Django admin registration
│   └── tests.py           # Comprehensive test suite
├── inventory_system/
│   ├── settings.py        # Django configuration
│   └── urls.py            # Root URL config
├── requirements.txt
├── manage.py
└── .env
```
