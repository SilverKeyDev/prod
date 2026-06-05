# Messaging persona variations

Two messaging stacks serve different personas. Do not fork UI per workspace.

## Stack decision tree

| Persona | Stack | Mechanism |
| ------- | ----- | --------- |
| Buyer | Agent–client | `ClientMessaging` + `useMessaging({ mode: "client" })` |
| Seller | Agent–client | Same hook; copy overlay via `getMessagingConfig("client", { clientPersona: "seller" })` |
| Agent | Agent–client | `AgentMessaging` / agent dashboard |
| Brokerage | Workspace | `WorkspaceMessagingShell` + `brokerageMessagingPersona` |
| Integrator | Workspace | `WorkspaceMessagingShell` + `integratorMessagingPersona` |
| Admin (super_admin) | Workspace | `WorkspaceMessagingShell` + `adminSupportMessagingPersona` at `/admin/support-messaging` |

Routing: `getMessagingSurfaceForWorkspace(activeWorkspace)` in `AgentFeature`.

## Adding a new persona

1. Server: add kind policy under `Server/app/services/messaging/workspace/kinds/`
2. OpenAPI: extend `WorkspaceConversationKind` if needed
3. Client: add thin persona config `.ts` in the feature package
4. Register in `packages/features/messaging/workspace/personas/index.ts`
5. Add tests in `personas/index.test.ts` and server policy matrix tests

## Anti-patterns

- Do not add `*Messaging.tsx` components in feature packages (persona `.ts` configs only)
- Do not duplicate agent chat hooks for operator threads
- Do not steer buyers via integrator messaging (operator-to-operator only)

See also: [messaging.md](../features/messaging.md), [messaging-workspace-conversations.md](../../server/messaging-workspace-conversations.md).
