"""Tests for client UI settings merge/sanitize."""

from app.services.client_settings import (
    default_settings,
    merge_and_sanitize,
    sanitize_settings,
)


def test_default_settings_shape():
    d = default_settings()
    assert d["v"] == 1
    assert d["library"]["homes"]["layout"] == "grid"
    assert d["calendar"]["shell"] == "month"


def test_sanitize_rejects_bad_sort():
    raw = {
        "v": 1,
        "library": {
            "homes": {"layout": "list", "sort": "not_a_real_sort"},
            "documents": {"layout": "grid", "sort": "date_desc"},
            "docusign": {"layout": "grid", "sort": "date_desc"},
        },
        "saved": {"tab": "homes"},
        "calendar": {"shell": "month"},
    }
    out = sanitize_settings(raw)
    assert out["library"]["homes"]["sort"] == "date_desc"


def test_sanitize_preserves_forms_library_tab():
    raw = {
        "saved": {"tab": "forms-library"},
    }
    out = sanitize_settings(raw)
    assert out["saved"]["tab"] == "forms-library"


def test_merge_patch_deep():
    existing = default_settings()
    patch = {"library": {"homes": {"layout": "list"}}}
    merged = merge_and_sanitize(existing, patch)
    assert merged["library"]["homes"]["layout"] == "list"
    assert merged["library"]["homes"]["sort"] == "date_desc"


def test_merge_removes_onboarding_draft_with_null():
    existing = merge_and_sanitize(None, {"onboarding_draft": {"name": "x"}})
    assert "onboarding_draft" in existing
    cleared = merge_and_sanitize(existing, {"onboarding_draft": None})
    assert "onboarding_draft" not in cleared


def test_sanitize_strips_unknown_top_level_keys():
    raw = {"viewing_tour": {"anchors": []}, "saved": {"tab": "homes"}}
    out = sanitize_settings(raw)
    assert "viewing_tour" not in out
    assert out["saved"]["tab"] == "homes"
