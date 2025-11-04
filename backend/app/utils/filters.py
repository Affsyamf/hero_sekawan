from sqlalchemy.orm import Query
from app.models import Product, Purchasing, Account, AccountParent

def apply_common_report_filters(query: Query, filters) -> Query:
    """Apply generic filters (product, supplier, account, category) to any report query."""
    def get_field(name):
        return filters.get(name) if isinstance(filters, dict) else getattr(filters, name, None)
    
    product_ids = get_field("product_ids")
    supplier_ids = get_field("supplier_ids")
    account_parent_codes = get_field("account_parent_codes")
    account_names = get_field("account_names")
    category = get_field("category")

    if product_ids:
        query = query.filter(Product.id.in_(product_ids))

    if supplier_ids:
        query = query.filter(Purchasing.supplier_id.in_(supplier_ids))

    if account_parent_codes:
        query = query.filter(AccountParent.account_no.in_(account_parent_codes))

    if account_names:
        query = query.filter(Account.name.in_(account_names))
        
    if category:
        if category in ("chemical", "sparepart"):
            query = query.filter(AccountParent.account_type == category)
        elif category == "both":
            query = query.filter(AccountParent.account_type.in_(["chemical", "sparepart"]))

    return query