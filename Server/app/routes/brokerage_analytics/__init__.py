"""Brokerage analytics routes — SIL-274.

Exposes one Flask route per analytics graph type for the brokerage dashboard.
All routes share the same auth pattern and query parameters.
Base path: /api/v1/brokerage/analytics/

Shared query parameters (all routes):
    brokerage_org_id (required): UUID — validated by require_brokerage_scope decorator
    date_from (optional): ISO 8601 date string, defaults to 30 days ago
    date_to (optional): ISO 8601 date string, defaults to now

Real data path: SkySlope sync (SIL-272) → aggregation service (SIL-202) → these routes.
Until SkySlope sync lands, service functions return fixture-shaped stub data.
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
    get_agent_retention_risk,
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
            jsonify({
                "error": f"Invalid {field_name} format. Use ISO 8601 e.g. 2026-01-01",
                "success": False,
            }),
            400,
        )


def _build_filters(brokerage_org_id: str):
    """Parse shared query params and build BrokerageAnalyticsFilters.
    Returns (filters, None) on success or (None, error_response) on failure.
    """
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
    Cross-references agent split structures against production volume to flag
    flight-risk agents (top producers underpaid vs market) and over-compensated
    agents (high split, low volume). Ranked by risk score. SIL-278.
    """
    brokerage_org_id = req.args.get("brokerage_org_id")
    filters, err = _build_filters(brokerage_org_id)
    if err:
        return err
    return _handle_result(get_agent_retention_risk(filters))