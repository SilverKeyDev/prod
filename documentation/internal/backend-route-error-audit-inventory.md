# Backend route error audit — inventory (generated)

Baseline for the HTTP error-code audit. Regenerate with:

```bash
rg 'return jsonify.*\),\s*(401|403|404|409|422|429|500|502|503)' Server/app/routes -n
rg '"error":\s*str\(' Server/app/routes -n
```

## Summary

| Metric | Count |
| ------ | ----- |
| Manual `jsonify` + error status | ~165 |
| Files with `str(e)` in route responses (or client JSON) | 26 |

## Client response leaks (`"error": str(...)`)

- `agent/handlers/chats.py` (7)
- `feed.py` (5)
- `calendar/handlers/events.py` (4)
- `agent/handlers/todos.py` (3)
- `transactions/checklist_forms.py` (2 client + partial_errors)
- `agent/handlers/connection_requests.py` (2)
- `auth/handlers/user_checklists.py` (2)
- `auth/handlers/client_settings.py` (`str(ve)`)
- `tasks.py`, `transactions/__init__.py`
- `admin/handlers/logger_config.py` (response body)
- Others: logging-only `str(e)` in log context (OK) — see grep for line-level detail

## Raw `jsonify` 500 hotspots

- `documents/report.py` (12)
- `feed.py` (5)
- `auth/handlers/preferences/preferences_agents.py` (4)
- `maps.py` (1 — config → 503)

## Shard ownership

See plan: 10 domains (auth, agent, search, calendar, documents, transactions, feed/viewings/maps/chat, admin, rev_share/public).
