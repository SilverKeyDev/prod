"""Standard offset/limit pagination helpers aligned with OpenAPI `Pagination` schema."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sqlalchemy.orm import Query


def clamp_per_page(per_page: int, *, maximum: int = 100) -> int:
    return max(1, min(int(per_page), maximum))


def clamp_page(page: int) -> int:
    return max(1, int(page))


def build_pagination(*, page: int, per_page: int, total: int) -> dict[str, Any]:
    """Build pagination metadata dict matching OpenAPI `Pagination`."""
    per_page = clamp_per_page(per_page)
    page = clamp_page(page)
    total = max(0, int(total))
    total_pages = (total + per_page - 1) // per_page if total > 0 else 0
    has_next = page * per_page < total
    has_prev = page > 1
    return {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_prev": has_prev,
        "next_page": page + 1 if has_next else None,
        "prev_page": page - 1 if has_prev else None,
    }


def parse_query_pagination_args(
    args,
    *,
    legacy_limit_default: int | None = None,
    default_per_page: int = 20,
) -> tuple[int, int]:
    """
    Resolve (page, per_page) from Flask request.args.

    Prefers `page` / `per_page`. Falls back to `limit` / `offset` when those are present.
    When no pagination args are sent, uses legacy_limit_default (e.g. 100 for favorite-homes)
    or default_per_page as the page size on page 1.
    """
    has_new = args.get("page") is not None or args.get("per_page") is not None
    if has_new:
        page = int(args.get("page") or 1)
        per_page = int(args.get("per_page") or default_per_page)
        return clamp_page(page), clamp_per_page(per_page)

    if args.get("limit") is not None or args.get("offset") is not None:
        limit_raw = args.get("limit")
        offset_raw = args.get("offset")
        limit = (
            int(limit_raw)
            if limit_raw is not None
            else (legacy_limit_default if legacy_limit_default is not None else default_per_page)
        )
        offset = int(offset_raw) if offset_raw is not None else 0
        per_page = clamp_per_page(limit)
        page = offset // per_page + 1 if per_page else 1
        return clamp_page(page), per_page

    if legacy_limit_default is not None:
        return 1, clamp_per_page(legacy_limit_default)
    return 1, clamp_per_page(default_per_page)


def paginate(query: Query[Any], page: int, per_page: int) -> tuple[list[Any], dict[str, Any]]:
    """Apply offset/limit to a SQLAlchemy query; return (items, pagination metadata)."""
    total = query.count()
    per_page = clamp_per_page(per_page)
    page = clamp_page(page)
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, build_pagination(page=page, per_page=per_page, total=total)
