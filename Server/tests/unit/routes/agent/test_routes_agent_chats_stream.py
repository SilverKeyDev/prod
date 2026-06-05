"""Auth and generator behavior for messaging SSE stream."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

_SERVER_ROOT = Path(__file__).resolve().parents[4]


def _load_chats_stream_module():
    """Load chats_stream without importing handlers/__init__.py (avoids circular imports)."""
    # Use an isolated module name so pass-through auth mocks never replace the real route module.
    name = "_test_chats_stream_isolated"
    if name in sys.modules:
        return sys.modules[name]

    messaging_realtime = MagicMock()
    messaging_realtime.CHANNEL_PREFIX = "sk:messaging:user:"
    messaging_realtime.messaging_redis_url = MagicMock(return_value="redis://localhost:6379/0")

    common_patterns = MagicMock()
    common_patterns.handle_exceptions_with_logging = lambda f: f
    common_patterns.require_authenticated_user = lambda f: f

    security = MagicMock()
    security.rate_limit = lambda **_kwargs: lambda f: f

    patched_modules = (
        "app.services.agent.conversation.messaging_realtime",
        "app.utils.common_patterns",
        "app.utils.security",
    )
    saved_modules = {key: sys.modules.get(key) for key in patched_modules}

    try:
        sys.modules["app.services.agent.conversation.messaging_realtime"] = messaging_realtime
        sys.modules["app.utils.common_patterns"] = common_patterns
        sys.modules["app.utils.security"] = security

        spec = importlib.util.spec_from_file_location(
            name,
            _SERVER_ROOT / "app/routes/agent/handlers/chats_stream.py",
        )
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        sys.modules[name] = module
        spec.loader.exec_module(module)
        return module
    finally:
        for key in patched_modules:
            original = saved_modules[key]
            if original is None:
                sys.modules.pop(key, None)
            else:
                sys.modules[key] = original


_chats_stream = _load_chats_stream_module()
_messaging_sse_generator = _chats_stream._messaging_sse_generator


class TestAgentChatsStreamAuth:
    def test_stream_returns_401_without_user(self, client):
        with patch("app.services.auth.get_current_user", return_value=None):
            response = client.get("/api/v1/agent/chats/stream")
        assert response.status_code == 401


class TestMessagingSseGenerator:
    def test_closes_dedicated_pubsub_client_on_stream_end(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")

        mock_client = MagicMock()
        mock_pubsub = MagicMock()
        mock_client.pubsub.return_value = mock_pubsub
        mock_pubsub.get_message.return_value = None

        with patch.object(
            _chats_stream,
            "create_messaging_pubsub_client",
            return_value=mock_client,
        ):
            gen = _messaging_sse_generator("user-1")
            assert next(gen).startswith('data: {"kind": "_hello"')
            assert next(gen) == ": ping\n\n"
            gen.close()

        mock_pubsub.subscribe.assert_called_once_with("sk:messaging:user:user-1")
        mock_pubsub.unsubscribe.assert_called_once_with("sk:messaging:user:user-1")
        mock_pubsub.close.assert_called_once()
        mock_client.close.assert_called_once()

    def test_subscribe_failure_falls_back_to_heartbeats(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")

        mock_client = MagicMock()
        mock_pubsub = MagicMock()
        mock_client.pubsub.return_value = mock_pubsub
        mock_pubsub.subscribe.side_effect = ConnectionError("redis down")

        with patch.object(
            _chats_stream,
            "create_messaging_pubsub_client",
            return_value=mock_client,
        ):
            gen = _messaging_sse_generator("user-2")
            assert next(gen).startswith('data: {"kind": "_hello"')
            assert next(gen) == ": ping\n\n"
            gen.close()

        mock_client.close.assert_called_once()

    def test_pubsub_read_error_sends_heartbeat_instead_of_raising(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")

        mock_client = MagicMock()
        mock_pubsub = MagicMock()
        mock_client.pubsub.return_value = mock_pubsub
        mock_pubsub.get_message.side_effect = [ConnectionError("read failed"), None]

        with patch.object(
            _chats_stream,
            "create_messaging_pubsub_client",
            return_value=mock_client,
        ):
            gen = _messaging_sse_generator("user-3")
            assert next(gen).startswith('data: {"kind": "_hello"')
            assert next(gen) == ": ping\n\n"
            assert next(gen) == ": ping\n\n"
            gen.close()

        mock_client.close.assert_called_once()
