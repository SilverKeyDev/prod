"""SkySlope Partnership API client."""

from typing import Any

import requests

from app.config.skyslope import get_skyslope_config

DEFAULT_API_BASE = "https://forms.skyslope.com/partner/api"


class SkySlopeApiError(Exception):
    """Raised when SkySlope API returns an error."""

    def __init__(self, message: str, status_code: int | None = None, response: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class SkySlopeApiClient:
    """Client for SkySlope Partnership API."""

    def __init__(self, access_token: str, api_base: str | None = None):
        self.access_token = access_token
        self.api_base = (
            api_base or get_skyslope_config().get("api_base", DEFAULT_API_BASE)
        ).rstrip("/")
        self._session = requests.Session()
        self._session.headers.update({"Authorization": f"Bearer {access_token}"})

    def _request(
        self,
        method: str,
        path: str,
        json: dict | None = None,
        params: dict | None = None,
    ) -> dict | list:
        url = f"{self.api_base}{path}"
        resp = self._session.request(method, url, json=json, params=params, timeout=30)
        if resp.status_code >= 400:
            try:
                err_body = resp.json()
            except Exception:
                err_body = {"raw": resp.text}
            raise SkySlopeApiError(
                f"SkySlope API error: {resp.status_code}",
                status_code=resp.status_code,
                response=err_body,
            )
        if resp.status_code == 204 or not resp.content:
            return {}
        return resp.json()

    def get_user_profile(self) -> dict[str, Any]:
        """Get the authenticated user's profile."""
        return self._request("GET", "/users/profile")  # type: ignore[return-value]

    def get_libraries(self) -> list[dict[str, Any]]:
        """Get libraries the user has access to."""
        data = self._request("GET", "/libraries")
        return data.get("libraries", []) if isinstance(data, dict) else []

    def get_forms(
        self,
        library_ids: list[int] | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Get forms. Optionally filter by library IDs."""
        params: dict[str, Any] = {"page": page, "pageSize": page_size}
        if library_ids:
            params["libraryIds"] = ",".join(str(x) for x in library_ids)
        data = self._request("GET", "/forms", params=params)
        return data if isinstance(data, dict) else {"forms": [], "totalRecords": 0}

    def get_library_form_versions(self, library_id: int) -> list[dict[str, Any]]:
        """Get form versions for a library."""
        data = self._request("GET", f"/libraries/{library_id}/form-versions")
        return data.get("formVersions", []) if isinstance(data, dict) else []

    def create_file(
        self,
        name: str,
        representation_type: str,
        property_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Create a listing or transaction file."""
        body = {
            "name": name,
            "representationType": representation_type,
            "property": property_data,
        }
        return self._request("POST", "/files", json=body)  # type: ignore[return-value]

    def get_file(self, file_id: int) -> dict[str, Any]:
        """Get file details."""
        return self._request("GET", f"/files/{file_id}")  # type: ignore[return-value]

    def add_documents_to_file(self, file_id: int, form_ids: list[int]) -> dict[str, Any]:
        """Add forms to a file. Returns documentIds."""
        return self._request(
            "PATCH",
            f"/files/{file_id}/documents",
            json={"formIds": form_ids},
        )  # type: ignore[return-value]

    def get_file_documents(self, file_id: int) -> list[dict[str, Any]]:
        """Get documents in a file."""
        data = self._request("GET", f"/files/{file_id}/documents")
        return data.get("documents", []) if isinstance(data, dict) else []

    def create_envelope(
        self,
        file_id: int,
        envelope_name: str,
        document_ids: list[int],
    ) -> dict[str, Any]:
        """Create a signing envelope in a file."""
        body = {
            "envelopeName": envelope_name,
            "documentIds": document_ids,
        }
        return self._request("POST", f"/files/{file_id}/envelopes", json=body)  # type: ignore[return-value]
