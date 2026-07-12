# Messaging persona variations

Two messaging **data** stacks serve different personas. UI chrome is shared via `UnifiedMessagingShell` — do not fork look-and-feel per workspace.

## Stack decision tree

| Persona | Data stack | UI |
| ------- | ---------- | --- |
| Buyer | Agent–client | `ClientMessaging` → `UnifiedMessagingShell` + `useMessaging({ mode: "client" })` |
| Seller | Agent–client | Same hook; copy overlay via `getMessagingConfig("client", { clientPersona: "seller" })` |
| Agent | Agent–client | `AgentMessaging` → `UnifiedMessagingShell` + `useMessaging({ mode: "agent" })` |
| Brokerage | Workspace | `BrokerageMessaging` → `UnifiedMessagingShell` + `useWorkspaceUnifiedMessaging` (`platform_support` auto-ensured + pinned) |
| Integrator | Workspace | `WorkspaceMessagingShell` + `integratorMessagingPersona` (`sidebarLayout: "sectioned"`) |
| Admin (super_admin) | Workspace | `WorkspaceMessagingShell` + `adminSupportMessagingPersona` at `/admin/support-messaging` |

Routing: `getMessagingSurfaceForWorkspace(activeWorkspace)` in `AgentFeature`. Brokerage mounts `BrokerageMessaging`; other workspace personas still use `WorkspaceMessagingShell`.

### Brokerage pinned platform support

Brokerage messaging reuses buyer/agent Unified* chrome. The sidebar is a flat inbox with a **pinned SilverKey support** row at the top. On open, a `platform_support` thread is **auto-created** if missing (server-deduped; same threads answered at `/admin/support-messaging`). Agent DMs list below; eligible agents appear under “Message an agent.” There is no find-agent search or connection-request inbox.

## Adding a new persona

1. Server: add kind policy under `Server/app/services/messaging/workspace/kinds/`
2. OpenAPI: extend `WorkspaceConversationKind` if needed
3. Client: add thin persona config `.ts` in the feature package
4. Register in `packages/utils/comms/messaging/personas/personasRegistry.ts`
5. Prefer `UnifiedMessagingShell` + a workspace adapter over a new parallel shell
6. Add tests in persona registry tests and server policy matrix tests

## Anti-patterns

- Do not add `*Messaging.tsx` components in feature packages outside messaging (persona `.ts` configs only for copy/kinds)
- Do not duplicate agent chat hooks for operator threads
- Do not steer buyers via integrator messaging (operator-to-operator only)
- Do not map brokerage onto `/api/v1/agent/chats` — wrong domain model

See also: [messaging.md](../features/messaging.md), [messaging-workspace-conversations.md](../../server/messaging-workspace-conversations.md).
