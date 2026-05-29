"""Register rev-share route handlers on blueprints."""

from .. import rev_share_bp, rev_share_redirect_bp
from . import admin_partners, analytics, partner_logo, placements, redirect, step_views

rev_share_redirect_bp.route("/r/<link_id>", methods=["GET"])(redirect.rev_share_redirect)

rev_share_bp.route("/partners/placements", methods=["GET"])(placements.get_placements)
rev_share_bp.route("/rev-share/step-views", methods=["POST"])(step_views.post_step_view)

rev_share_bp.route("/admin/partners", methods=["GET"])(admin_partners.list_admin_partners)
rev_share_bp.route("/admin/partners", methods=["POST"])(admin_partners.create_admin_partner)
rev_share_bp.route("/admin/partners/checklist-steps", methods=["GET"])(
    admin_partners.list_checklist_steps
)
rev_share_bp.route("/admin/partners/<partner_id>", methods=["GET"])(
    admin_partners.get_admin_partner
)
rev_share_bp.route("/admin/partners/<partner_id>", methods=["PATCH"])(
    admin_partners.patch_admin_partner
)
rev_share_bp.route("/admin/partners/<partner_id>", methods=["DELETE"])(
    admin_partners.delete_admin_partner
)
rev_share_bp.route("/admin/partners/<partner_id>/provision-links", methods=["POST"])(
    admin_partners.provision_admin_partner_links
)
rev_share_bp.route("/admin/partners/<partner_id>/logo", methods=["POST"])(
    partner_logo.upload_partner_logo
)
rev_share_bp.route("/admin/rev-share/analytics", methods=["GET"])(
    analytics.get_admin_rev_share_analytics
)
