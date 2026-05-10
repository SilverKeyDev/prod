"""Legacy one-to-one row per user; ``is_admin`` is not used for authorization.

Use ``user_roles`` with role ``admin`` or ``super_admin``. Backfill from legacy rows via
``scripts/misc/reconcile_user_admin_roles.py``. The column remains until a later migration removes it.
"""

from sqlalchemy.orm import Mapped, mapped_column

from app import db


class UserAdmin(db.Model):
    __tablename__ = "user_admin"

    user_id: Mapped[str] = mapped_column(
        db.String(36),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    is_admin: Mapped[bool] = mapped_column(
        db.Boolean,
        default=False,
        server_default=db.text("false"),
    )

    user = db.relationship("User", backref=db.backref("user_admin", uselist=False))
