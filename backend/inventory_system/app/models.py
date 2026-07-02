import uuid
import hashlib
from django.db import models
from versatileimagefield.fields import VersatileImageField


class Products(models.Model):
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ProductID     = models.BigIntegerField(unique=True)
    ProductCode   = models.CharField(max_length=255, unique=True)
    ProductName   = models.CharField(max_length=255)
    ProductImage  = VersatileImageField(upload_to='uploads/', blank=True, null=True)
    CreatedDate   = models.DateTimeField(auto_now_add=True)
    UpdatedDate   = models.DateTimeField(blank=True, null=True)
    CreatedUser   = models.ForeignKey(
        'auth.User',
        related_name='prodcuts',
        on_delete=models.CASCADE,
    )
    IsFavourite   = models.BooleanField(default=False)
    Active        = models.BooleanField(default=True)
    HSNCode       = models.CharField(max_length=255, blank=True, null=True)
    TotalStock    = models.DecimalField(
        default=0.00, max_digits=20, decimal_places=2, blank=True, null=True,
    )

    class Meta:
        db_table            = 'products_product'
        verbose_name        = ('product')
        verbose_name_plural = ('products')
        unique_together     = (('ProductCode', 'ProductID'),)
        ordering            = ('-CreatedDate', 'ProductID')

    def __str__(self):
        return f"{self.ProductCode} - {self.ProductName}"


class ProductVariant(models.Model):

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product    = models.ForeignKey(
        Products, related_name='variants', on_delete=models.CASCADE, db_index=True,
    )
    name       = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (('product', 'name'),)
        indexes = [models.Index(fields=['product', 'name'])]

    def __str__(self):
        return f"{self.product.ProductName} - {self.name}"


class VariantOption(models.Model):
    

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    variant    = models.ForeignKey(
        ProductVariant, related_name='options', on_delete=models.CASCADE, db_index=True,
    )
    value      = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('variant', 'value'),)

    def __str__(self):
        return f"{self.variant.name}: {self.value}"


class SubVariant(models.Model):
 
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product          = models.ForeignKey(
        Products, related_name='sub_variants', on_delete=models.CASCADE, db_index=True,
    )
    options          = models.ManyToManyField(VariantOption, related_name='sub_variants')
    sku              = models.CharField(max_length=255, unique=True, db_index=True)
    stock            = models.DecimalField(
        default=0, max_digits=20, decimal_places=2,
    )
    price            = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['product', 'sku'])]

    def __str__(self):
        return self.sku


class StockTransaction(models.Model):
    

    class TransactionType(models.TextChoices):
        PURCHASE   = 'PURCHASE',   ('Purchase (Stock In)')
        SALE       = 'SALE',       ('Sale (Stock Out)')
        ADJUSTMENT = 'ADJUSTMENT', ('Manual Adjustment')

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product          = models.ForeignKey(
        Products, related_name='stock_transactions',
        on_delete=models.CASCADE, db_index=True,
    )
    sub_variant      = models.ForeignKey(
        SubVariant, related_name='stock_transactions',
        on_delete=models.CASCADE, null=True, blank=True, db_index=True,
    )
    transaction_type = models.CharField(
        max_length=20, choices=TransactionType.choices, db_index=True,
    )
    quantity         = models.DecimalField(max_digits=20, decimal_places=2)
    notes            = models.TextField(blank=True, null=True)
    created_by       = models.ForeignKey(
        'auth.User', related_name='stock_transactions',
        on_delete=models.SET_NULL, null=True,
    )
    created_at       = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=['product', 'created_at']),
            models.Index(fields=['transaction_type']),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.quantity} - {self.product.ProductCode}"