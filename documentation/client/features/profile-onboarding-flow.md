# Profile onboarding flow registry

Onboarding and personalization **step order** is defined declaratively under:

`Client/packages/features/profile/utils/onboarding/registry/`

## Adding or changing steps

1. Add the step id to [`profileStepIds.ts`](../../Client/packages/features/profile/types/onboarding/profileStepIds.ts) if new.
2. Add title in [`registry/stepMeta.ts`](../../Client/packages/features/profile/utils/onboarding/registry/stepMeta.ts).
3. Include the step in the right template in [`registry/flowTemplates.ts`](../../Client/packages/features/profile/utils/onboarding/registry/flowTemplates.ts).
4. Add completion rules in [`registry/stepCompletion.ts`](../../Client/packages/features/profile/utils/onboarding/registry/stepCompletion.ts) when skip/next behavior depends on fields.
5. Render UI in [`renderOnboardingStep.web.tsx`](../../Client/packages/features/profile/components/onboarding/renderOnboardingStep.web.tsx) and [`.native.tsx`](../../Client/packages/features/profile/components/onboarding/renderOnboardingStep.native.tsx).

Do **not** add a fourth `switch (step.id)` in feature shells — wire through `renderOnboardingStep`.

## Flow templates

| Template | Use |
| -------- | --- |
| `buyer_onboarding` | Default buyer signup |
| `agent_onboarding` | Agent signup |
| `minimal_onboarding` | Seller / integration partner (role screen only) |
| `brokerage_onboarding` | Future brokerage signup (same as minimal today) |
| `buyer_personalization` | Settings / profile preferences (buyer) |
| `agent_personalization` | Settings / profile preferences (agent) |

Public APIs [`getOnboardingSteps`](../../Client/packages/features/profile/utils/onboarding/steps/steps.ts) and [`getPersonalizationSteps`](../../Client/packages/features/profile/utils/onboarding/steps/steps.ts) delegate to `buildProfileFlow`.

## Brokerage workspace shell

The **brokerage workspace placeholder** (dashboard + messaging only) is separate from this registry. See [workspaces-placeholder-shells.md](../architecture/workspaces-placeholder-shells.md). Onboarding registry work does not change placeholder routing.

## Tests

- [`registry/onboardingFlowSnapshots.test.ts`](../../Client/packages/features/profile/utils/onboarding/registry/onboardingFlowSnapshots.test.ts) — buyer/agent step order parity
- [`registry/buildProfileFlow.test.ts`](../../Client/packages/features/profile/utils/onboarding/registry/buildProfileFlow.test.ts) — template resolution
