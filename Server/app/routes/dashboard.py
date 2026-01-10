from flask import Blueprint, jsonify
from ..models import PDFDocument
from ..utils.common_patterns import require_authenticated_user

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route("/", methods=["GET"])
@require_authenticated_user
def dashboard(user):
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
        }
    )


@dashboard_bp.route("/reports", methods=["GET"])
@require_authenticated_user
def get_reports(user):
    documents = PDFDocument.query.filter_by(user_id=user.id).all()

    return jsonify(
        {"success": True, "documents": [doc.to_dict() for doc in documents]}
    )