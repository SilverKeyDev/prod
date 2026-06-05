"""Standard offset/limit pagination helpers aligned with OpenAPI `Pagination` schema."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import Select, func, select

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


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
    default_per_page: int = 20,
) -> tuple[int, int]:
    """
    Resolve (page, per_page) from Flask request.args.

    Prefers `page` / `per_page`. Falls back to `limit` / `offset` when those are present.
    When no pagination args are sent, uses default_per_page on page 1.
    """
    has_new = args.get("page") is not None or args.get("per_page") is not None
    if has_new:
        page = int(args.get("page") or 1)
        per_page = int(args.get("per_page") or default_per_page)
        return clamp_page(page), clamp_per_page(per_page)

    if args.get("limit") is not None or args.get("offset") is not None:
        limit_raw = args.get("limit")
        offset_raw = args.get("offset")
        limit = int(limit_raw) if limit_raw is not None else default_per_page
        offset = int(offset_raw) if offset_raw is not None else 0
        per_page = clamp_per_page(limit)
        page = offset // per_page + 1 if per_page else 1
        return clamp_page(page), per_page

    return 1, clamp_per_page(default_per_page)


def paginate(
    session: Session,
    stmt: Select[Any],
    page: int,
    per_page: int,
) -> tuple[list[Any], dict[str, Any]]:
    """Apply offset/limit to a SQLAlchemy 2.0 select(); return (items, pagination metadata)."""
    per_page = clamp_per_page(per_page)
    page = clamp_page(page)
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = int(session.scalar(count_stmt) or 0)
    items = list(session.scalars(stmt.offset((page - 1) * per_page).limit(per_page)).all())
    return items, build_pagination(page=page, per_page=per_page, total=total)
