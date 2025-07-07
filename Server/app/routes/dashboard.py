from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app.extensions import db
from app.models import PDFDocument
import os

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

    return jsonify(
        {
            "success": True,
            "user": user.to_dict(),
            "recentDocuments": [doc.to_dict() for doc in recent_documents],
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