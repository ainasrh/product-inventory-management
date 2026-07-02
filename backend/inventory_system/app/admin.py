from django.contrib import admin

from .models import Products, ProductVariant, VariantOption, SubVariant, StockTransaction


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------

class VariantOptionInline(admin.TabularInline):
    model = VariantOption
    extra = 1
    fields = ('value',)
    readonly_fields = ('id',)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ('name',)
    readonly_fields = ('id',)
    show_change_link = True


class SubVariantInline(admin.TabularInline):
    model = SubVariant
    extra = 0
    fields = ('sku', 'stock', 'price')
    readonly_fields = ('id', 'sku')


# ---------------------------------------------------------------------------
# Model Admins
# ---------------------------------------------------------------------------

@admin.register(Products)
class ProductsAdmin(admin.ModelAdmin):
    list_display = (
        'ProductCode', 'ProductName', 'TotalStock',
        'Active', 'IsFavourite', 'CreatedDate',
    )
    list_filter = ('Active', 'IsFavourite')
    search_fields = ('ProductName', 'ProductCode', 'HSNCode')
    readonly_fields = ('id', 'ProductID', 'CreatedDate', 'UpdatedDate', 'TotalStock')
    inlines = [ProductVariantInline, SubVariantInline]
    ordering = ('-CreatedDate',)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'created_at')
    list_filter = ('product',)
    search_fields = ('name', 'product__ProductName')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [VariantOptionInline]


@admin.register(VariantOption)
class VariantOptionAdmin(admin.ModelAdmin):
    list_display = ('variant', 'value', 'created_at')
    list_filter = ('variant__product',)
    search_fields = ('value', 'variant__name')
    readonly_fields = ('id', 'created_at')


@admin.register(SubVariant)
class SubVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'sku', 'stock', 'price', 'created_at')
    list_filter = ('product',)
    search_fields = ('sku', 'product__ProductCode')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'product', 'sub_variant', 'transaction_type',
        'quantity', 'created_by', 'created_at',
    )
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('product__ProductCode', 'notes')
    readonly_fields = ('id', 'created_at')
    ordering = ('-created_at',)
