"""
Comprehensive test suite for the Product Inventory System.

Covers:
- Sub-variant generation (Cartesian product, idempotency, uniqueness)
- Stock transactions (purchase, sale, negative-stock guard, atomicity)
- Product CRUD API endpoints
- Variant management API endpoints
- Stock API endpoints (purchase, sale, levels, report)
- Pagination and filtering
"""

from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from .models import (
    Products,
    ProductVariant,
    VariantOption,
    SubVariant,
    StockTransaction,
)
from .services import (
    generate_sub_variants,
    create_stock_transaction,
)


# ===================================================================
# Helper mixin
# ===================================================================

class TestDataMixin:
    """Create shared test fixtures."""

    def _create_user(self, username='testuser', password='testpass123'):
        return User.objects.create_user(username=username, password=password)

    def _create_product(self, user, code='TEST-001', name='Test Shirt'):
        return Products.objects.create(
            ProductID=Products.objects.count() + 1,
            ProductCode=code,
            ProductName=name,
            CreatedUser=user,
            TotalStock=Decimal('0'),
        )

    def _add_variant_with_options(self, product, name, option_values):
        variant = ProductVariant.objects.create(product=product, name=name)
        for val in option_values:
            VariantOption.objects.create(variant=variant, value=val)
        return variant


# ===================================================================
# 1. Sub-variant generation tests
# ===================================================================

class SubVariantGenerationTests(TestCase, TestDataMixin):
    """Test Cartesian product generation of sub-variants."""

    def setUp(self):
        self.user = self._create_user()
        self.product = self._create_product(self.user)

    def test_single_variant_generates_correct_subvariants(self):
        """One variant with 3 options → 3 sub-variants."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M', 'L'])
        result = generate_sub_variants(self.product)
        self.assertEqual(len(result), 3)

    def test_two_variants_cartesian_product(self):
        """2 sizes × 3 colors = 6 sub-variants."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        self._add_variant_with_options(self.product, 'color', ['Red', 'Blue', 'Black'])
        result = generate_sub_variants(self.product)
        self.assertEqual(len(result), 6)

    def test_three_variants_cartesian_product(self):
        """2 × 3 × 2 = 12 sub-variants."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        self._add_variant_with_options(self.product, 'color', ['Red', 'Blue', 'Black'])
        self._add_variant_with_options(self.product, 'material', ['Cotton', 'Polyester'])
        result = generate_sub_variants(self.product)
        self.assertEqual(len(result), 12)

    def test_idempotency(self):
        """Calling generate_sub_variants twice produces the same count."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M', 'L'])
        generate_sub_variants(self.product)
        generate_sub_variants(self.product)
        self.assertEqual(SubVariant.objects.filter(product=self.product).count(), 3)

    def test_no_variants_clears_subvariants(self):
        """If all variants removed, sub-variants are deleted."""
        variant = self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        generate_sub_variants(self.product)
        self.assertEqual(SubVariant.objects.filter(product=self.product).count(), 2)

        variant.delete()
        generate_sub_variants(self.product)
        self.assertEqual(SubVariant.objects.filter(product=self.product).count(), 0)

    def test_unique_sku_generated(self):
        """Each sub-variant gets a unique SKU."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        generate_sub_variants(self.product)

        skus = list(
            SubVariant.objects
            .filter(product=self.product)
            .values_list('sku', flat=True)
        )
        self.assertEqual(len(skus), len(set(skus)))

    def test_regeneration_preserves_existing_stock(self):
        """Adding a new variant preserves stock on existing sub-variants."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        generate_sub_variants(self.product)

        # Add stock to the first sub-variant
        sv = SubVariant.objects.filter(product=self.product).first()
        sv.stock = Decimal('50')
        sv.save()

        # Add a new option to the same variant — sub-variants regenerated
        variant = ProductVariant.objects.get(product=self.product, name='size')
        VariantOption.objects.create(variant=variant, value='L')
        generate_sub_variants(self.product)

        # The original sub-variant should still exist with stock preserved
        sv.refresh_from_db()
        self.assertEqual(sv.stock, Decimal('50'))


# ===================================================================
# 2. Stock transaction tests
# ===================================================================

