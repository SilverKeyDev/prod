# Skyslope "Prove It Works" – Implementation Plan

**Goal:** Prove the integration pipe: complete SkySlope OAuth (authorization code + PKCE), obtain an access token, and call one read API (User Profile or Get Templates). Minimal UI: one "Connect SkySlope" entry point, ideally Admin-only; callback shows success and proof (e.g. profile name or template count).

**Out of scope for this plan:** Storing/refreshing tokens, "Add from SkySlope" flows, SignatureProvider implementation, checklist completion.

**References:**
- SkySlope Partnership API: https://forms.skyslope.com/partner/api/docs
- Auth: OAuth 2.0 authorization code + PKCE (S256)
- Existing: `Server/app/services/signature/base.py`, `Server/config/.env.example` (SKYSLOPE_ACCESS_KEY, SKYSLOPE_SECRET), Admin routes and `AdminPage.tsx`

---

## 1. Prerequisites (manual / ops)

- [ ] **SkySlope partner app:** In SkySlope partner portal, ensure app has client_id (→ `SKYSLOPE_ACCESS_KEY`) and client_secret (→ `SKYSLOPE_SECRET`).
- [ ] **Redirect URI:** Register redirect URI(s) for this app (e.g. `https://<your-domain>/api/v1/skyslope/callback`, and for local dev `http://localhost:<port>/api/v1/skyslope/callback` if applicable).
- [ ] **Server env:** Set `SKYSLOPE_ACCESS_KEY`, `SKYSLOPE_SECRET`, and (if not derived) `SKYSLOPE_REDIRECT_URI` (or equivalent) in Server `.env` / secrets; do not commit secrets.

---

## 2. Backend – Skyslope OAuth and one read

### 2.1 Config

- [ ] Add Skyslope config (read from env): `client_id`, `client_secret`, `redirect_uri`, `authorize_url` (`https://accounts.skyslope.com/oauth2/authorize`), `token_url` (`https://accounts.skyslope.com/oauth2/token`), `api_base` (`https://forms.skyslope.com/partner/api`). Use existing secrets/config pattern (e.g. `Server/config/.env.example` updated with `SKYSLOPE_REDIRECT_URI` placeholder).

### 2.2 PKCE helpers

- [ ] Add a small server-side utility to generate PKCE: `code_verifier` (e.g. 43-byte random, base64url), `code_challenge` = base64url(sha256(verifier)). Use only for the Skyslope OAuth flow.

### 2.3 OAuth "start" route

- [ ] **Route:** `GET /api/v1/skyslope/connect` (or under `/api/v1/admin/skyslope/connect` if all Skyslope dev flows are admin-only).
- [ ] **Auth:** Protect with admin guard so only admins can start the flow.
- [ ] **Behavior:** Generate state (random, store in signed cookie or server session) and PKCE (code_verifier, code_challenge). Store `code_verifier` and `state` server-side (session or signed cookie) for the callback. Redirect to SkySlope authorize URL with: `response_type=code`, `client_id`, `redirect_uri`, `scope=forms.files.read forms.templates.read offline_access`, `state`, `code_challenge`, `code_challenge_method=S256`.

### 2.4 OAuth callback route

- [ ] **Route:** `GET /api/v1/skyslope/callback?code=...&state=...`
- [ ] **Behavior:** Validate `state` against stored value; retrieve `code_verifier`; exchange `code` for token via POST to token_url with `grant_type=authorization_code`, `client_id`, `client_secret`, `code`, `redirect_uri`, `code_verifier`. Parse response for `access_token` (and optionally `refresh_token`). On error, return a simple error page or JSON with message.
- [ ] **Prove-it read:** With `access_token`, call `GET {api_base}/users/profile` with `Authorization: Bearer <access_token>`. (Alternative: call `GET /templates` or `GET /forms` and use count or first item as proof.)
- [ ] **Response:** For "prove it works," return a simple HTML page or JSON that shows success and proof, e.g. "SkySlope connected. Profile: &lt;firstName&gt; &lt;lastName&gt;" or "Templates count: N." No token persistence required in this phase.

### 2.5 Error handling and logging

- [ ] Use project logger (no `print`); log OAuth errors and API errors without logging tokens or full response bodies. Return generic error messages to the client; avoid leaking internals.

---

## 3. Frontend – Minimal entry point

- [ ] **Location:** Admin-only. Add a "Connect SkySlope" link or button on the existing Admin page (e.g. `AdminPage.tsx` or the admin layout used for that page).
- [ ] **Action:** Link/button navigates to the backend OAuth start URL (e.g. `GET /api/v1/skyslope/connect` or `/api/v1/admin/skyslope/connect`). Full-page redirect is acceptable (no SPA redirect needed for this proof).
- [ ] **After callback:** User lands on the callback response page (server-rendered success/error). No separate client-side "success page" required for this slice; optional later: redirect from callback to an Admin "Skyslope" section with a success message.

---

## 4. Security and compliance

- [ ] **Admin-only:** Only users passing the existing admin guard can hit the OAuth start (and optionally restrict callback to same session/origin).
- [ ] **State:** Always validate `state` on callback to prevent CSRF.
- [ ] **Secrets:** Client_id and client_secret only on server; never in frontend or logs.
- [ ] **Redirect URI:** Exact match with SkySlope partner config; no open redirects.

---

## 5. Verification (definition of done)

- [ ] Admin can click "Connect SkySlope" and complete the SkySlope login/consent.
- [ ] Callback runs without error and shows proof (profile name or template/form count).
- [ ] Failed auth or API errors show a clear error message and do not leak secrets.
- [ ] Linters and existing CI (e.g. lint, typecheck) pass.

---

## 6. Optional follow-ups (not in this plan)

- Persist refresh_token per user and add refresh logic.
- "Test connection" action that uses stored token and calls User Profile or Get Templates.
- "Add from SkySlope" UI and Get Templates/Get Forms integration.
- SignatureProvider implementation and agreement/signing flows.
