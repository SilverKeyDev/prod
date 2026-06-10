# Features & integrations

Product-specific client documentation. Package code: `Client/packages/features/`.

## Tier A — pilot-critical

| Package | Status | Doc |
|---------|--------|-----|
| checklists | Shipped | [checklists.md](./checklists.md), [checklists-integrations.md](./checklists-integrations.md) |
| messaging | Partial | [messaging.md](./messaging.md) |
| homeauth | Shipped | [homeauth.md](./homeauth.md) |
| profile | Shipped | [profile-feature.md](./profile-feature.md), [profile-onboarding-flow.md](./profile-onboarding-flow.md) |
| workspace | Partial | [workspace.md](./workspace.md) |
| admin | Partial | [admin.md](./admin.md) |
| partners | Shipped | [partners.md](./partners.md), [rev-share-partners.md](./rev-share-partners.md) |
| search | Shipped | [search.md](./search.md) |

## Tier B — secondary

| Package | Status | Doc |
|---------|--------|-----|
| calendar | Partial | See [transactions/integrations/06-calendar-and-document-linking.md](../../transactions/integrations/06-calendar-and-document-linking.md) |
| documents | Shipped | [docusign-integration.md](./docusign-integration.md) |
| feed | Partial | [reels/](../../reels/) (product vision) |
| agent | Partial | `Client/packages/features/agent/` + transactions collaboration docs |
| dashboard | Partial | Package README via [packages/features/README.md](../../../Client/packages/features/README.md) |
| propertyDetails | Shipped | Package code; map/search integration |
| saved | Shipped | Package code |
| negotiate | Partial | Package code |
| compare | Partial | Package code |

## Tier C — early / shell

| Package | Status | Pointer |
|---------|--------|---------|
| brokerage | Partial | Placeholder shell in `workspace/` — [workspaces-placeholder-shells.md](../architecture/workspaces-placeholder-shells.md) |
| seller | Partial | Placeholder shell in `workspace/` — same doc |
| integration_partner (workspace role) | Partial | No dedicated package; `integration_partner` workspace via `workspace/` placeholder |

## Cross-cutting

| Doc | Description |
|-----|-------------|
| [docusign-integration.md](./docusign-integration.md) | DocuSign client integration |
| [google-maps-web-setup.md](./google-maps-web-setup.md) | Maps setup |
| [rev-share-partners.md](./rev-share-partners.md) | Partner placement (RESPA) |
| [profile-onboarding-flow.md](./profile-onboarding-flow.md) | Onboarding registry |
