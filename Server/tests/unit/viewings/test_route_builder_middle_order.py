"""Unit tests for viewing route middle-stop ordering (no HTTP)."""

from __future__ import annotations

from app.services.viewings.route_builder_support import (
    _best_middle_visit_order,
    _middle_perm_cost,
)


def test_middle_perm_cost_open_end() -> None:
    # S=0, M1=1, M2=2; last_property → no return leg
    matrix = [
        [0.0, 10.0, 40.0],
        [10.0, 0.0, 10.0],
        [40.0, 10.0, 0.0],
    ]
    assert _middle_perm_cost(matrix, 2, (0, 1), "last_property") == 20.0
    assert _middle_perm_cost(matrix, 2, (1, 0), "last_property") == 50.0


def test_middle_perm_cost_return_to_start() -> None:
    matrix = [
        [0.0, 10.0, 15.0],
        [10.0, 0.0, 10.0],
        [15.0, 10.0, 0.0],
    ]
    # S→M0→M1→S: 10+10+15 = 35
    assert _middle_perm_cost(matrix, 2, (0, 1), "return_to_start") == 35.0


def test_middle_perm_cost_fixed_end() -> None:
    # S=0, M1=1, M2=2, E=3
    matrix = [
        [0.0, 10.0, 100.0, 5.0],
        [10.0, 0.0, 10.0, 50.0],
        [100.0, 10.0, 0.0, 10.0],
        [5.0, 50.0, 10.0, 0.0],
    ]
    cost = _middle_perm_cost(matrix, 2, (0, 1), "fixed")
    assert cost == 10.0 + 10.0 + 10.0  # S→M0, M0→M1, M1→E


def test_best_middle_prefers_cheaper_permutation() -> None:
    matrix = [
        [0.0, 10.0, 40.0],
        [10.0, 0.0, 10.0],
        [40.0, 10.0, 0.0],
    ]
    order = _best_middle_visit_order(matrix, 2, "last_property")
    assert order == [0, 1]
