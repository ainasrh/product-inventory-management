"""
API views for the Product Inventory System.

All list endpoints are paginated. All write endpoints are wrapped in
``transaction.atomic()`` (either here or in the service / serializer layer).
Consistent JSON error responses throughout.
"""

import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction as db_transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema


from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from django_filters.rest_framework import DjangoFilterBackend

from .models import Products, ProductVariant, SubVariant, StockTransaction
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
    ProductVariantSerializer,
    AddVariantSerializer,
    VariantUpdateSerializer,
    SubVariantSerializer,
    StockTransactionCreateSerializer,
    StockTransactionSerializer,
    StockLevelSerializer,
)
from .filters import StockReportFilter
from .services import create_stock_transaction, generate_sub_variants

logger = logging.getLogger('app.views')


# ===================================================================
# Custom pagination
# ===================================================================

class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ===================================================================
# Helpers
# ===================================================================

def _error_response(message, status_code, errors=None):
    
    body = {
        'status': 'error',
        'message': message,
    }
    if errors:
        human_readable = []
        if isinstance(errors, dict):
            for field, msgs in errors.items():
                msg_str = " ".join(str(m) for m in msgs) if isinstance(msgs, list) else str(msgs)
                if field in ["non_field_errors", "detail"]:
                    human_readable.append(msg_str)
                else:
                    human_readable.append(f"Field '{field}': {msg_str}")
        else:
            human_readable.append(str(errors))
            
        body['errors'] = human_readable
        error_summary = " | ".join(human_readable)
        print(f"\n[API ERROR {status_code}] {message}: {error_summary}\n")
    else:
        print(f"\n[API ERROR {status_code}] {message}\n")

    return Response(body, status=status_code)


from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    """
    Catches all DRF exceptions (like validation errors from Generic views),
    formats them to be human-readable, and prints them to the terminal.
    """
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        human_readable = []
        
        if isinstance(errors, dict):
            for field, msgs in errors.items():
                msg_str = " ".join(str(m) for m in msgs) if isinstance(msgs, list) else str(msgs)
                if field in ["non_field_errors", "detail"]:
                    human_readable.append(msg_str)
                else:
                    human_readable.append(f"Field '{field}': {msg_str}")
        elif isinstance(errors, list):
            human_readable = [str(e) for e in errors]
        else:
            human_readable.append(str(errors))

        error_summary = " | ".join(human_readable)
        print(f"\n[API ERROR {response.status_code}] {error_summary}\n")

        response.data = {
            'status': 'error',
            'message': 'Validation failed' if response.status_code == 400 else 'An error occurred',
            'errors': human_readable
        }

    return response


def _success_response(data, status_code=status.HTTP_200_OK, message='Success'):
    return Response(
        {'status': 'success', 'message': message, 'data': data},
        status=status_code,
    )


# ===================================================================
# PRODUCTS
# ===================================================================

class ProductListCreateAPIView(generics.ListCreateAPIView):
 
    pagination_class = StandardPagination
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['Active', 'IsFavourite']
    search_fields    = ['ProductName', 'ProductCode', 'HSNCode']

    def get_queryset(self):
        return (
            Products.objects
            .select_related('CreatedUser')
            .prefetch_related('variants__options', 'sub_variants__options')
            .all()
        )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return _error_response(
                'Validation failed', status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
            )
        product = serializer.save()
        logger.info("API: Created product %s", product.ProductCode)
        return _success_response(
            serializer.to_representation(product),
            status_code=status.HTTP_201_CREATED,
            message='Product created successfully',
        )


class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
 
    lookup_field = 'pk'

    def get_queryset(self):
        return (
            Products.objects
            .select_related('CreatedUser')
            .prefetch_related('variants__options', 'sub_variants__options')
            .all()
        )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProductUpdateSerializer
        return ProductDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ProductDetailSerializer(instance, context={'request': request})
        return _success_response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ProductUpdateSerializer(
            instance, data=request.data, partial=True, context={'request': request},
        )
        if not serializer.is_valid():
            return _error_response(
                'Validation failed', status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
            )
        product = serializer.save()
        logger.info("API: Updated product %s", product.ProductCode)
        detail = ProductDetailSerializer(product, context={'request': request})
        return _success_response(detail.data, message='Product updated successfully')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Soft-delete: set Active=False
        instance.Active = False
        instance.save(update_fields=['Active'])
        logger.info("API: Soft-deleted product %s", instance.ProductCode)
        return _success_response(
            {'id': str(instance.pk)},
            message='Product deactivated successfully',
        )


# ===================================================================
# VARIANTS
# ===================================================================

