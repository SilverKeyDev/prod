"""Transaction model - represents a real estate transaction."""

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class Transaction(db.Model):
    """Transaction - tracks buyer, agent, and optional external file linkage."""

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(db.String(36), primary_key=True)
    primary_agent_id: Mapped[str | None] = mapped_column(db.ForeignKey("users.id"))
    buyer_id: Mapped[str | None] = mapped_column(db.ForeignKey("users.id"))
    skyslope_file_id: Mapped[str | None] = mapped_column(db.String(100))