class StockTransactionTests(TestCase, TestDataMixin):
    """Test stock purchase, sale, negative guard, and atomicity."""

    def setUp(self):
        self.user = self._create_user()
        self.product = self._create_product(self.user)
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        generate_sub_variants(self.product)
        self.sv = SubVariant.objects.filter(product=self.product).first()

    def test_purchase_increases_stock(self):
        """A PURCHASE transaction increases sub-variant and product stock."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('100'),
            user=self.user,
        )
        self.sv.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(self.sv.stock, Decimal('100'))
        self.assertGreaterEqual(self.product.TotalStock, Decimal('100'))

    def test_sale_decreases_stock(self):
        """A SALE transaction decreases sub-variant stock."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('100'),
            user=self.user,
        )
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.SALE,
            quantity=Decimal('30'),
            user=self.user,
        )
        self.sv.refresh_from_db()
        self.assertEqual(self.sv.stock, Decimal('70'))

    def test_negative_stock_guard(self):
        """A sale exceeding available stock raises ValidationError."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('10'),
            user=self.user,
        )
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError) as ctx:
            create_stock_transaction(
                sub_variant_id=self.sv.pk,
                transaction_type=StockTransaction.TransactionType.SALE,
                quantity=Decimal('20'),
                user=self.user,
            )
        self.assertIn('Insufficient stock', str(ctx.exception))

    def test_zero_quantity_rejected(self):
        """Quantity of 0 is rejected."""
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            create_stock_transaction(
                sub_variant_id=self.sv.pk,
                transaction_type=StockTransaction.TransactionType.PURCHASE,
                quantity=Decimal('0'),
                user=self.user,
            )

    def test_negative_quantity_rejected(self):
        """Negative quantity is rejected."""
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            create_stock_transaction(
                sub_variant_id=self.sv.pk,
                transaction_type=StockTransaction.TransactionType.PURCHASE,
                quantity=Decimal('-5'),
                user=self.user,
            )

    def test_atomicity_on_failure(self):
        """On failed sale, no transaction record or stock change persists."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('10'),
            user=self.user,
        )
        initial_txn_count = StockTransaction.objects.count()

        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            create_stock_transaction(
                sub_variant_id=self.sv.pk,
                transaction_type=StockTransaction.TransactionType.SALE,
                quantity=Decimal('999'),
                user=self.user,
            )

        # No new transaction should have been created
        self.assertEqual(StockTransaction.objects.count(), initial_txn_count)
        # Stock unchanged
        self.sv.refresh_from_db()
        self.assertEqual(self.sv.stock, Decimal('10'))

    def test_product_total_stock_stays_in_sync(self):
        """Products.TotalStock equals sum of sub-variant stocks."""
        svs = list(SubVariant.objects.filter(product=self.product))
        for i, sv in enumerate(svs):
            create_stock_transaction(
                sub_variant_id=sv.pk,
                transaction_type=StockTransaction.TransactionType.PURCHASE,
                quantity=Decimal(str((i + 1) * 10)),
                user=self.user,
            )
        self.product.refresh_from_db()
        expected = sum(Decimal(str((i + 1) * 10)) for i in range(len(svs)))
        self.assertEqual(self.product.TotalStock, expected)

    def test_transaction_records_created(self):
        """Each stock mutation creates a StockTransaction record."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('50'),
            user=self.user,
        )
        txns = StockTransaction.objects.filter(sub_variant=self.sv)
        self.assertEqual(txns.count(), 1)
        self.assertEqual(txns.first().transaction_type, 'PURCHASE')
        self.assertEqual(txns.first().quantity, Decimal('50'))


# ===================================================================
# 3. Product API tests
# ===================================================================

class ProductAPITests(APITestCase, TestDataMixin):
    """Test product CRUD endpoints."""

    def setUp(self):
        self.user = self._create_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_product_with_variants(self):
        """POST /api/products/ with nested variants creates product + sub-variants."""
        data = {
            'ProductName': 'Shirt',
            'ProductCode': 'PROD-001',
            'HSNCode': '6205',
            'variants': [
                {'name': 'size', 'options': ['S', 'M', 'L']},
                {'name': 'color', 'options': ['Red', 'Blue']},
            ],
        }
        response = self.client.post('/api/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'success')

        product = Products.objects.get(ProductCode='PROD-001')
        self.assertEqual(product.ProductName, 'Shirt')
        self.assertEqual(product.variants.count(), 2)
        # 3 sizes × 2 colors = 6 sub-variants
        self.assertEqual(product.sub_variants.count(), 6)

    def test_create_product_without_variants(self):
        """POST /api/products/ without variants creates product only."""
        data = {
            'ProductName': 'Simple Product',
            'ProductCode': 'PROD-002',
        }
        response = self.client.post('/api/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        product = Products.objects.get(ProductCode='PROD-002')
        self.assertEqual(product.sub_variants.count(), 0)

    def test_create_product_duplicate_code_rejected(self):
        """Duplicate ProductCode returns 400."""
        self._create_product(self.user, code='DUP-001')
        data = {'ProductName': 'Dup', 'ProductCode': 'DUP-001'}
        response = self.client.post('/api/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_product_duplicate_variant_names_rejected(self):
        """Duplicate variant names in the same product are rejected."""
        data = {
            'ProductName': 'Bad Product',
            'ProductCode': 'BAD-001',
            'variants': [
                {'name': 'size', 'options': ['S']},
                {'name': 'size', 'options': ['M']},
            ],
        }
        response = self.client.post('/api/products/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_products_paginated(self):
        """GET /api/products/ returns paginated results."""
        for i in range(25):
            self._create_product(self.user, code=f'P-{i:03d}', name=f'Product {i}')
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Default page_size = 20
        self.assertEqual(len(response.data['results']), 20)

    def test_list_products_custom_page_size(self):
        """GET /api/products/?page_size=5 respects page_size."""
        for i in range(10):
            self._create_product(self.user, code=f'PS-{i:03d}', name=f'Product {i}')
        response = self.client.get('/api/products/?page_size=5')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 5)

    def test_retrieve_product(self):
        """GET /api/products/{id}/ returns full product detail."""
        product = self._create_product(self.user)
        response = self.client.get(f'/api/products/{product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['ProductCode'], 'TEST-001')

    def test_update_product(self):
        """PUT /api/products/{id}/ updates product fields."""
        product = self._create_product(self.user)
        response = self.client.put(
            f'/api/products/{product.pk}/',
            {'ProductName': 'Updated Shirt'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.ProductName, 'Updated Shirt')

    def test_soft_delete_product(self):
        """DELETE /api/products/{id}/ sets Active=False."""
        product = self._create_product(self.user)
        response = self.client.delete(f'/api/products/{product.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertFalse(product.Active)

    def test_retrieve_nonexistent_product_returns_404(self):
        """GET /api/products/{bad-id}/ returns 404."""
        import uuid
        response = self.client.get(f'/api/products/{uuid.uuid4()}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ===================================================================
# 4. Variant API tests
# ===================================================================

class VariantAPITests(APITestCase, TestDataMixin):
    """Test variant management endpoints."""

    def setUp(self):
        self.user = self._create_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.product = self._create_product(self.user)

    def test_add_variant_to_product(self):
        """POST /api/products/{id}/variants/ adds a variant and generates sub-variants."""
        data = {'name': 'size', 'options': ['S', 'M', 'L']}
        response = self.client.post(
            f'/api/products/{self.product.pk}/variants/',
            data, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.product.variants.count(), 1)
        self.assertEqual(self.product.sub_variants.count(), 3)

    def test_add_second_variant_regenerates_subvariants(self):
        """Adding a 2nd variant triggers Cartesian product regeneration."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        generate_sub_variants(self.product)
        self.assertEqual(self.product.sub_variants.count(), 2)

        data = {'name': 'color', 'options': ['Red', 'Blue']}
        response = self.client.post(
            f'/api/products/{self.product.pk}/variants/',
            data, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 2 sizes × 2 colors = 4
        self.assertEqual(self.product.sub_variants.count(), 4)

    def test_duplicate_variant_name_rejected(self):
        """Adding a variant with the same name returns 400."""
        self._add_variant_with_options(self.product, 'size', ['S'])
        data = {'name': 'size', 'options': ['M']}
        response = self.client.post(
            f'/api/products/{self.product.pk}/variants/',
            data, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_variants(self):
        """GET /api/products/{id}/variants/ lists all variants."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        self._add_variant_with_options(self.product, 'color', ['Red'])
        response = self.client.get(f'/api/products/{self.product.pk}/variants/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2)

    def test_update_variant_options(self):
        """PUT /api/variants/{id}/ replaces options and regenerates sub-variants."""
        variant = self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        generate_sub_variants(self.product)

        response = self.client.put(
            f'/api/variants/{variant.pk}/',
            {'options': ['XS', 'S', 'M', 'L', 'XL']},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.product.sub_variants.count(), 5)

    def test_delete_variant_cascades(self):
        """DELETE /api/variants/{id}/ removes variant and regenerates sub-variants."""
        v1 = self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        self._add_variant_with_options(self.product, 'color', ['Red', 'Blue'])
        generate_sub_variants(self.product)
        self.assertEqual(self.product.sub_variants.count(), 4)

        response = self.client.delete(f'/api/variants/{v1.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only color remains → 2 sub-variants
        self.assertEqual(self.product.sub_variants.count(), 2)

    def test_list_subvariants(self):
        """GET /api/products/{id}/subvariants/ returns generated sub-variants."""
        self._add_variant_with_options(self.product, 'size', ['S', 'M', 'L'])
        generate_sub_variants(self.product)
        response = self.client.get(f'/api/products/{self.product.pk}/subvariants/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)


# ===================================================================
# 5. Stock API tests
# ===================================================================

class StockAPITests(APITestCase, TestDataMixin):
    """Test stock purchase, sale, levels, and report endpoints."""

    def setUp(self):
        self.user = self._create_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.product = self._create_product(self.user)
        self._add_variant_with_options(self.product, 'size', ['S', 'M'])
        generate_sub_variants(self.product)
        self.sv = SubVariant.objects.filter(product=self.product).first()

    def test_stock_purchase(self):
        """POST /api/stock/purchase/ increases stock."""
        data = {
            'sub_variant_id': str(self.sv.pk),
            'quantity': '50',
            'notes': 'Initial stock',
        }
        response = self.client.post('/api/stock/purchase/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.sv.refresh_from_db()
        self.assertEqual(self.sv.stock, Decimal('50'))

    def test_stock_sale(self):
        """POST /api/stock/sale/ decreases stock."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('100'),
            user=self.user,
        )
        data = {
            'sub_variant_id': str(self.sv.pk),
            'quantity': '30',
            'notes': 'Customer order',
        }
        response = self.client.post('/api/stock/sale/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.sv.refresh_from_db()
        self.assertEqual(self.sv.stock, Decimal('70'))

    def test_stock_sale_insufficient_returns_409(self):
        """POST /api/stock/sale/ with insufficient stock returns 409."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('5'),
            user=self.user,
        )
        data = {
            'sub_variant_id': str(self.sv.pk),
            'quantity': '10',
        }
        response = self.client.post('/api/stock/sale/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('Insufficient stock', response.data['message'])

    def test_stock_purchase_zero_quantity_rejected(self):
        """POST /api/stock/purchase/ with quantity=0 returns 400."""
        data = {
            'sub_variant_id': str(self.sv.pk),
            'quantity': '0',
        }
        response = self.client.post('/api/stock/purchase/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stock_levels(self):
        """GET /api/stock/ returns current stock levels."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('25'),
            user=self.user,
        )
        response = self.client.get('/api/stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should contain our sub-variant
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_stock_report_returns_transactions(self):
        """GET /api/stock/report/ returns transaction history."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('50'),
            user=self.user,
        )
        response = self.client.get('/api/stock/report/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_stock_report_filter_by_type(self):
        """GET /api/stock/report/?transaction_type=PURCHASE filters correctly."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('50'),
            user=self.user,
        )
        response = self.client.get('/api/stock/report/?transaction_type=PURCHASE')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for txn in response.data['results']:
            self.assertEqual(txn['transaction_type'], 'PURCHASE')

    def test_stock_report_filter_by_product(self):
        """GET /api/stock/report/?product_id=<uuid> filters by product."""
        create_stock_transaction(
            sub_variant_id=self.sv.pk,
            transaction_type=StockTransaction.TransactionType.PURCHASE,
            quantity=Decimal('50'),
            user=self.user,
        )
        response = self.client.get(
            f'/api/stock/report/?product_id={self.product.pk}',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for txn in response.data['results']:
            self.assertEqual(str(txn['product']), str(self.product.pk))

    def test_stock_report_pagination(self):
        """Stock report supports page_size parameter."""
        for _ in range(5):
            create_stock_transaction(
                sub_variant_id=self.sv.pk,
                transaction_type=StockTransaction.TransactionType.PURCHASE,
                quantity=Decimal('10'),
                user=self.user,
            )
        response = self.client.get('/api/stock/report/?page_size=2')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertIn('next', response.data)
