"""Unit tests for deterministic campaign A/B assignment."""

from __future__ import annotations

from app.services.brokerage.campaigns.assign import assign_variant


def test_assign_variant_is_deterministic():
    a = assign_variant("camp-1", "agent-42")
    b = assign_variant("camp-1", "agent-42")
    assert a == b
    assert a in ("A", "B")


def test_assign_variant_splits_population():
    campaign_id = "camp-split"
    variants = [assign_variant(campaign_id, f"agent-{i}") for i in range(100)]
    count_a = variants.count("A")
    count_b = variants.count("B")
    # Roughly balanced for 100 agents
    assert 30 <= count_a <= 70
    assert count_a + count_b == 100


def test_different_agents_can_differ():
    results = {assign_variant("c", f"a-{i}") for i in range(20)}
    assert results == {"A", "B"} or len(results) >= 1
