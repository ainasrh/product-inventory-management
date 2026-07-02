"""
DRF serializers for the Product Inventory System.

Conventions
-----------
* ``*CreateSerializer`` — write-only (POST / PUT)
* ``*Serializer`` (without suffix) — read-only unless noted
* Nested creation logic is thin; heavy lifting lives in ``services.py``.
"""

import logging
from decimal import Decimal

from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Products,
    ProductVariant,
    VariantOption,
    SubVariant,
    StockTransaction,
)
from .services import generate_sub_variants

logger = logging.getLogger('app.serializers')


# ===================================================================
# Variant / Option — read
# ===================================================================

class VariantOptionSerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source="variant.name", read_only=True)
    class Meta:
        model  = VariantOption
        fields = ['id', 'variant_name','value']



class ProductVariantSerializer(serializers.ModelSerializer):
    options = VariantOptionSerializer(many=True, read_only=True)

    class Meta:
        model  = ProductVariant
        fields = ['id', 'name', 'options', 'created_at', 'updated_at']


# ===================================================================
# SubVariant — read
# ===================================================================

class SubVariantSerializer(serializers.ModelSerializer):
    options = VariantOptionSerializer(many=True, read_only=True)

    class Meta:
        model = SubVariant
        fields = ['id', 'sku', 'stock', 'price', 'options']


# ===================================================================
# Product — read (list)
# ===================================================================

class ProductListSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Products
        fields = [
            'id', 'ProductID', 'ProductCode', 'ProductName',
            'ProductImage', 'TotalStock', 'Active', 'IsFavourite',
            'HSNCode', 'CreatedDate',
        ]


# ===================================================================
# Product — read (detail)
# ===================================================================

class ProductDetailSerializer(serializers.ModelSerializer):
    variants     = ProductVariantSerializer(many=True, read_only=True)
    sub_variants = SubVariantSerializer(many=True, read_only=True)

    class Meta:
        model           = Products
        fields          = '__all__'
    
    def get_fields(self):
        fields = super().get_fields()

        variants = fields.pop("variants")
        sub_variants = fields.pop("sub_variants")

        fields["variants"] = variants
        fields["sub_variants"] = sub_variants

        return fields

# ===================================================================
# Product — create (nested)
# ===================================================================

class VariantInputSerializer(serializers.Serializer):
    """Inline variant definition used during product creation."""
    name    = serializers.CharField(max_length=100)
    options = serializers.ListField(
        child=serializers.CharField(max_length=100),
        min_length=1,
        help_text="List of option values, e.g. ['S', 'M', 'L']",
    )


class ProductCreateSerializer(serializers.Serializer):
    
    ProductName = serializers.CharField(max_length=255, help_text="Product name")
    ProductCode = serializers.CharField(max_length=255)
    HSNCode     = serializers.CharField(max_length=255, required=False, allow_blank=True)
    IsFavourite = serializers.BooleanField(required=False, default=False)
    Active      = serializers.BooleanField(required=False, default=True)
    variants    = VariantInputSerializer(many=True, required=False)

    def validate_ProductCode(self, value):
        if Products.objects.filter(ProductCode=value).exists():
            raise serializers.ValidationError(
                f"A product with code '{value}' already exists."
            )
        return value

    def validate_variants(self, value):
        
        names = [v['name'].lower() for v in value]
        if len(names) != len(set(names)):
            raise serializers.ValidationError(
                "Variant names must be unique within a product."
            )
        return value

    @db_transaction.atomic
    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        user = self.context['request'].user

        # Auto-generate ProductID
        last = Products.objects.order_by('-ProductID').values_list(
            'ProductID', flat=True,
        ).first()
        next_id = (last or 0) + 1

        product = Products.objects.create(
            ProductID=next_id,
            ProductCode=validated_data['ProductCode'],
            ProductName=validated_data['ProductName'],
            HSNCode=validated_data.get('HSNCode', ''),
            IsFavourite=validated_data.get('IsFavourite', False),
            Active=validated_data.get('Active', True),
            CreatedUser=user,
            TotalStock=Decimal('0'),
        )

        for var_data in variants_data:
            variant = ProductVariant.objects.create(
                product=product,
                name=var_data['name'],
            )
            for opt_value in var_data['options']:
                VariantOption.objects.create(
                    variant=variant,
                    value=opt_value,
                )

        
        if variants_data:
            generate_sub_variants(product)

        logger.info("Created product %s with %d variants", product.ProductCode, len(variants_data))
        return product

    def to_representation(self, instance):
        """Return the full detail view after creation."""
        return ProductDetailSerializer(instance, context=self.context).data


# ===================================================================
# Product — update
# ===================================================================

class ProductUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Products
        fields = [
            'ProductName', 'ProductCode', 'HSNCode',
            'IsFavourite', 'Active', 'ProductImage',
        ]

    def validate_ProductCode(self, value):
        instance = self.instance
        if (
            Products.objects
            .filter(ProductCode=value)
            .exclude(pk=instance.pk)
            .exists()
        ):
            raise serializers.ValidationError(
                f"A product with code '{value}' already exists."
            )
        return value

    def update(self, instance, validated_data):
        instance.UpdatedDate = timezone.now()
        return super().update(instance, validated_data)


# ===================================================================
# Variant — add to product
# ===================================================================

class AddVariantSerializer(serializers.Serializer):
    """POST /api/products/{id}/variants/"""
    name    = serializers.CharField(max_length=100)
    options = serializers.ListField(
        child=serializers.CharField(max_length=100),
        min_length=1,
    )

    def validate_name(self, value):
        product = self.context['product']
        if ProductVariant.objects.filter(product=product, name__iexact=value).exists():
            raise serializers.ValidationError(
                f"Variant '{value}' already exists for this product."
            )
        return value

    @db_transaction.atomic
    def create(self, validated_data):
        product = self.context['product']
        variant = ProductVariant.objects.create(
            product=product,
            name=validated_data['name'],
        )
        for opt_value in validated_data['options']:
            VariantOption.objects.create(variant=variant, value=opt_value)

        # Regenerate sub-variants
        generate_sub_variants(product)
        logger.info(
            "Added variant '%s' to product %s; sub-variants regenerated",
            variant.name, product.ProductCode,
        )
        return variant

    def to_representation(self, instance):
        return ProductVariantSerializer(instance).data


# ===================================================================
# Variant — update
# ===================================================================

class VariantUpdateSerializer(serializers.Serializer):
    """PUT /api/variants/{id}/"""
    name    = serializers.CharField(max_length=100, required=False)
    options = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
    )

    @db_transaction.atomic
    def update(self, instance, validated_data):
        product = instance.product

        if 'name' in validated_data:
            new_name = validated_data['name']
            if (
                ProductVariant.objects
                .filter(product=product, name__iexact=new_name)
                .exclude(pk=instance.pk)
                .exists()
            ):
                raise serializers.ValidationError({
                    'name': f"Variant '{new_name}' already exists for this product."
                })
            instance.name = new_name
            instance.save(update_fields=['name', 'updated_at'])

        if 'options' in validated_data:
            # Replace all options
            instance.options.all().delete()
            for opt_value in validated_data['options']:
                VariantOption.objects.create(variant=instance, value=opt_value)

            # Regenerate sub-variants
            generate_sub_variants(product)

        logger.info("Updated variant '%s' (pk=%s)", instance.name, instance.pk)
        return instance

    def to_representation(self, instance):
        instance.refresh_from_db()
        return ProductVariantSerializer(instance).data


# ===================================================================
# Stock transaction — create (purchase / sale)
# ===================================================================

class StockTransactionCreateSerializer(serializers.Serializer):
    """Shared serializer for POST /api/stock/purchase/ and POST /api/stock/sale/."""
    sub_variant_id = serializers.UUIDField()
    quantity       = serializers.DecimalField(max_digits=20, decimal_places=8)
    notes          = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate_sub_variant_id(self, value):
        if not SubVariant.objects.filter(pk=value).exists():
            raise serializers.ValidationError(
                f"SubVariant with id '{value}' does not exist."
            )
        return value


# ===================================================================
# Stock transaction — read
# ===================================================================

class StockTransactionSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source='product.ProductCode', read_only=True)
    product_name = serializers.CharField(source='product.ProductName', read_only=True)
    sub_variant_sku = serializers.CharField(
        source='sub_variant.sku', read_only=True, default=None,
    )

    class Meta:
        model  = StockTransaction
        fields = [
            'id', 'product', 'product_code', 'product_name',
            'sub_variant', 'sub_variant_sku',
            'transaction_type', 'quantity', 'notes',
            'created_by', 'created_at',
        ]
        read_only_fields = fields


# ===================================================================
# Stock levels — read
# ===================================================================

class StockLevelSerializer(serializers.ModelSerializer):
    """Flat view of current stock per sub-variant."""
    product_id   = serializers.UUIDField(source='product.id')
    product_code = serializers.CharField(source='product.ProductCode')
    product_name = serializers.CharField(source='product.ProductName')
    options      = VariantOptionSerializer(many=True, read_only=True)

    class Meta:
        model  = SubVariant
        fields = [
            'id', 'product_id', 'product_code', 'product_name',
            'sku', 'stock', 'options',
        ]