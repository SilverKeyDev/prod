"""Tests for admin authorization helpers."""

from types import SimpleNamespace

from app.utils.admin import user_has_admin_role


def test_super_admin_allowed():
    user = SimpleNamespace(user_roles=[SimpleNamespace(role="super_admin")])
    assert user_has_admin_role(user) is True


def test_admin_allowed():
    user = SimpleNamespace(user_roles=[SimpleNamespace(role="admin")])
    assert user_has_admin_role(user) is True


def test_manager_not_admin_gate():
    user = SimpleNamespace(user_roles=[SimpleNamespace(role="manager")])
    assert user_has_admin_role(user) is False


def test_user_admin_flag_does_not_grant_access():
    user = SimpleNamespace(user_roles=[], user_admin=SimpleNamespace(is_admin=True))
    assert user_has_admin_role(user) is False


def test_no_roles():
    user = SimpleNamespace(user_roles=[])
    assert user_has_admin_role(user) is False
