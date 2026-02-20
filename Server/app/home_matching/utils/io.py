"""
Input/Output utilities for loading and saving data.
"""

import json
import logging
import pickle
from pathlib import Path
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)


def load_json(file_path: str | Path) -> dict[str, Any]:
    """Load JSON data from file."""
    try:
        with open(file_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading JSON from {file_path}: {e}")
        raise


def save_json(data: dict[str, Any], file_path: str | Path) -> None:
    """Save data to JSON file."""
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error saving JSON to {file_path}: {e}")
        raise


def load_csv(file_path: str | Path) -> pd.DataFrame:
    """Load CSV data into DataFrame."""
    try:
        return pd.read_csv(file_path)
    except Exception as e:
        logger.error(f"Error loading CSV from {file_path}: {e}")
        raise


def save_csv(df: pd.DataFrame, file_path: str | Path) -> None:
    """Save DataFrame to CSV file."""
    try:
        df.to_csv(file_path, index=False)
    except Exception as e:
        logger.error(f"Error saving CSV to {file_path}: {e}")
        raise


def load_model(file_path: str | Path) -> Any:
    """Load pickled model from file."""
    try:
        with open(file_path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        logger.error(f"Error loading model from {file_path}: {e}")
        raise


def save_model(model: Any, file_path: str | Path) -> None:
    """Save model to pickle file."""
    try:
        with open(file_path, "wb") as f:
            pickle.dump(model, f)
    except Exception as e:
        logger.error(f"Error saving model to {file_path}: {e}")
        raise


def load_user_data(file_path: str | Path) -> dict[str, Any]:
    """Load user preference data from JSON."""
    user_data = load_json(file_path)

    # Validate required fields
    required_fields = ["user_id", "preferences"]
    for field in required_fields:
        if field not in user_data:
            raise ValueError(f"Missing required field: {field}")

    return user_data


def load_home_data(file_path: str | Path) -> dict[str, Any]:
    """Load home data from JSON."""
    home_data = load_json(file_path)

    # Validate required fields
    required_fields = ["home_id", "address", "price"]
    for field in required_fields:
        if field not in home_data:
            raise ValueError(f"Missing required field: {field}")

    return home_data


def load_multiple_homes(directory: str | Path) -> list[dict[str, Any]]:
    """Load multiple home JSON files from directory."""
    directory = Path(directory)
    homes = []

    for json_file in directory.glob("*.json"):
        try:
            home_data = load_home_data(json_file)
            homes.append(home_data)
        except Exception as e:
            logger.warning(f"Skipping {json_file}: {e}")

    return homes


def load_multiple_users(directory: str | Path) -> list[dict[str, Any]]:
    """Load multiple user JSON files from directory."""
    directory = Path(directory)
    users = []

    for json_file in directory.glob("*.json"):
        try:
            user_data = load_user_data(json_file)
            users.append(user_data)
        except Exception as e:
            logger.warning(f"Skipping {json_file}: {e}")

    return users
