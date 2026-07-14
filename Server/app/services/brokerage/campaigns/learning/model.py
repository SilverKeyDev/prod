"""Engagement/conversion scoring — compare sklearn models, pick the winner.

SIL-309: logistic regression vs histogram gradient boosting on demo-sized
data. Torch MLP is evaluated only when torch is importable; demo default
is whichever sklearn model wins on holdout AUC (winning the demo > architecture).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split

from app.services.brokerage.campaigns.learning.config import Sil309Config
from app.services.brokerage.campaigns.learning.features import rows_to_matrix
from logger import log


@dataclass
class ModelCandidate:
    name: str
    auc: float
    accuracy: float
    estimator: Any


def _fit_eval(
    name: str,
    estimator: Any,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> ModelCandidate | None:
    try:
        estimator.fit(X_train, y_train)
        if hasattr(estimator, "predict_proba"):
            prob = estimator.predict_proba(X_test)[:, 1]
        else:
            # torch / decision_function fallbacks
            scores = estimator.decision_function(X_test)
            prob = 1.0 / (1.0 + np.exp(-scores))
        pred = (prob >= 0.5).astype(int)
        auc = 0.5
        if len(set(y_test.tolist())) > 1 and len(set(y_train.tolist())) > 1:
            auc = float(roc_auc_score(y_test, prob))
        acc = float(accuracy_score(y_test, pred))
        return ModelCandidate(name=name, auc=auc, accuracy=acc, estimator=estimator)
    except Exception as exc:  # noqa: BLE001 — demo: skip failed candidate
        log.warn("API", "SIL-309 model candidate failed", {"name": name, "error": str(exc)})
        return None


def _try_torch_mlp(
    cfg: Sil309Config,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> ModelCandidate | None:
    """Optional tiny CPU feedforward net — skipped if torch missing or fails."""
    try:
        import torch
        import torch.nn as nn
    except ImportError:
        return None

    class TinyMLP(nn.Module):
        def __init__(self, n_in: int):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(n_in, 16),
                nn.ReLU(),
                nn.Linear(16, 8),
                nn.ReLU(),
                nn.Linear(8, 1),
            )

        def forward(self, x):  # noqa: ANN001
            return self.net(x).squeeze(-1)

        def fit(self, X, y):  # noqa: ANN001, N803
            self.train()
            opt = torch.optim.Adam(self.parameters(), lr=0.05)
            loss_fn = nn.BCEWithLogitsLoss()
            xt = torch.tensor(X, dtype=torch.float32)
            yt = torch.tensor(y, dtype=torch.float32)
            for _ in range(80):
                opt.zero_grad()
                loss = loss_fn(self.forward(xt), yt)
                loss.backward()
                opt.step()
            return self

        def predict_proba(self, X):  # noqa: ANN001, N803
            self.eval()
            with torch.no_grad():
                logits = self.forward(torch.tensor(X, dtype=torch.float32)).numpy()
            p = 1.0 / (1.0 + np.exp(-logits))
            return np.column_stack([1 - p, p])

    torch.manual_seed(cfg.seed)
    model = TinyMLP(X_train.shape[1])
    return _fit_eval("torch_mlp", model, X_train, y_train, X_test, y_test)


class CampaignEngagementModel:
    """Fit-on-request engagement scorer (mirrors SIL-208 pattern)."""

    def __init__(self, config: Sil309Config | None = None):
        self.config = config or Sil309Config()
        self.winner: ModelCandidate | None = None
        self.candidates: list[ModelCandidate] = []
        self.feature_names = self.config.numeric_features

    def select_and_fit(self, rows: list[dict], outcome: str | None = None) -> dict[str, Any]:
        outcome = outcome or self.config.primary_outcome
        if len(rows) < 20:
            return {"success": False, "error": "insufficient_rows", "n": len(rows)}

        y = np.array([int(r[outcome]) for r in rows], dtype=int)
        if len(set(y.tolist())) < 2:
            return {"success": False, "error": "single_class_labels", "n": len(rows)}

        X = rows_to_matrix(rows, self.feature_names)
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=self.config.test_size,
            random_state=self.config.seed,
            stratify=y if min(np.bincount(y)) >= 2 else None,
        )

        candidates: list[ModelCandidate] = []
        lr = LogisticRegression(
            random_state=self.config.seed,
            max_iter=1000,
            class_weight="balanced",
        )
        c_lr = _fit_eval("logistic_regression", lr, X_train, y_train, X_test, y_test)
        if c_lr:
            candidates.append(c_lr)

        hgb = HistGradientBoostingClassifier(
            max_depth=3,
            max_iter=80,
            learning_rate=0.1,
            random_state=self.config.seed,
        )
        c_hgb = _fit_eval("hist_gradient_boosting", hgb, X_train, y_train, X_test, y_test)
        if c_hgb:
            candidates.append(c_hgb)

        c_torch = _try_torch_mlp(self.config, X_train, y_train, X_test, y_test)
        if c_torch:
            candidates.append(c_torch)

        if not candidates:
            return {"success": False, "error": "no_model_fit"}

        # Prefer AUC; break ties with accuracy then prefer simpler sklearn models
        preference = {"logistic_regression": 0, "hist_gradient_boosting": 1, "torch_mlp": 2}
        winner = sorted(
            candidates,
            key=lambda c: (-c.auc, -c.accuracy, preference.get(c.name, 9)),
        )[0]
        self.winner = winner
        self.candidates = candidates

        # Refit winner on full data for scoring
        winner.estimator.fit(X, y)

        return {
            "success": True,
            "outcome": outcome,
            "chosen_model": winner.name,
            "chosen_auc": round(winner.auc, 4),
            "chosen_accuracy": round(winner.accuracy, 4),
            "candidates": [
                {
                    "name": c.name,
                    "auc": round(c.auc, 4),
                    "accuracy": round(c.accuracy, 4),
                }
                for c in candidates
            ],
            "n_train": int(len(X_train)),
            "n_test": int(len(X_test)),
            "rationale": (
                f"{winner.name} won on holdout AUC ({winner.auc:.3f}) for outcome={outcome}; "
                "SIL-309 prefers demo accuracy over architecture purity."
            ),
        }

    def score_rows(self, rows: list[dict]) -> list[dict[str, Any]]:
        if not self.winner or not rows:
            return []
        X = rows_to_matrix(rows, self.feature_names)
        prob = self.winner.estimator.predict_proba(X)[:, 1]
        scored = []
        for row, p in zip(rows, prob, strict=False):
            scored.append(
                {
                    "agent_id": row.get("agent_id"),
                    "variant": row.get("variant"),
                    "score": round(float(p), 4),
                    "tenure_years": row.get("tenure_years"),
                    "attach_rate": row.get("attach_rate"),
                    "office_id": row.get("office_id"),
                }
            )
        return sorted(scored, key=lambda x: x["score"], reverse=True)

    def feature_insights(self, rows: list[dict]) -> list[dict[str, Any]]:
        """Aggregate what worked from variant-level observed rates + coefficients if LR."""
        insights: list[dict[str, Any]] = []
        by_var: dict[str, list[dict]] = {}
        for r in rows:
            by_var.setdefault(str(r.get("variant")), []).append(r)
        for key, group in sorted(by_var.items()):
            n = len(group)
            insights.append(
                {
                    "variant": key,
                    "n": n,
                    "open_rate": round(sum(r["opened"] for r in group) / n, 4),
                    "click_rate": round(sum(r["clicked"] for r in group) / n, 4),
                    "attach_rate": round(sum(r["attached"] for r in group) / n, 4),
                    "avg_subject_length": round(sum(r["subject_length"] for r in group) / n, 1),
                    "cta_type": group[0].get("cta_type"),
                    "incentive_framing": group[0].get("incentive_framing"),
                    "include_meet_link": bool(group[0].get("include_meet_link")),
                }
            )
        return insights
