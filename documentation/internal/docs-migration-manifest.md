# Docs migration manifest

Audit of every `documentation/**/*.md` file for the wiki renovation.

| Old path | Verdict | New path / notes |
|----------|---------|------------------|
| `how-we-document.md` | keep-rewrite | how-we-document.md |
| `README.md` | keep-rewrite | README.md |
| `client/README.md` | delete | replaced by top-level hubs |
| `client/architecture/README.md` | keep-rewrite | architecture/README.md |
| `client/architecture/apps-folder-contents.md` | keep-move | architecture/apps-folder-contents.md |
| `client/architecture/cross-feature-composition.md` | keep-move | architecture/cross-feature-composition.md |
| `client/architecture/document-schema-naming.md` | keep-move | architecture/document-schema-naming.md |
| `client/architecture/layered-architecture-imports.md` | keep-move | architecture/layered-architecture-imports.md |
| `client/architecture/messaging/persona-variations.md` | keep-rewrite | architecture/messaging/persona-variations.md |
| `client/architecture/shared-packages.md` | keep-move | architecture/shared-packages.md |
| `client/architecture/thin-app-architecture.md` | keep-move | architecture/thin-app-architecture.md |
| `client/architecture/typescript-files.md` | keep-move | architecture/typescript-files.md |
| `client/architecture/workspace-first-architecture.md` | keep-rewrite | architecture/workspace-first-architecture.md |
| `client/architecture/workspaces-placeholder-shells.md` | keep-rewrite | architecture/workspaces-placeholder-shells.md |
| `client/features/README.md` | keep-rewrite | features/README.md |
| `client/` | keep-rewrite |  |
| `client/` | keep-rewrite |  |
| `client/` | keep-move |  |
| `client/` | keep-move |  |
| `client/features/google-maps-web-setup.md` | keep-move | guides/google-maps-web-setup.md |
| `client/` | keep-move |  |
| `client/` | keep-move |  |
| `client/` | keep-move |  |
| `client/` | keep-move |  |
| `client/` | keep-move |  |
| `client/` | keep-move |  |
| `client/` | keep-move |  |
| `client/features/search-filter-score-audit-sil-269.md` | delete | roadmap/historical/legacy |
| `client/` | keep-rewrite |  |
| `client/` | keep-rewrite |  |
| `client/patterns/README.md` | keep-rewrite | architecture/patterns/README.md |
| `client/patterns/react-component-audit-rubric.md` | keep-move | architecture/patterns/react-component-audit-rubric.md |
| `client/patterns/react-hooks-patterns.md` | keep-move | architecture/patterns/react-hooks-patterns.md |
| `client/platform/README.md` | keep-rewrite | architecture/platform/README.md |
| `client/platform/mobile-app-structure.md` | keep-move | architecture/platform/mobile-app-structure.md |
| `client/platform/platform-consolidation-results.md` | delete | roadmap/historical/legacy |
| `client/platform/platformVariants/README.md` | keep-rewrite | reference/platform-variants/README.md |
| `client/platform/platformVariants/embla-carousel-react.md` | keep-move | reference/platform-variants/embla-carousel-react.md |
| `client/platform/platformVariants/framer-motion.md` | keep-move | reference/platform-variants/framer-motion.md |
| `client/platform/platformVariants/headlessui.md` | keep-move | reference/platform-variants/headlessui.md |
| `client/platform/platformVariants/hls.md` | keep-move | reference/platform-variants/hls.md |
| `client/platform/platformVariants/keyboard-handling.md` | keep-move | reference/platform-variants/keyboard-handling.md |
| `client/platform/platformVariants/lucide-react.md` | keep-move | reference/platform-variants/lucide-react.md |
| `client/platform/platformVariants/react-dom.md` | keep-move | reference/platform-variants/react-dom.md |
| `client/platform/platformVariants/react-phone-number-input.md` | keep-move | reference/platform-variants/react-phone-number-input.md |
| `client/platform/platformVariants/react-responsive-carousel.md` | keep-move | reference/platform-variants/react-responsive-carousel.md |
| `client/platform/platformVariants/react-router-dom.md` | keep-move | reference/platform-variants/react-router-dom.md |
| `client/platform/platformVariants/react-virtuoso.md` | keep-move | reference/platform-variants/react-virtuoso.md |
| `client/platform/platformVariants/technology-swap-rationale.md` | keep-move | reference/platform-variants/technology-swap-rationale.md |
| `client/platform/react-vs-react-native.md` | keep-rewrite | architecture/platform/react-vs-react-native.md |
| `client/platform/shared-ui-package.md` | keep-move | architecture/platform/shared-ui-package.md |
| `client/platform/web-mobile-parity-gotchas.md` | keep-move | guides/web-mobile-parity.md |
| `client/qa/accessibility-checklist.md` | keep-move | runbooks/qa/accessibility-checklist.md |
| `client/qa/account-deletion.md` | keep-move | runbooks/qa/account-deletion.md |
| `client/qa/email-deliverability.md` | keep-move | runbooks/qa/email-deliverability.md |
| `client/qa/end-to-end-qa-runbook.md` | keep-move | runbooks/qa/end-to-end-qa-runbook.md |
| `client/qa/env-and-device-matrix.md` | keep-move | runbooks/qa/env-and-device-matrix.md |
| `client/qa/error-pages-404-500.md` | keep-move | runbooks/qa/error-pages-404-500.md |
| `client/qa/error-states.md` | keep-move | runbooks/qa/error-states.md |
| `client/qa/flow-payments.md` | keep-move | runbooks/qa/flow-payments.md |
| `client/qa/flow-signup-and-verification.md` | keep-move | runbooks/qa/flow-signup-and-verification.md |
| `client/qa/provision-test-accounts.md` | keep-move | runbooks/qa/provision-test-accounts.md |
| `client/qa/README.md` | keep-rewrite | runbooks/qa/README.md |
| `client/search-area-resolution.md` | keep-move |  |
| `reference/linting.md` | keep-move | reference/linting.md |
| `client/standards/README.md` | merge-into | reference/README.md — standards index folded into reference hub |
| `client/standards/accessibility-standards.md` | keep-move | guides/accessibility-standards.md |
| `client/standards/color-system.md` | keep-move | reference/color-system.md |
| `client/standards/responsive-ui-standards.md` | keep-move | guides/responsive-ui-standards.md |
| `client/tooling/README.md` | keep-rewrite | reference/README.md |
| `client/tooling/claude-code-configuration.md` | keep-move | guides/tooling/claude-code-configuration.md |
| `client/tooling/config-files.md` | keep-move | reference/config-files.md |
| `client/tooling/cursor-agent-memory.md` | keep-move | guides/tooling/cursor-agent-memory.md |
| `client/tooling/cursor-configuration-optimization.md` | keep-move | guides/tooling/cursor-configuration-optimization.md |
| `client/tooling/tailwind-config.md` | keep-move | reference/tailwind-config.md |
| `client/tooling/tsconfig.md` | keep-move | reference/tsconfig.md |
| `client/tooling/web-bundle-env-gates.md` | keep-move | reference/web-bundle-env-gates.md |
| `compliance/ccpa.md` | keep-move | policies/ccpa.md |
| `compliance/cookie-policy.md` | keep-move | policies/cookie-policy.md |
| `compliance/data-retention.md` | keep-move | policies/data-retention.md |
| `compliance/external-checklist.md` | keep-move | policies/external-checklist.md |
| `compliance/gdpr.md` | keep-move | policies/gdpr.md |
| `compliance/privacy-policy.md` | keep-move | policies/privacy-policy.md |
| `compliance/README.md` | keep-rewrite | policies/README.md |
| `dev/README.md` | delete | roadmap/historical/legacy |
| `dev/cursor-legacy/FORMS_LIBRARY_IMPLEMENTATION.md` | delete | roadmap/historical/legacy |
| `dev/cursor-legacy/FORMS_PHASE1_IMPLEMENTATION.md` | delete | roadmap/historical/legacy |
| `dev/cursor-legacy/GEORGIA_FORMS_SEEDED.md` | delete | roadmap/historical/legacy |
| `dev/cursor-legacy/README.md` | delete | roadmap/historical/legacy |
| `dev/cursor-legacy/openapi-adoption-checklist.md` | delete | roadmap/historical/legacy |
| `dev/cursor-legacy/openapi-full-adoption-summary.md` | delete | roadmap/historical/legacy |
| `internal/README.md` | keep-rewrite | internal/README.md |
| `internal/component-audit/README.md` | keep-rewrite | internal/component-audit/README.md |
| `internal/component-audit/feature-module-folder-and-layering-audit.md` | keep-move | internal/component-audit/feature-module-folder-and-layering-audit.md |
| `internal/component-audit/frontend-reorganization-audit.md` | keep-move | internal/component-audit/frontend-reorganization-audit.md |
| `internal/cursor-audit-latest.md` | keep-move | internal/cursor-audit-latest.md |
| `internal/messaging-sse-operations.md` | keep-move | runbooks/messaging-sse-operations.md |
| `internal/post-major-change-checklist.md` | keep-move | internal/post-major-change-checklist.md |
| `reels/01-final-goal-and-vision.md` | delete | roadmap/historical/legacy |
| `reels/02-tech-stack-and-rationale.md` | delete | roadmap/historical/legacy |
| `reels/03-architecture-and-data-flow.md` | delete | roadmap/historical/legacy |
| `reels/04-current-infrastructure.md` | delete | roadmap/historical/legacy |
| `reels/05-mvp1-wire-feed.md` | delete | roadmap/historical/legacy |
| `reels/06-mvp2-engagement-and-cache.md` | delete | roadmap/historical/legacy |
| `reels/07-mvp3-production.md` | delete | roadmap/historical/legacy |
| `reels/README.md` | delete | roadmap/historical/legacy |
| `security/README.md` | merge-into | policies/README.md — security index folded into policies hub |
| `security/SECURITY.md` | keep-move | policies/security.md |
| `server/README.md` | delete | replaced by top-level hubs |
| `server/api-conventions.md` | keep-move | reference/api-conventions.md |
| `server/aws-resources.md` | keep-move | reference/aws-resources.md |
| `server/celery-tasks.md` | keep-move | architecture/celery-tasks.md |
| `server/deployment.md` | keep-move | guides/deployment.md |
| `server/flask-architecture.md` | keep-move | architecture/flask-architecture.md |
| `server/infrastructure-reliability-gap-audit.md` | delete | roadmap/historical/legacy |
| `server/input-validation.md` | keep-move | guides/input-validation.md |
| `server/messaging-group-chat.md` | delete | roadmap/historical/legacy |
| `server/messaging-sse.md` | keep-rewrite | architecture/messaging/sse.md |
| `server/messaging-workspace-conversations.md` | keep-move | architecture/messaging/workspace-conversations.md |
| `server/openapi-validation-rollout.md` | delete | roadmap/historical/legacy |
| `server/openapi-workflow.md` | keep-rewrite | guides/openapi-workflow.md |
| `server/ops/monitoring-alerts.md` | keep-move | runbooks/monitoring-alerts.md |
| `server/ops/postgres.md` | keep-move | runbooks/postgres.md |
| `server/runbooks/posthog/api-error-semantics.md` | keep-move | runbooks/posthog/api-error-semantics.md |
| `server/runbooks/posthog/capacity-queries.md` | keep-move | runbooks/posthog/capacity-queries.md |
| `server/runbooks/posthog/dead-routes-table.md` | keep-move | runbooks/posthog/dead-routes-table.md |
| `server/ops/prod-web-rollback.md` | keep-move | runbooks/prod-web-rollback.md |
| `server/ops/redis-celery.md` | keep-move | runbooks/redis-celery.md |
| `server/ops/scaling-playbook.md` | keep-move | runbooks/scaling-playbook.md |
| `server/ops/scripts-guide.md` | keep-move | runbooks/scripts-guide.md |
| `server/ops/ses-cognito-onboarding.md` | keep-move | guides/ses-cognito-onboarding.md |
| `server/sqlalchemy-mapped-migration.md` | delete | roadmap/historical/legacy |
| `server/sqlalchemy-patterns.md` | keep-move | architecture/sqlalchemy-patterns.md |
| `server/standards/http-error-codes.md` | keep-move | reference/http-error-codes.md |
| `server/user-preferences.md` | keep-rewrite | reference/user-preferences.md |
| `transactions/10-implementation-order.md` | delete | roadmap/historical/legacy |
| `transactions/11-implementation-timeline.md` | delete | roadmap/historical/legacy |
| `transactions/README.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/01-participants-roles-and-permissions.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/02-task-and-checklist-collaboration.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/03-calendar-collaboration-and-sharing.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/04-document-and-agreement-collaboration.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/05-review-workflows-and-approvals.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/06-external-parties-and-invites.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/07-audit-trail-and-activity-feed.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/08-notification-preferences-and-routing.md` | delete | roadmap/historical/legacy |
| `transactions/collaboration/README.md` | delete | roadmap/historical/legacy |
| `transactions/integrations/06-calendar-and-document-linking.md` | delete | roadmap/historical/legacy |
| `transactions/integrations/07-signing-review-and-completion.md` | delete | roadmap/historical/legacy |
| `transactions/integrations/08-notifications.md` | delete | roadmap/historical/legacy |
| `transactions/integrations/09-documents-docusign-and-s3.md` | delete | roadmap/historical/legacy |
| `transactions/integrations/10-compliance-data-and-apis.md` | delete | roadmap/historical/legacy |
| `transactions/integrations/12-financial-and-service-integrations.md` | delete | roadmap/historical/legacy |
| `transactions/integrations/README.md` | delete | roadmap/historical/legacy |
| `transactions/mechanics/03-checklist-generation.md` | delete | roadmap/historical/legacy |
| `transactions/mechanics/04-location-enrichment.md` | delete | roadmap/historical/legacy |
| `transactions/mechanics/05-deadline-and-milestone-engine.md` | delete | roadmap/historical/legacy |
| `transactions/mechanics/README.md` | delete | roadmap/historical/legacy |
| `transactions/options/01-transaction-storage-and-selection.md` | delete | roadmap/historical/legacy |
| `transactions/options/02-address-canonicalization.md` | delete | roadmap/historical/legacy |
| `transactions/options/03-checklist-modeling.md` | delete | roadmap/historical/legacy |
| `transactions/options/04-calendar-sync-strategy.md` | delete | roadmap/historical/legacy |
| `transactions/options/06-notification-architecture.md` | delete | roadmap/historical/legacy |
| `transactions/options/07-collaboration-and-permissions.md` | delete | roadmap/historical/legacy |
| `transactions/options/08-financial-integrations.md` | delete | roadmap/historical/legacy |
| `transactions/options/README.md` | delete | roadmap/historical/legacy |
| `transactions/overview/00-scope-and-non-goals.md` | delete | roadmap/historical/legacy |
| `transactions/overview/01-domain-model.md` | delete | roadmap/historical/legacy |
| `transactions/overview/02-user-flows.md` | delete | roadmap/historical/legacy |
| `transactions/overview/README.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/01-overall-transaction-timeline.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/02-earnest-money-and-deposits.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/03-inspections-and-due-diligence.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/04-appraisal-and-valuation.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/05-financing-and-loan-approval.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/06-title-escrow-and_closing_prep.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/07-signing-closing-and-funding.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/08-move-in-and-post-closing-tasks.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/09-state-variation-model.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/10-compliance-data-and-apis.md` | delete | roadmap/historical/legacy |
| `transactions/timeline/README.md` | delete | roadmap/historical/legacy |

## New files to create

| Path | Notes |
|------|-------|
| `getting-started/README.md` | Onboarding hub |
| `guides/README.md` | How-to hub |
| `runbooks/README.md` | Ops + QA hub |
| `reference/vite-configuration.md` | Vite + wiki plugin |
| `` | Admin wiki as-built (or fold into admin.md) |

