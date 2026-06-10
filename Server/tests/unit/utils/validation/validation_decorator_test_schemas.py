"""Pydantic stub schemas for OpenAPI validation decorator tests."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class CreateCalendarRequest(BaseModel):
    summary: str | None = None
    name: str | None = None


class AddCalendarACLRequest(BaseModel):
    role: str | None = None
    scope: dict[str, Any] | None = None
    agent_email: str | None = None


class FreebusyRequest(BaseModel):
    items: list[dict[str, str]] | None = None
    calendarIds: list[str] | None = None


class ClientAvailabilityRequest(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    timezone: str | None = None
    timeMin: str | None = None
    timeMax: str | None = None
    timeZone: str | None = None


class UpdateTaskChecklistRequest(BaseModel):
    data: dict[str, Any] | None = None
    checkedIds: list[int] | None = None


class UpdateChecklistRequest(BaseModel):
    checklist: dict[str, Any] | None = None


class BulkUpdateFavoritesRequest(BaseModel):
    favorites: list[Any] | None = None


class AddFeedLikeRequest(BaseModel):
    home_id: str | None = None
    homeId: str | None = None


class AddCommentRequest(BaseModel):
    home_id: str | None = None
    homeId: str | None = None


class ClientErrorReport(BaseModel):
    error_message: str | None = None
    message: str | None = None
    name: str | None = None
    stack: str | None = None
    user_agent: str | None = None
    userAgent: str | None = None


class ValidRequestBody(BaseModel):
    email: str
    password: str


class InvalidRequestBody(BaseModel):
    required_token: str


class InvalidQueryParams(BaseModel):
    required_id: str


class ValidResponseBody(BaseModel):
    success: bool


class FormAllFields(BaseModel):
    title: str
    count: int | None = None


class FormSingleKey(BaseModel):
    metadata: str


class FormJsonBlob(BaseModel):
    label: str | None = None
    value: int | None = None
