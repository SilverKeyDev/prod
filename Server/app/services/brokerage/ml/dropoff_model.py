from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score

from app.services.brokerage.ml.config import Sil208Config


class DropoffRiskModel:
    def __init__(self, config: Sil208Config | None = None):
        self.config = config or Sil208Config()
        self.model = LogisticRegression(
            random_state=self.config.seed,
            max_iter=1000,
            class_weight="balanced",
        )

    def _to_X(self, rows: list[dict]) -> np.ndarray:
        return np.array(
            [
                [float(r["count"]), float(r["drop_off_percent"]), float(r["avg_days_in_stage"])]
                for r in rows
            ],
            dtype=float,
        )

    def fit(self, rows: list[dict], labels: list[int]) -> dict:
        X = self._to_X(rows)
        y = np.array(labels, dtype=int)

        self.model.fit(X, y)
        prob = self.model.predict_proba(X)[:, 1]
        pred = (prob >= 0.5).astype(int)

        auc = 0.5
        if len(set(labels)) > 1:
            auc = float(roc_auc_score(y, prob))

        return {
            "accuracy": float(accuracy_score(y, pred)),
            "precision": float(precision_score(y, pred, zero_division=0)),
            "recall": float(recall_score(y, pred, zero_division=0)),
            "auc": auc,
        }

    def score_rows(self, rows: list[dict]) -> list[dict]:
        if not rows:
            return []

        X = self._to_X(rows)
        prob = self.model.predict_proba(X)[:, 1]
        out = [
            {
                "stage": row["stage"],
                "score": round(float(score), 4),
                "sample_size": int(row["count"]),
            }
            for row, score in zip(rows, prob, strict=False)
        ]
        return sorted(out, key=lambda x: x["score"], reverse=True)
