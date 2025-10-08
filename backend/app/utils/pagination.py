def extract_pagination(filters):
    """Safely extract pagination parameters from filters dict."""
    try:
        page = int(filters.get("page", 1))
        page_size = int(filters.get("page_size", 10))
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10
    except (ValueError, TypeError):
        page, page_size = 1, 10

    offset = (page - 1) * page_size
    return page, page_size, offset