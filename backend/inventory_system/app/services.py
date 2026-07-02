"""
Service layer for product inventory operations.

Keeps business logic out of views/serializers for testability.
All mutating operations run inside ``transaction.atomic()`` blocks.
"""

import itertools
import logging
from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import Sum
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import (
    Products,
    ProductVariant,
    VariantOption,
    SubVariant,
    StockTransaction,
)

logger = logging.getLogger('app.services')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_sku(product, option_values):
    """
    Build a human-readable SKU like ``PROD-001-Red-S``.

    *option_values* is a list of ``VariantOption.value`` strings,
    already sorted by variant name for determinism.
    """
    parts = [product.ProductCode] + list(option_values)
    return '-'.join(parts)


# ---------------------------------------------------------------------------
# Sub-variant generation
# ---------------------------------------------------------------------------

@db_transaction.atomic
def generate_sub_variants(product):
    
    variants = (
        ProductVariant.objects
        .filter(product=product)
        .prefetch_related('options')
        .order_by('name')
    )

    
    option_groups = []
    for variant in variants:
        opts = list(variant.options.all().order_by('value'))
        if opts:
            option_groups.append(opts)

    if not option_groups:
        
        deleted_count, _ = SubVariant.objects.filter(product=product).delete()
        if deleted_count:
            logger.info(
                "Deleted %d sub-variants for product %s (no variant options remain)",
                deleted_count, product.ProductCode,
            )
        _sync_product_total_stock(product)
        return []

    # Cartesian product of all option groups
    combos = list(itertools.product(*option_groups))
    logger.info(
        "Generating %d sub-variant combinations for product %s",
        len(combos), product.ProductCode,
    )

    # Map of frozenset(option_ids) -> combo tuple
    new_combos = {frozenset(opt.id for opt in combo): combo for combo in combos}

    existing_svs = (
        SubVariant.objects
        .filter(product=product)
        .prefetch_related('options')
    )

    stale_sv_ids = []
    kept_combos = set()

    for sv in existing_svs:
        opt_ids = frozenset(opt.id for opt in sv.options.all())
        # Keep one subvariant per valid new combination
        if opt_ids in new_combos and opt_ids not in kept_combos:
            kept_combos.add(opt_ids)
        else:
            stale_sv_ids.append(sv.id)

    # Find exactly which combinations need to be created
    combos_to_create = set(new_combos.keys()) - kept_combos
    created_sub_variants = []

    for option_ids in combos_to_create:
        combo = new_combos[option_ids]
        option_values = [opt.value for opt in combo]
        sku = _generate_sku(product, option_values)

        # Handle potential SKU collision (very unlikely but be safe)
        base_sku = sku
        counter = 1
        while SubVariant.objects.filter(sku=sku).exists():
            sku = f"{base_sku}-{counter}"
            counter += 1

        sv = SubVariant.objects.create(
            product=product,
            sku=sku,
            stock=Decimal('0'),
        )
        sv.options.set(option_ids)
        created_sub_variants.append(sv)

    # Remove stale or duplicate sub-variants
    if stale_sv_ids:
        deleted_count, _ = (
            SubVariant.objects
            .filter(id__in=stale_sv_ids)
            .delete()
        )
        logger.info(
            "Removed %d stale sub-variants for product %s",
            deleted_count, product.ProductCode,
        )

    if created_sub_variants:
        logger.info(
            "Created %d new sub-variants for product %s",
            len(created_sub_variants), product.ProductCode,
        )

    _sync_product_total_stock(product)

    return list(
        SubVariant.objects
        .filter(product=product)
        .prefetch_related('options')
    )


# ---------------------------------------------------------------------------
# Stock mutations
# ---------------------------------------------------------------------------

@db_transaction.atomic
def create_stock_transaction(
    *,
    sub_variant_id,
    transaction_type,
    quantity,
    notes=None,
    user=None,
):
    """
    Create a stock transaction and update sub-variant / product totals.

    Raises ``ValidationError`` if:
    - ``quantity <= 0``
    - A SALE would drive sub-variant stock negative

    The entire operation runs in a single atomic transaction so partial
    updates never persist.
    """
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than 0.")

    quantity = Decimal(str(quantity))

    try:
        # locking
        sub_variant = (
            SubVariant.objects
            .select_for_update()
            .select_related('product')
            .get(pk=sub_variant_id)
        )
    except SubVariant.DoesNotExist:
        raise ValidationError(f"SubVariant with id '{sub_variant_id}' does not exist.")

    product = sub_variant.product

    # Lock the product row too
    Products.objects.select_for_update().get(pk=product.pk)

    if transaction_type == StockTransaction.TransactionType.PURCHASE:
        delta = quantity
    elif transaction_type == StockTransaction.TransactionType.SALE:
        delta = -quantity
        if sub_variant.stock + delta < 0:
            raise ValidationError(
                f"Insufficient stock. Available: {sub_variant.stock}, "
                f"requested: {quantity}."
            )
    else:
        raise ValidationError(f"Unsupported transaction type: {transaction_type}")

    # Create the transaction record
    txn = StockTransaction.objects.create(
        product=product,
        sub_variant=sub_variant,
        transaction_type=transaction_type,
        quantity=quantity,
        notes=notes or '',
        created_by=user,
    )

    # Update sub-variant stock
    sub_variant.stock = sub_variant.stock + delta
    sub_variant.save(update_fields=['stock', 'updated_at'])

    # Sync product total stock
    _sync_product_total_stock(product)

    logger.info(
        "Stock %s: %s × %s for sub-variant %s (product %s). New SV stock: %s",
        transaction_type, quantity, sub_variant.sku,
        sub_variant.pk, product.ProductCode, sub_variant.stock,
    )

    return txn


# ---------------------------------------------------------------------------
# Total stock synchronisation
# ---------------------------------------------------------------------------

def _sync_product_total_stock(product):
   
    agg = (
        SubVariant.objects
        .filter(product=product)
        .aggregate(total=Sum('stock'))
    )
    product.TotalStock = agg['total'] or Decimal('0')
    product.UpdatedDate = timezone.now()
    product.save(update_fields=['TotalStock', 'UpdatedDate'])