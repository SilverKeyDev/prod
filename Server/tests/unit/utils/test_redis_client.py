"""Tests for shared Redis client helpers (scale-readiness)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

import app.utils.cache.redis_client as redis_client_module
from app.utils.cache.redis_client import (
    get_pubsub_redis,
    get_shared_redis,
    ping_shared_redis,
    redis_url,
)


@pytest.fixture(autouse=True)
def _reset_redis_singletons():
    redis_client_module._redis = None
    redis_client_module._pubsub_redis = None
    yield
    redis_client_module._redis = None
    redis_client_module._pubsub_redis = None


class TestRedisUrl:
    def test_prefers_redis_url_env(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://primary:6379/0")
        monkeypatch.setenv("CELERY_URL", "redis://celery:6379/1")
        assert redis_url() == "redis://primary:6379/0"

    def test_falls_back_to_celery_url(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.setenv("CELERY_URL", "redis://celery:6379/0")
        assert redis_url() == "redis://celery:6379/0"

    def test_returns_none_when_unset(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.delenv("CELERY_URL", raising=False)
        assert redis_url() is None


class TestSharedRedisClient:
    def test_get_shared_redis_returns_none_without_url(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.delenv("CELERY_URL", raising=False)
        assert get_shared_redis() is None

    @patch("redis.Redis.from_url")
    def test_get_shared_redis_uses_short_read_timeout(self, mock_from_url, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
        mock_from_url.return_value = MagicMock()
        get_shared_redis()
        _, kwargs = mock_from_url.call_args
        assert kwargs["socket_timeout"] == 5.0
        assert kwargs["max_connections"] == 32

    @patch("redis.Redis.from_url")
    def test_get_pubsub_redis_uses_no_read_timeout(self, mock_from_url, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
        mock_from_url.return_value = MagicMock()
        get_pubsub_redis()
        _, kwargs = mock_from_url.call_args
        assert kwargs["socket_timeout"] is None

    @patch("redis.Redis.from_url")
    def test_singleton_reuses_client(self, mock_from_url, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
        client = MagicMock()
        mock_from_url.return_value = client
        assert get_shared_redis() is client
        assert get_shared_redis() is client
        mock_from_url.assert_called_once()


class TestPingSharedRedis:
    def test_ping_returns_false_when_redis_unconfigured(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.delenv("CELERY_URL", raising=False)
        assert ping_shared_redis() is False

    @patch("redis.Redis.from_url")
    def test_ping_returns_true_on_success(self, mock_from_url, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
        mock_from_url.return_value.ping.return_value = True
        assert ping_shared_redis() is True

    @patch("redis.Redis.from_url")
    def test_ping_returns_false_on_error(self, mock_from_url, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
        mock_from_url.return_value.ping.side_effect = ConnectionError("down")
        assert ping_shared_redis() is False
