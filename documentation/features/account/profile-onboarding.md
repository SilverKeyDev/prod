# Profile onboarding flow registry

Onboarding and personalization **step order** is defined declaratively under:

`Client/packages/features/profile/utils/onboarding/registry/`

## Adding or changing steps

1. Add the step id to [`profileStepIds.ts`](../../../Client/packages/features/profile/types/onboarding/profileStepIds.ts) if new.
2. Add title in [`registry/stepMeta.ts`](../../../Client/packages/features/profile/utils/onboarding/registry/stepMeta.ts).
3. Include the step in the right template in [`registry/flowTemplates.ts`](../../../Client/packages/features/profile/utils/onboarding/registry/flowTemplates.ts).
4. Add completion rules in [`registry/stepCompletion.ts`](../../../Client/packages/features/profile/utils/onboarding/registry/stepCompletion.ts) when skip/next behavior depends on fields.
5. Render UI in [`renderOnboardingStep.web.tsx`](../../../Client/packages/features/profile/components/onboarding/renderOnboardingStep.web.tsx) and [`.native.tsx`](../../../Client/packages/features/profile/components/onboarding/renderOnboardingStep.native.tsx).

Do **not** add a fourth `switch (step.id)` in feature shells — wire through `renderOnboardingStep`.

## Flow templates

| Template | Use |
| -------- | --- |
| `buyer_onboarding` | Default buyer signup |
| `agent_onboarding` | Agent signup |
| `seller_onboarding` | Seller signup: role + `seller_property`, `seller_address`, `seller_timeline`, `seller_motivation`, `seller_pricing`, `seller_demographics` |
| `brokerage_onboarding` | Brokerage shell: role + `brokerage_shell_setup` (one test input) |
| `integration_partner_onboarding` | Integration partner shell: role + `integration_partner_shell_setup` (one test input) |
| `buyer_personalization` | Settings / profile preferences (buyer) |
| `agent_personalization` | Settings / profile preferences (agent) |

Shell setup steps bind `workspace_shell_test_input` on the client draft only; it is **stripped** from the preferences API payload until real product fields ship.

Post-onboarding navigation lands on `/dashboard` for all roles. Workspace selection after onboarding is centralized in [`onboardingToWorkspace.ts`](../../../Client/packages/features/profile/utils/onboarding/role/onboardingToWorkspace.ts) (`postOnboardingWorkspaceForPrimaryRole`).

Public APIs [`getOnboardingSteps`](../../../Client/packages/features/profile/utils/onboarding/steps/steps.ts) and [`getPersonalizationSteps`](../../../Client/packages/features/profile/utils/onboarding/steps/steps.ts) delegate to `buildProfileFlow`.

## Brokerage / seller workspace shells

Onboarding registry work does not decide dashboard UX. Brokerage dashboard analytics and seller/brokerage messaging are documented under [workspaces-placeholder-shells.md](../../architecture/workspaces-placeholder-shells.md) and [brokerage-analytics.md](../brokerage/brokerage-analytics.md).

## Tests

- [`registry/onboardingFlowSnapshots.test.ts`](../../../Client/packages/features/profile/utils/onboarding/registry/onboardingFlowSnapshots.test.ts) — buyer/agent step order parity
- [`registry/buildProfileFlow.test.ts`](../../../Client/packages/features/profile/utils/onboarding/registry/buildProfileFlow.test.ts) — template resolution
