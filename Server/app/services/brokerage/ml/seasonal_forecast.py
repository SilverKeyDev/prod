from __future__ import annotations

import math

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error

from app.services.brokerage.ml.config import Sil208Config


def _month_features(index: int, month_num: int) -> list[float]:
    return [
        float(index),
        math.sin(2 * math.pi * month_num / 12.0),
        math.cos(2 * math.pi * month_num / 12.0),
    ]


class SeasonalVolumeForecaster:
    def __init__(self, config: Sil208Config | None = None):
        self.config = config or Sil208Config()
        self.model = LinearRegression()
        self.residual_std = 0.0

    def fit(self, monthly_counts: dict[str, int]) -> dict:
        keys = sorted(monthly_counts.keys())
        y = np.array([monthly_counts[k] for k in keys], dtype=float)

        X = []
        for i, key in enumerate(keys):
            month_num = int(key.split("-")[1])
            X.append(_month_features(i, month_num))
        X = np.array(X, dtype=float)

        self.model.fit(X, y)
        pred = self.model.predict(X)
        resid = y - pred
        self.residual_std = float(np.std(resid)) if len(resid) else 0.0

        split = max(1, len(keys) - 6)
        y_test = y[split:]
        p_test = pred[split:]

        return {
            "mape": float(mean_absolute_percentage_error(y_test, np.maximum(p_test, 1e-6))),
            "rmse": float(math.sqrt(mean_squared_error(y_test, p_test))),
            "train_months": len(keys),
        }

    def forecast(self, monthly_counts: dict[str, int], horizon: int | None = None) -> list[dict]:
        horizon = horizon or self.config.forecast_horizon_months
        keys = sorted(monthly_counts.keys())
        if not keys:
            return []

        start_idx = len(keys)
        y = int(keys[-1].split("-")[0])
        m = int(keys[-1].split("-")[1])

        out = []
        for step in range(horizon):
            m += 1
            if m == 13:
                m = 1
                y += 1

            X = np.array([_month_features(start_idx + step, m)], dtype=float)
            raw_pred = float(self.model.predict(X)[0])
            safe_pred = max(0.0, raw_pred)
            lower = max(0.0, safe_pred - 1.96 * self.residual_std)
            upper = max(0.0, safe_pred + 1.96 * self.residual_std)

            out.append(
                {
                    "month": f"{y}-{m:02d}-01",
                    "predicted_count": int(round(safe_pred)),
                    "lower": int(round(lower)),
                    "upper": int(round(upper)),
                }
            )
        return out
