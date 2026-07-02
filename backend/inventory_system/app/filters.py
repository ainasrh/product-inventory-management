"""
django-filter FilterSets for the stock transaction report endpoint.
"""

import django_filters

from .models import StockTransaction


class StockReportFilter(django_filters.FilterSet):
    """
    Filterable stock transaction report.

    Supported query params::

        ?start_date=2024-01-01
        ?end_date=2024-12-31
        ?product_id=<uuid>
        ?transaction_type=PURCHASE|SALE|ADJUSTMENT
    """

    start_date = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        label='Start date (inclusive)',
    )
    end_date = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        label='End date (inclusive)',
    )
    product_id = django_filters.UUIDFilter(
        field_name='product__id',
        label='Product UUID',
    )
    transaction_type = django_filters.ChoiceFilter(
        field_name='transaction_type',
        choices=StockTransaction.TransactionType.choices,
        label='Transaction type',
    )

    class Meta:
        model  = StockTransaction
        fields = ['start_date', 'end_date', 'product_id', 'transaction_type']
