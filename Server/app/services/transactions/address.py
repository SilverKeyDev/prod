"""Transaction property address read/write."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import TransactionAddress
from app.services.transactions.persistence import persist_transaction_session
from app.services.transactions.selection import resolve_active_transaction


def address_payload_for_transaction(tx_id: str) -> dict | None:
    addr = db.session.scalar(
        select(TransactionAddress)
        .where(TransactionAddress.transaction_id == str(tx_id))
        .order_by(TransactionAddress.updated_at.desc())
    )
    if not addr or not addr.address:
        return None
    return _address_to_payload(addr)


def _address_to_payload(addr: TransactionAddress) -> dict:
    return {
        "address": addr.address,
        "street": addr.street,
        "city": addr.city,
        "state": addr.state,
        "postal_code": addr.postal_code,
        "country": addr.country,
        "place_id": addr.place_id,
    }


def get_active_buyer_address(buyer_id: str) -> dict:
    """Resolve active deal, persist selection side effects, return address payload."""
    tx = resolve_active_transaction(buyer_id=str(buyer_id))
    persist_transaction_session()
    addr = db.session.scalar(
        select(TransactionAddress)
        .where(TransactionAddress.transaction_id == tx.id)
        .order_by(TransactionAddress.updated_at.desc())
    )
    if not addr:
        return {"address": None}
    return _address_to_payload(addr)


def save_transaction_address(
    *,
    buyer_id: str,
    user_id: str,
    address: str,
    street: str | None = None,
    city: str | None = None,
    state: str | None = None,
    postal_code: str | None = None,
    country: str | None = None,
    place_id: str | None = None,
) -> tuple[dict, str]:
    tx = resolve_active_transaction(buyer_id=str(buyer_id))
    addr = db.session.scalar(
        select(TransactionAddress).where(TransactionAddress.transaction_id == tx.id)
    )
    if addr:
        addr.address = address
        addr.street = street
        addr.city = city
        addr.state = state
        addr.postal_code = postal_code
        addr.country = country
        addr.place_id = place_id
        addr.user_id = user_id
    else:
        addr = TransactionAddress(
            transaction_id=tx.id,
            user_id=user_id,
            address=address,
            street=street,
            city=city,
            state=state,
            postal_code=postal_code,
            country=country,
            place_id=place_id,
        )
        db.session.add(addr)
    persist_transaction_session()
    return _address_to_payload(addr), str(tx.id)
