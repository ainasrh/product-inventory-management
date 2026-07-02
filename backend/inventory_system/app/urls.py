from django.urls import path

from .views import (
    ProductListCreateAPIView,
    ProductDetailAPIView,
    ProductVariantListCreateAPIView,
    ProductVariantDetailAPIView,
    SubVariantListAPIView,
    StockPurchaseAPIView,
    StockSaleAPIView,
    StockLevelListAPIView,
    StockReportAPIView,
)

urlpatterns = [
    # Products
    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('products/<uuid:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),

    # Variants
    path('products/<uuid:pk>/variants/', ProductVariantListCreateAPIView.as_view(), name='product-variant-list-create'),
    path('variants/<uuid:pk>/', ProductVariantDetailAPIView.as_view(), name='variant-detail'),

    # Sub-variants
    path('products/<uuid:pk>/subvariants/', SubVariantListAPIView.as_view(), name='product-subvariant-list'),

    # Stock
    path('stock/purchase/', StockPurchaseAPIView.as_view(), name='stock-purchase'),
    path('stock/sale/', StockSaleAPIView.as_view(), name='stock-sale'),
    path('stock/', StockLevelListAPIView.as_view(), name='stock-levels'),
    path('stock/report/', StockReportAPIView.as_view(), name='stock-report'),
]
