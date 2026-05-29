"""Unit tests for match-score-aligned pros/cons counts."""

from __future__ import annotations

from app.services.search.scoring import adjust_pros_cons_counts

LO = 1.0
HI = 99.0


def test_adjust_mid_score_near_parity_for_even_total() -> None:
    mid = (LO + HI) / 2.0
    pros, cons = adjust_pros_cons_counts(3, 3, mid, LO, HI)
    assert pros + cons == 6
    assert 1 <= pros <= 6 and 1 <= cons <= 6
    assert abs(pros - cons) <= 1


def test_adjust_high_score_more_pros() -> None:
    pros, cons = adjust_pros_cons_counts(3, 3, HI, LO, HI)
    assert pros + cons == 6
    assert pros > cons


def test_adjust_low_score_more_cons() -> None:
    pros, cons = adjust_pros_cons_counts(3, 3, LO, LO, HI)
    assert pros + cons == 6
    assert cons > pros


def test_adjust_preserves_total_budget() -> None:
    for bp, bc in ((2, 2), (3, 3), (5, 5), (2, 5)):
        for score in (LO, (LO + HI) / 2, HI):
            p, c = adjust_pros_cons_counts(bp, bc, score, LO, HI)
            assert p + c == min(12, max(2, min(6, bp) + min(6, bc)))


def test_adjust_monotonic_pros_in_score() -> None:
    """Pros count (weakly) increases with score for fixed base."""
    bases = [(3, 3), (4, 2)]
    for bp, bc in bases:
        prev = -1
        for i in range(11):
            score = LO + (HI - LO) * (i / 10.0)
            pros, _cons = adjust_pros_cons_counts(bp, bc, score, LO, HI)
            assert pros >= prev
            prev = pros


def test_adjust_clamps_each_side_to_six() -> None:
    pros, cons = adjust_pros_cons_counts(6, 6, HI, LO, HI)
    assert pros <= 6 and cons <= 6
