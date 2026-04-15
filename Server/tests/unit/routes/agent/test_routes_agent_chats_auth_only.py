"""Tests for agent chat and todo auth requirements."""

import jwt as pyjwt

MOCK_JWT_TOKEN = pyjwt.encode(
    {"sub": "test-user", "email": "test@example.com"}, "test-secret", algorithm="HS256"
)


class TestAgentChatsAuthAndValidation:
    """Test auth and validation for agent chats"""

    def test_chats_endpoints_require_auth(self, client):
        """Test that all chat endpoints require authentication"""
        endpoints = [
            ("/api/v1/agent/chats", "GET"),
            ("/api/v1/agent/chats", "POST"),
            ("/api/v1/agent/chats/conv-1/history", "GET"),
            ("/api/v1/agent/chats/message", "POST"),
            ("/api/v1/agent/chats/conv-1/read", "POST"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})

            assert response.status_code == 401, f"Expected 401 for {method} {endpoint}"

    def test_todos_endpoints_require_auth(self, client):
        """Test that all todo endpoints require authentication"""
        endpoints = [
            ("/api/v1/agent/todos", "GET"),
            ("/api/v1/agent/todos", "POST"),
            ("/api/v1/agent/todos/todo-1", "PUT"),
            ("/api/v1/agent/todos/todo-1", "DELETE"),
        ]

        for endpoint, method in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
            elif method == "PUT":
                response = client.put(endpoint, json={})
            elif method == "DELETE":
                response = client.delete(endpoint)

            assert response.status_code == 401, f"Expected 401 for {method} {endpoint}"
