from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app.extensions import db
from app.models import PDFDocument
import os
import json
from app.models.home_descriptions import HomeDescription

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route("/", methods=["GET"])
@login_required
def dashboard():
    user = current_user
    recent_documents = (
        PDFDocument.query.filter_by(user_id=user.id)
        .order_by(PDFDocument.created_at.desc())
        .limit(5)
        .all()
    )

    try:
        favorite_ids = json.loads(user.favorite_home_ids) if user.favorite_home_ids else []
    except (TypeError, ValueError):
        current_app.logger.warning("dashboard: failed to parse favorite_home_ids", extra={"raw": user.favorite_home_ids})
        favorite_ids = []

    favorite_homes = []
    if favorite_ids:
        favorite_homes = (
            HomeDescription.query.filter(HomeDescription.home_id.in_(favorite_ids)).all()
        )

    return jsonify(
        {
            "success": True,
            "user": user.to_dict(),
            "favoriteHomes": [home.to_dict() for home in favorite_homes],
        }
    )


@dashboard_bp.route("/reports", methods=["GET"])
@login_required
def get_reports():
    user = current_user
    documents = PDFDocument.query.filter_by(user_id=user.id).all()

    return jsonify(
        {"success": True, "documents": [doc.to_dict() for doc in documents]}
    )