class ProductVariantListCreateAPIView(APIView):
    pagination_class = StandardPagination

    def get(self, request, pk):
        product = get_object_or_404(Products, pk=pk)
        variants = (
            ProductVariant.objects
            .filter(product=product)
            .prefetch_related('options')
            .order_by('name')
        )
        serializer = ProductVariantSerializer(variants, many=True)
        return _success_response(serializer.data)

    @extend_schema(
        request=AddVariantSerializer,
        responses=ProductVariantSerializer,
    )
    def post(self, request, pk):
        product = get_object_or_404(Products, pk=pk)
        serializer = AddVariantSerializer(
            data=request.data, context={'request': request, 'product': product},
        )
        if not serializer.is_valid():
            return _error_response(
                'Validation failed', status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
            )
        variant = serializer.save()
        logger.info(
            "API: Added variant '%s' to product %s",
            variant.name if hasattr(variant, 'name') else variant,
            product.ProductCode,
        )
        return _success_response(
            serializer.data,
            status_code=status.HTTP_201_CREATED,
            message='Variant added successfully; sub-variants regenerated',
        )


class ProductVariantDetailAPIView(APIView):
   

    def put(self, request, pk):
        variant = get_object_or_404(
            ProductVariant.objects.select_related('product').prefetch_related('options'),
            pk=pk,
        )
        serializer = VariantUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return _error_response(
                'Validation failed', status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
            )
        updated = serializer.update(variant, serializer.validated_data)
        logger.info("API: Updated variant %s", pk)
        return _success_response(
            serializer.to_representation(updated),
            message='Variant updated successfully',
        )

    @db_transaction.atomic
    def delete(self, request, pk):
        variant = get_object_or_404(
            ProductVariant.objects.select_related('product'),
            pk=pk,
        )
        product = variant.product
        variant_name = variant.name
        variant.delete()

        # Regenerate sub-variants after removing the variant
        generate_sub_variants(product)

        logger.info(
            "API: Deleted variant '%s' from product %s; sub-variants regenerated",
            variant_name, product.ProductCode,
        )
        return _success_response(
            {'deleted_variant': variant_name},
            message='Variant deleted; sub-variants regenerated',
        )


# ===================================================================
# SUB-VARIANTS
# ===================================================================

class SubVariantListAPIView(generics.ListAPIView):
    

    serializer_class = SubVariantSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        product = get_object_or_404(Products, pk=self.kwargs['pk'])
        return (
            SubVariant.objects
            .filter(product=product)
            .prefetch_related('options')
            .order_by('sku')
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return _success_response(serializer.data)


# ===================================================================
# STOCK
# ===================================================================

class StockPurchaseAPIView(APIView):

    @extend_schema(
        request=StockTransactionCreateSerializer,
        responses=StockTransactionSerializer,
    )
    def post(self, request):
        serializer = StockTransactionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return _error_response(
                'Validation failed', status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
            )

        try:
            txn = create_stock_transaction(
                sub_variant_id=serializer.validated_data['sub_variant_id'],
                transaction_type=StockTransaction.TransactionType.PURCHASE,
                quantity=serializer.validated_data['quantity'],
                notes=serializer.validated_data.get('notes', ''),
                user=request.user,
            )
        except DjangoValidationError as exc:
            return _error_response(str(exc.message), status.HTTP_400_BAD_REQUEST)

        logger.info("API: Stock purchase recorded (txn %s)", txn.pk)
        out = StockTransactionSerializer(txn).data
        return _success_response(out, status.HTTP_201_CREATED, 'Stock purchased successfully')


class StockSaleAPIView(APIView):
    
    @extend_schema(
        request=StockTransactionCreateSerializer,
        responses=StockTransactionSerializer,
    )
    def post(self, request):
        serializer = StockTransactionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return _error_response(
                'Validation failed', status.HTTP_400_BAD_REQUEST,
                errors=serializer.errors,
            )

        try:
            txn = create_stock_transaction(
                sub_variant_id=serializer.validated_data['sub_variant_id'],
                transaction_type=StockTransaction.TransactionType.SALE,
                quantity=serializer.validated_data['quantity'],
                notes=serializer.validated_data.get('notes', ''),
                user=request.user,
            )
        except DjangoValidationError as exc:
            msg = exc.message if hasattr(exc, 'message') else str(exc)
            if 'Insufficient stock' in str(msg):
                return _error_response(str(msg), status.HTTP_409_CONFLICT)
            return _error_response(str(msg), status.HTTP_400_BAD_REQUEST)

        logger.info("API: Stock sale recorded (txn %s)", txn.pk)
        out = StockTransactionSerializer(txn).data
        return _success_response(out, status.HTTP_201_CREATED, 'Stock sale recorded successfully')


class StockLevelListAPIView(generics.ListAPIView):
    

    serializer_class = StockLevelSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            SubVariant.objects
            .select_related('product')
            .prefetch_related('options')
            .order_by('product__ProductCode', 'sku')
        )


class StockReportAPIView(generics.ListAPIView):
   

    serializer_class = StockTransactionSerializer
    pagination_class = StandardPagination
    filter_backends  = [DjangoFilterBackend]
    filterset_class  = StockReportFilter

    def get_queryset(self):
        return (
            StockTransaction.objects
            .select_related('product', 'sub_variant', 'created_by')
            .order_by('-created_at')
        )