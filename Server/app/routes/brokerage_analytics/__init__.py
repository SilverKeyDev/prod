"""Brokerage analytics routes — SIL-274.

Exposes one Flask route per analytics graph type for the brokerage dashboard.
All routes share the same auth pattern and query parameters.
Base path: /api/v1/brokerage/analytics/

Shared query parameters (all routes):
    brokerage_org_id (required): UUID — validated by require_brokerage_scope decorator
    timeline (optional): week | month | year | 5years | all — preferred over raw dates (SIL-274)
    date_from (optional): ISO 8601 date string, defaults to 30 days ago when timeline unset
    date_to (optional): ISO 8601 date string, defaults to now when timeline unset

Real data path: SkySlope sync (SIL-272) → aggregation service (SIL-202) → these routes.
Until SkySlope sync lands, service functions return fixture-shaped stub data scaled by timeline.
"""

from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify
from flask import request as req

from app.utils.common_patterns import (
    handle_exceptions_with_logging,
    require_brokerage_scope,
)

from ...services.brokerage.analytics import (
    BrokerageAnalyticsFilters,
    get_agent_analytics,
    get_agent_retention_risk,
    get_ancillary_analytics,
    get_brokerage_analytics_overview,
    get_deal_failure_forensics,
    get_funnel_analytics,
    get_location_analytics,
    get_price_analytics,
    get_targeted_agent_engagement,
    get_timing_analytics,
    get_type_analytics,
    get_volume_analytics,
)
from ...services.brokerage.analytics_timeline import (
    VALID_TIMELINES,
    timeline_to_date_range,
)

