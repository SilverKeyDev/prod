# Group chat messaging (infrastructure scaffold)

**Status:** Planned — infrastructure scaffolded; product routes and UI are not shipped.

## Overview

Group conversations reuse the operator messaging stack (`WorkspaceConversation`, `WorkspaceConversationParticipant`, `ChatHistory.workspace_conversation_id`). Dyadic workspace kinds ship in this pass; `kind=group` is reserved.

## Schema

- `WorkspaceConversation`: `title`, `created_by_user_id`, `participant_count`, `is_archived`
- `WorkspaceConversationParticipant`: `joined_at`, `left_at`, `added_by_user_id`, roles `owner` | `member` | `brokerage_admin`

## Access rules (pure helpers — tested, no routes)

| Action | Rule |
| ------ | ---- |
| Read/send | Active participant (`left_at IS NULL`) |
| Add member | `owner` or org `brokerage_admin` when scoped |
| Remove member | Self-leave always; remove others requires `owner` |
| Create group | Authenticated; creator becomes `owner`; min 2 participants |
| Max size | `MAX_GROUP_PARTICIPANTS = 50` in `Server/app/services/messaging/constants.py` |

## System messages

Stored as normal `ChatHistory` rows with `role: system` and message prefix `__GROUP_EVENT__`.

## Future HTTP surface (not registered)

```
POST   /api/v1/conversations/groups
PATCH  /api/v1/conversations/groups/{id}
POST   /api/v1/conversations/groups/{id}/participants
DELETE /api/v1/conversations/groups/{id}/participants/{userId}
```

OpenAPI stub schemas live under `openapi/components/schemas/messaging/group/`.

## Service stubs

- `Server/app/services/messaging/group/membership.py` — lifecycle methods raise `NotImplementedError`
- `Server/app/services/messaging/group/protocol.py` — typed protocol for future implementation

`POST /api/v1/conversations` rejects `kind=group` with HTTP 501 until group chat ships.
