"""
Tabular model prediction for user-home match scores.
Adds diagnostics to trace constant outputs, feature alignment issues, and raw input parsing.

This candidate set is already filtered to the user's needs; we're looking for very
incremental upsides and tiny differentiators. The code is resilient to partial
feature outputs (e.g., 17 generated vs 21 expected) by aligning to training-time
feature names and filling any missing features with neutral values derived from
the scaler's mean (when available), avoiding crashes like:
"Batch feature length mismatch: got 17 but model expects 21".
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import logging
from pathlib import Path
import hashlib

from ..config.settings import TABULAR_MODEL_PATH
from ..utils.feature_engineering import FeatureEngineer
from ..utils.preprocessing import DataPreprocessor
from ..utils.io import load_model

logger = logging.getLogger(__name__)

# ---- Tunables ---------------------------------------------------------------

# If the model is a classifier and has predict_proba, use the positive-class prob.
USE_PREDICT_PROBA_IF_AVAILABLE = True

# Round precision for hashing/logging to avoid false diffs due to float noise
ROUND_PREC = 6

# If True, emit a WARNING when tabular features are (nearly) constant across homes
WARN_ON_CONSTANT_BATCH = True

# Threshold for considering a column/array "constant"
CONST_EPS = 1e-12

# ----------------------------------------------------------------------------


class TabularPredictor:
    """Predicts match scores using trained tabular model."""

    def __init__(self, model_path: str = None):
        self.model_path = model_path or str(TABULAR_MODEL_PATH)
        self.model = None
        self.scaler = None
        self.feature_names: Optional[List[str]] = None  # names used at TRAIN time
        self.model_type = None
        self.feature_engineer = FeatureEngineer()
        self.preprocessor = DataPreprocessor()
        self.is_loaded = False

    # ------------------------ Loading ---------------------------------------

    def load_model(self) -> None:
        """Load trained model and scaler."""
        try:
            if not Path(self.model_path).exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")

            model_data = load_model(self.model_path)

            self.model = model_data["model"]
            self.scaler = model_data["scaler"]
            self.feature_names = model_data.get("feature_names", None)
            self.model_type = model_data.get("model_type", "unknown")
            self.is_loaded = True

        except Exception as e:
            logger.error(f"[TABULAR] Error loading model: {e}", exc_info=True)
            raise

    # ------------------------ Internals -------------------------------------

    def _hash_row(self, row: np.ndarray) -> str:
        """Stable hash for a feature row for variability checks."""
        arr = np.round(np.asarray(row, dtype=float), ROUND_PREC)
        return hashlib.md5(arr.tobytes()).hexdigest()

    def _report_constant_columns(self, X: np.ndarray, names: Optional[List[str]] = None) -> None:
        """Log any columns that are (nearly) constant across rows, with names if available."""
        if X.size == 0 or X.shape[0] < 2:
            return
        stds = np.nanstd(X, axis=0)
        const_idx = np.where(stds <= CONST_EPS)[0].tolist()
        if not const_idx:
            return


    def _neutral_vector(self, length: int) -> np.ndarray:
        """
        Produce a neutral filler vector for missing features:
        - If scaler exposes `mean_`, use it to minimize post-scale distortion.
        - Else fall back to zeros.
        """
        mean_attr = getattr(self.scaler, "mean_", None)
        if isinstance(mean_attr, np.ndarray) and mean_attr.shape[0] == length:
            return mean_attr.astype(float).copy()
        return np.zeros((length,), dtype=float)

    def _align_by_name_or_pad(
        self,
        f_row: np.ndarray,
        fe_output_names: Optional[List[str]],
    ) -> Tuple[np.ndarray, List[str], List[str]]:
        """
        Align a single feature row to training order by name.
        If some model-required features are missing, fill them with neutral values.
        Returns: (ordered_row, ordered_names, missing_names)

        - If self.feature_names is None, returns the row as-is with given names.
        - If names are not provided and lengths differ, pads/truncates to model length with neutral values.
        """
        if self.feature_names is None:
            # No training-time names; assume current order is correct.
            current_names = fe_output_names or [f"col_{i}" for i in range(f_row.shape[0])]
            return f_row.astype(float), current_names, []

        model_names = list(self.feature_names)
        m = len(model_names)

        # If we have current names, build name->value map and place values in model order.
        if fe_output_names and len(fe_output_names) == f_row.shape[0]:
            name_to_val = {n: float(f_row[i]) for i, n in enumerate(fe_output_names)}
            ordered = np.empty((m,), dtype=float)
            ordered[:] = np.nan  # mark missing to fill with neutral after
            missing = []
            for i, name in enumerate(model_names):
                if name in name_to_val:
                    ordered[i] = name_to_val[name]
                else:
                    missing.append(name)
            # Fill any NaNs with neutral values
            if missing:
                neutral = self._neutral_vector(m)
                nan_idx = np.where(np.isnan(ordered))[0]
                ordered[nan_idx] = neutral[nan_idx]
                logger.warning(
                    "[TABULAR][ALIGN] Missing %d features not produced by FE; filled with neutral values. Missing=%s",
                    len(missing), missing[:30]
                )
            return ordered, model_names, missing

        # No names (or mismatch). If lengths equal, pass through.
        if f_row.shape[0] == m:
            return f_row.astype(float), model_names, []

        # Length differs and we can't map by name: pad/truncate to model length using neutral values.
        logger.warning(
            "[TABULAR][ALIGN] Feature length mismatch without names: got %d, expected %d. "
            "Padding/truncating with neutral values.",
            f_row.shape[0], m
        )
        ordered = self._neutral_vector(m)
        n = min(m, f_row.shape[0])
        ordered[:n] = f_row[:n].astype(float)
        # Missing names are the tail we couldn't fill by value (best-effort)
        missing = model_names[n:]
        return ordered, model_names, missing

    def _align_and_scale_single(
        self, features: np.ndarray, fe_output_names: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Align feature vector to training order (self.feature_names) if available.
        Fills missing features with neutral values (scaler mean) to avoid length mismatch crashes.
        Returns (ordered_features, scaled_features, missing_names).
        """
        f = np.asarray(features, dtype=float).reshape(1, -1)
        ordered_row, missing = self._align_by_name_or_pad(f[0], fe_output_names)
        ordered = ordered_row.reshape(1, -1)

        # Scale
        fs = self.scaler.transform(ordered)

        return ordered, fs, missing

    def _predict_array(self, X_scaled: np.ndarray) -> np.ndarray:
        """Predict helper that prefers predict_proba for classifiers if available."""
        try:
            if USE_PREDICT_PROBA_IF_AVAILABLE and hasattr(self.model, "predict_proba"):
                proba = self.model.predict_proba(X_scaled)
                # If binary classifier, take positive-class column
                if proba.ndim == 2 and proba.shape[1] >= 2:
                    y = proba[:, 1]
                else:
                    # Fallback to mean/proba[:,0] if weird shape
                    y = proba.squeeze()
            else:
                y = self.model.predict(X_scaled)

            y = np.asarray(y, dtype=float)

            return y
        except Exception as e:
            logger.error(f"[TABULAR] Error during model prediction: {e}", exc_info=True)
            # Return zeros of appropriate length
            return np.zeros((X_scaled.shape[0],), dtype=float)

    # ------------------------ Public: Single --------------------------------

    def predict_match_score(self, user_data: Dict[str, Any], home_data: Dict[str, Any]) -> float:
        """Predict match score for a user-home pair."""
        try:
            if not self.is_loaded:
                self.load_model()

            # Preprocess data
            user_processed = self.preprocessor.preprocess_user_data(user_data)
            home_processed = self.preprocessor.preprocess_home_data(home_data)
            # Create features + (optional) feature names in generation order
            fe_output_names = getattr(self.feature_engineer, "get_feature_names", lambda: None)()

            features = self.feature_engineer.create_all_features(
                user_processed.get("preferences", {}),
                home_processed
            )
            features = np.asarray(features, dtype=float)

            # Align & Scale (fills missing-by-name)
            _, features_scaled = self._align_and_scale_single(features, fe_output_names)

            # Predict
            raw = self._predict_array(features_scaled)[0]

            # Ensure score is in [0, 1]
            score = float(np.clip(raw, 0.0, 1.0))


            return score

        except Exception as e:
            logger.error(f"[TABULAR] Error predicting match score: {e}", exc_info=True)
            return 0.0

    # ------------------------ Public: Batch ---------------------------------

    def predict_batch(
        self,
        user_data: Dict[str, Any],
        homes_data: List[Dict[str, Any]]
    ) -> List[float]:
        """Predict match scores for a user against multiple homes."""
        try:
            if not self.is_loaded:
                self.load_model()

            if not homes_data:
                return []

            # Preprocess user data once
            user_processed = self.preprocessor.preprocess_user_data(user_data)
            user_prefs = user_processed.get("preferences", {})

            fe_output_names = getattr(self.feature_engineer, "get_feature_names", lambda: None)()

            # Create features for all homes
            all_features: List[np.ndarray] = []
            row_debug_samples: List[str] = []

            for idx, home_data in enumerate(homes_data):
                home_processed = self.preprocessor.preprocess_home_data(home_data)

                features = self.feature_engineer.create_all_features(user_prefs, home_processed)
                features = np.asarray(features, dtype=float)
                all_features.append(features)

                if logger.isEnabledFor(logging.DEBUG) and idx < 3:
                    # Log first few feature rows for inspection
                    if fe_output_names:
                        preview = list(zip(fe_output_names[:8], np.round(features[:8], 4).tolist()))
                        row_debug_samples.append(str(preview))
                    else:
                        row_debug_samples.append(str(np.round(features[:8], 4).tolist()))

            # Convert to array
            X_raw = np.array(all_features, dtype=float)

            # Align each row by name (or pad) to match training-time features
            if self.feature_names:
                model_len = len(self.feature_names)
                X_aligned = np.empty((X_raw.shape[0], model_len), dtype=float)
                missing_any = set()
                for i in range(X_raw.shape[0]):
                    ordered_row, ordered_names, missing = self._align_by_name_or_pad(
                        X_raw[i], fe_output_names
                    )
                    X_aligned[i] = ordered_row
                    for m in missing:
                        missing_any.add(m)
                if missing_any:
                    logger.warning(
                        "[TABULAR][BATCH] Some model-required features (%d) were missing in FE output and "
                        "filled with neutral values. Missing (sample): %s",
                        len(missing_any), list(missing_any)[:30]
                    )
            else:
                # No training-time names—assume as-is
                X_aligned = X_raw

            # Report constant columns after alignment
            self._report_constant_columns(X_aligned, self.feature_names or fe_output_names)

            # Scale
            X_scaled = self.scaler.transform(X_aligned)

            # Predict all scores
            raw_scores = self._predict_array(X_scaled)

            # Ensure scores are in [0, 1] range
            scores = np.clip(raw_scores, 0.0, 1.0)

            # Optional warning if scores are (nearly) identical
            if WARN_ON_CONSTANT_BATCH and (np.nanstd(scores) <= CONST_EPS):
                logger.warning(
                    "[TABULAR][BATCH] Predicted scores are constant/near-constant across homes "
                    "(std=%.2e). Check feature variability and parsing.",
                    float(np.nanstd(scores))
                )

            return scores.tolist()

        except Exception as e:
            logger.error(f"[TABULAR] Error predicting batch scores: {e}", exc_info=True)
            return [0.0] * len(homes_data)

    # ------------------------ Public: Explainability ------------------------

    def predict_with_explanation(
        self,
        user_data: Dict[str, Any],
        home_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Predict match score with feature-level explanation."""
        try:
            if not self.is_loaded:
                self.load_model()

            # Get prediction
            score = self.predict_match_score(user_data, home_data)

            # Create features for analysis
            user_processed = self.preprocessor.preprocess_user_data(user_data)
            home_processed = self.preprocessor.preprocess_home_data(home_data)

            fe_output_names = getattr(self.feature_engineer, "get_feature_names", lambda: None)()
            features = self.feature_engineer.create_all_features(
                user_processed.get("preferences", {}),
                home_processed
            )
            features = np.asarray(features, dtype=float)

            # Get feature importance (if available)
            feature_importance: Dict[str, float] = {}
            if hasattr(self.model, "feature_importances_") and self.feature_names:
                try:
                    importances = getattr(self.model, "feature_importances_")
                    feature_importance = dict(zip(self.feature_names, importances))
                except Exception:
                    feature_importance = {}

            # Calculate feature contributions (approximate, importance * value on raw scale)
            feature_contributions: Dict[str, Dict[str, float]] = {}
            # Align names used for contributions:
            names_for_contrib = self.feature_names or fe_output_names
            if names_for_contrib and len(features) == len(names_for_contrib):
                for name, value in zip(names_for_contrib, features):
                    importance = float(feature_importance.get(name, 0.0))
                    contribution = float(value) * importance
                    feature_contributions[name] = {
                        "value": float(value),
                        "importance": importance,
                        "contribution": contribution,
                    }

            explanation = {
                "predicted_score": float(score),
                "model_type": self.model_type,
                "feature_contributions": feature_contributions,
                "top_positive_features": [],
                "top_negative_features": [],
                "user_home_summary": {
                    "user_budget": f"${user_processed.get('preferences', {}).get('budget_min', 0):,} - "
                                   f"${user_processed.get('preferences', {}).get('budget_max', 0):,}",
                    "home_price": f"${home_processed.get('price', 0):,}",
                    "user_bedrooms": user_processed.get("preferences", {}).get("preferred_bedrooms", "Not specified"),
                    "home_bedrooms": home_processed.get("bedrooms", "Not specified"),
                    "user_bathrooms": user_processed.get("preferences", {}).get("preferred_bathrooms", "Not specified"),
                    "home_bathrooms": home_processed.get("bathrooms", "Not specified"),
                },
            }

            # Sort features by contribution
            if feature_contributions:
                sorted_items = sorted(
                    feature_contributions.items(),
                    key=lambda x: x[1]["contribution"],
                    reverse=True
                )

                explanation["top_positive_features"] = [
                    {"name": name, **data}
                    for name, data in sorted_items[:5]
                    if data["contribution"] > 0
                ]

                explanation["top_negative_features"] = [
                    {"name": name, **data}
                    for name, data in reversed(sorted_items[-5:])
                    if data["contribution"] < 0
                ]

            return explanation

        except Exception as e:
            logger.error(f"[TABULAR] Error predicting with explanation: {e}", exc_info=True)
            return {
                "predicted_score": 0.0,
                "error": str(e),
            }

    # ------------------------ Public: Info ----------------------------------

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        try:
            if not self.is_loaded:
                self.load_model()

            info = {
                "model_type": self.model_type,
                "model_path": self.model_path,
                "feature_count": len(self.feature_names) if self.feature_names else 0,
                "feature_names": self.feature_names,
                "is_loaded": self.is_loaded,
            }

            # Add model-specific info
            for attr in ("n_estimators", "max_depth", "learning_rate"):
                if hasattr(self.model, attr):
                    info[attr] = getattr(self.model, attr)

            return info

        except Exception as e:
            logger.error(f"[TABULAR] Error getting model info: {e}", exc_info=True)
            return {"error": str(e)}


# ------------------------ Global singleton & helpers -------------------------

_global_predictor: Optional[TabularPredictor] = None


def get_predictor(model_path: str = None) -> TabularPredictor:
    """Get global predictor instance (singleton pattern)."""
    global _global_predictor

    if _global_predictor is None or (model_path and model_path != _global_predictor.model_path):
        _global_predictor = TabularPredictor(model_path)

    return _global_predictor


def predict_match_score(user_data: Dict[str, Any], home_data: Dict[str, Any]) -> float:
    """Convenience function for single prediction."""
    predictor = get_predictor()
    return predictor.predict_match_score(user_data, home_data)


def predict_batch_scores(user_data: Dict[str, Any], homes_data: List[Dict[str, Any]]) -> List[float]:
    """Convenience function for batch prediction."""
    predictor = get_predictor()
    return predictor.predict_batch(user_data, homes_data)