brokerage_analytics_bp = Blueprint(
    "brokerage_analytics",
    __name__,
    url_prefix="/api/v1/brokerage/analytics",
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def _parse_iso_date(value: str, field_name: str):
    """Parse ISO 8601 date string to UTC datetime.
    Returns (datetime, None) on success or (None, error_response) on failure.
    """
    try:
        return datetime.fromisoformat(value).replace(tzinfo=timezone.utc), None
    except ValueError:
        return None, (
            jsonify(
                {
                    "error": f"Invalid {field_name} format. Use ISO 8601 e.g. 2026-01-01",
                    "success": False,
                }
            ),
            400,
        )


def _build_filters(brokerage_org_id: str):
    """Parse shared query params and build BrokerageAnalyticsFilters.
    Returns (filters, None) on success or (None, error_response) on failure.

    Prefer `timeline` when provided (SIL-274). Otherwise accept raw date_from/date_to.
    """
    timeline = req.args.get("timeline")
    if timeline is not None:
        if timeline not in VALID_TIMELINES:
            return None, (
                jsonify(
                    {
                        "error": ("Invalid timeline. Use one of: week, month, year, 5years, all"),
                        "success": False,
                    }
                ),
                400,
            )
        date_from, date_to = timeline_to_date_range(timeline)
        return BrokerageAnalyticsFilters(
            brokerage_org_id=brokerage_org_id,
            date_from=date_from,
            date_to=date_to,
            timeline=timeline,
        ), None

    date_from = None
    date_to = None

    date_from_str = req.args.get("date_from")
    date_to_str = req.args.get("date_to")

    if date_from_str:
        date_from, err = _parse_iso_date(date_from_str, "date_from")
        if err:
            return None, err

    if date_to_str:
        date_to, err = _parse_iso_date(date_to_str, "date_to")
        if err:
            return None, err

    return BrokerageAnalyticsFilters(
        brokerage_org_id=brokerage_org_id,
        date_from=date_from,
        date_to=date_to,
        timeline=None,
    ), None


def _handle_result(result: dict):
    """Translate service result dict to HTTP response."""
    if not result.get("success"):
        error = result.get("error", "unknown_error")
        if error == "brokerage_not_found":
            return jsonify({"error": "Brokerage not found", "success": False}), 404
        return jsonify({"error": "Failed to compute analytics", "success": False}), 500
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# Routes — one per graph type
# ---------------------------------------------------------------------------


@brokerage_analytics_bp.route("/overview", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_overview(user):
    """
    GET /api/v1/brokerage/analytics/overview
    Top-line KPI summary — active agents, open transactions,
    messaging SLA, at-risk agents, transaction funnel, messaging activity.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_brokerage_analytics_overview(filters))


@brokerage_analytics_bp.route("/volume", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_volume(user):
    """
    GET /api/v1/brokerage/analytics/volume
    Monthly transaction counts and cancellation rates over time.
    Powers the volume trend chart on the dashboard.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_volume_analytics(filters))


@brokerage_analytics_bp.route("/price", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_price(user):
    """
    GET /api/v1/brokerage/analytics/price
    Median, min, and max transaction values over time.
    Powers the price trend chart on the dashboard.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_price_analytics(filters))


@brokerage_analytics_bp.route("/location", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_location(user):
    """
    GET /api/v1/brokerage/analytics/location
    Geo points with transaction counts for heat map rendering.
    Powers the location heat map on the dashboard.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_location_analytics(filters))


@brokerage_analytics_bp.route("/type", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_type(user):
    """
    GET /api/v1/brokerage/analytics/type
    Buyer/seller split and property type breakdown.
    Powers the type distribution charts on the dashboard.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_type_analytics(filters))


@brokerage_analytics_bp.route("/timing", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_timing(user):
    """
    GET /api/v1/brokerage/analytics/timing
    Seasonal volume series for ML forecast input.
    Powers the timing prediction chart and feeds the ML model.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_timing_analytics(filters))


@brokerage_analytics_bp.route("/ancillary", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_ancillary(user):
    """
    GET /api/v1/brokerage/analytics/ancillary
    Ancillary service attach rates and dollar leakage by agent and office.
    PRIMARY SALES DOCUMENT for SkySlope engagement (SIL-277 URGENT).
    Shows exact revenue bleeding to outside title/lending/escrow/warranty vendors.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_ancillary_analytics(filters))


@brokerage_analytics_bp.route("/funnel", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_funnel(user):
    """
    GET /api/v1/brokerage/analytics/funnel
    Transaction stage counts and drop-off percentages.
    Powers the funnel chart on the dashboard.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_funnel_analytics(filters))


@brokerage_analytics_bp.route("/agents", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_agents(user):
    """
    GET /api/v1/brokerage/analytics/agents
    Per-agent performance metrics — active clients, closings, throughput.
    Powers the agent performance table on the dashboard.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_agent_analytics(filters))


@brokerage_analytics_bp.route("/deal-failure", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_deal_failure(user):
    """
    GET /api/v1/brokerage/analytics/deal-failure
    Deal fall-through and cancellation forensics — SIL-281.
    Breaks down failure rates by agent, lender, price band, and stage
    so brokerages can make informed vendor and coaching decisions.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_deal_failure_forensics(filters))


@brokerage_analytics_bp.route("/targeted-agent-engagement", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_targeted_agent_engagement(user):
    """
    GET /api/v1/brokerage/analytics/targeted-agent-engagement
    Flags agents with 0% or bottom-quartile ancillary attach rates despite
    high transaction volume. Returns target list with suggested engagement
    actions for brokerage admin export. No auto-send in v1 — SIL-279.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_targeted_agent_engagement(filters))


@brokerage_analytics_bp.route("/agent-retention-risk", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_agent_retention_risk(user):
    """
    GET /api/v1/brokerage/analytics/agent-retention-risk
    Returns blended ML flight-risk scores (five equal-weight factors: compensation,
    production momentum, peer standing, engagement, ancillary attach). Ranked by
    blended risk score. SIL-278.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_agent_retention_risk(filters))


@brokerage_analytics_bp.route("/campaigns", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def list_analytics_campaigns(user):
    """GET /api/v1/brokerage/analytics/campaigns — list A/B email campaigns (SIL-306)."""
    from app.services.brokerage.campaigns.service import list_campaigns

    brokerage_org_id = req.args.get("brokerage_org_id")
    return _handle_result(list_campaigns(brokerage_org_id))


@brokerage_analytics_bp.route("/campaigns", methods=["POST"])
@handle_exceptions_with_logging
@require_brokerage_scope
def create_analytics_campaign(user):
    """POST /api/v1/brokerage/analytics/campaigns — create A/B campaign (SIL-306)."""
    from app.services.brokerage.campaigns.service import create_campaign

    brokerage_org_id = req.args.get("brokerage_org_id")
    body = req.get_json(silent=True) or {}
    result = create_campaign(
        brokerage_org_id,
        name=str(body.get("name") or "").strip(),
        goal_metric=str(body.get("goal_metric") or "title_attach"),
        variants=list(body.get("variants") or []),
        segment=str(body.get("segment") or "targeted_engagement"),
        send=bool(body.get("send", True)),
    )
    if not result.get("success"):
        error = result.get("error", "unknown_error")
        if error == "validation_error":
            return jsonify(
                {
                    "success": False,
                    "error": error,
                    "message": result.get("message", "Invalid request"),
                }
            ), 400
        return jsonify({"success": False, "error": error}), 500
    return jsonify(result), 201


@brokerage_analytics_bp.route("/campaigns/<campaign_id>", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_campaign(user, campaign_id: str):
    """GET /api/v1/brokerage/analytics/campaigns/{id} — campaign detail (SIL-306)."""
    from app.services.brokerage.campaigns.service import get_campaign

    brokerage_org_id = req.args.get("brokerage_org_id")
    result = get_campaign(brokerage_org_id, campaign_id)
    if not result.get("success"):
        if result.get("error") == "campaign_not_found":
            return jsonify({"success": False, "error": "Campaign not found"}), 404
        return jsonify({"success": False, "error": "Failed to load campaign"}), 500
    return jsonify(result), 200


@brokerage_analytics_bp.route("/campaigns/<campaign_id>/results", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_campaign_results(user, campaign_id: str):
    """GET /api/v1/brokerage/analytics/campaigns/{id}/results — lift + $ (SIL-307)."""
    from app.services.brokerage.campaigns.results import get_campaign_results

    brokerage_org_id = req.args.get("brokerage_org_id")
    result = get_campaign_results(brokerage_org_id, campaign_id)
    if not result.get("success"):
        if result.get("error") == "campaign_not_found":
            return jsonify({"success": False, "error": "Campaign not found"}), 404
        return jsonify({"success": False, "error": "Failed to compute results"}), 500
    return jsonify(result), 200


@brokerage_analytics_bp.route("/campaigns/<campaign_id>/learning", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_analytics_campaign_learning(user, campaign_id: str):
    """GET …/campaigns/{id}/learning — last SIL-309 learning-loop result."""
    from app.services.brokerage.campaigns.learning_artifacts import load_learning_result
    from app.services.brokerage.campaigns.service import get_campaign

    brokerage_org_id = req.args.get("brokerage_org_id")
    detail = get_campaign(brokerage_org_id, campaign_id)
    if not detail.get("success"):
        if detail.get("error") == "campaign_not_found":
            return jsonify({"success": False, "error": "Campaign not found"}), 404
        return jsonify({"success": False, "error": "Failed to load campaign"}), 500
    learning = load_learning_result(campaign_id)
    if not learning:
        return jsonify(
            {
                "success": True,
                "brokerage_org_id": brokerage_org_id,
                "campaign_id": campaign_id,
                "learning": None,
            }
        ), 200
    return jsonify(learning), 200


@brokerage_analytics_bp.route("/campaigns/<campaign_id>/learning-loop", methods=["POST"])
@handle_exceptions_with_logging
@require_brokerage_scope
def post_analytics_campaign_learning_loop(user, campaign_id: str):
    """
    POST …/campaigns/{id}/learning-loop — SIL-309 one-click loop.

    Scores winners, reviews what worked (Perplexity or cache), drafts next A/B
    pair. Drafts require human approval (never auto-send).
    Body optional: ``{"skip_perplexity": true}`` for offline demo.
    """
    from app.services.brokerage.campaigns.learning.learning_loop import (
        run_campaign_learning_loop,
    )

    brokerage_org_id = req.args.get("brokerage_org_id")
    body = req.get_json(silent=True) or {}
    result = run_campaign_learning_loop(
        brokerage_org_id,
        campaign_id,
        skip_perplexity=bool(body.get("skip_perplexity")),
    )
    if not result.get("success"):
        if result.get("error") == "campaign_not_found":
            return jsonify({"success": False, "error": "Campaign not found"}), 404
        return jsonify({"success": False, "error": result.get("error", "learning_failed")}), 500
    return jsonify(result), 200


@brokerage_analytics_bp.route("/inventory", methods=["GET"])
@handle_exceptions_with_logging
@require_brokerage_scope
def get_brokerage_inventory(user):
    """GET /api/v1/brokerage/analytics/inventory — portfolio map pins (SIL-310)."""
    from app.services.brokerage.inventory import get_brokerage_inventory_listings

    brokerage_org_id = req.args.get("brokerage_org_id")
    status = req.args.get("status")
    return _handle_result(get_brokerage_inventory_listings(brokerage_org_id, status_filter=status))


@brokerage_analytics_bp.route("/nl-query", methods=["POST"])
@handle_exceptions_with_logging
@require_brokerage_scope
def post_brokerage_analytics_nl_query(user):
    """POST /api/v1/brokerage/analytics/nl-query - SIL-323 NL -> read-only SQL."""
    from app.services.brokerage_db_mcp import (
        ConnectionConfigError,
        NlQueryError,
        QueryExecutionError,
        QueryGuardrailError,
        run_nl_query,
    )

    body = req.get_json(silent=True) or {}
    brokerage_org_id = str(
        body.get("brokerage_org_id") or req.args.get("brokerage_org_id") or ""
    ).strip()
    question = str(body.get("question") or "").strip()

    if not question:
        return jsonify(
            {"success": False, "error": "validation_error", "message": "question is required"}
        ), 400

    try:
        result = run_nl_query(brokerage_org_id, question)
    except QueryGuardrailError as exc:
        return jsonify(
            {
                "success": False,
                "error": getattr(exc, "code", "query_rejected"),
                "message": "Query was rejected by read-only guardrails",
            }
        ), 400
    except (NlQueryError, ConnectionConfigError, QueryExecutionError) as exc:
        code = getattr(exc, "code", "nl_query")
        status = (
            400
            if code
            in {
                "empty_question",
                "missing_brokerage_org_id",
                "brokerage_not_found",
                "empty_sql",
                "tenancy_bind_missing",
                "tenancy_predicate_missing",
                "table_not_allowed",
                "no_table",
            }
            else 500
        )
        return jsonify(
            {
                "success": False,
                "error": code,
                "message": "Unable to answer this question",
            }
        ), status

    return jsonify(
        {
            "success": True,
            "brokerage_org_id": brokerage_org_id,
            "question": result.question,
            "sql": result.sql,
            "viz_hint": result.viz_hint,
            "columns": list(result.columns),
            "rows": list(result.rows),
            "row_count": result.row_count,
        }
    ), 200
