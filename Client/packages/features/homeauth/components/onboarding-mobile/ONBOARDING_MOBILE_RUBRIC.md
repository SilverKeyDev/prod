# Mobile Onboarding: Beauty & Efficiency Rubric

This rubric defines what “most beautiful and optimized for user experience and efficiency” means for SilverKey’s mobile onboarding. Use it to design, review, and iterate.

---

## 1. Structure & Flow

### 1.1 One focus per screen

| Criterion                                                       | Required    | Evidence / How to check                                                                                  |
| --------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| Each screen has a single primary question or decision           | Yes         | One main headline + one primary input or choice set per screen. No screen shows 2+ unrelated questions.  |
| Related fields are grouped into one logical “question”          | Yes         | e.g. “Where do you want to live?” = one screen (search + list), not separate “City” and “State” screens. |
| Optional or secondary inputs are clearly secondary or collapsed | Recommended | Secondary fields are below the fold, in an “Add more” section, or on a follow-up screen.                 |

**Score (1–5):** 1 = multiple unrelated questions per screen; 5 = strictly one question/focus per screen, no clutter.

---

### 1.2 Step count and length

| Criterion                                                                 | Required    | Evidence / How to check                                                                          |
| ------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| Total onboarding steps are 4–6 (themed steps)                             | Yes         | Count “steps” as distinct screens or step headers (e.g. About you, Housing, Location, Finances). |
| User can reach first value (e.g. affordability or matches) in < 3 minutes | Yes         | Time from “Start” to first payoff screen; measure with real or representative data.              |
| Non-essential steps are skippable with “Skip” or “I’ll do this later”     | Yes         | Every step that is not required for first value has a visible skip path.                         |
| No single step has more than ~3–4 distinct choices or inputs              | Recommended | Use chips, bands, or defaults to keep decision load low per screen.                              |

**Score (1–5):** 1 = 8+ steps or no skip; 5 = 4–6 steps, skip where appropriate, first value in < 3 min.

---

### 1.3 Progress and orientation

| Criterion                                                            | Required | Evidence / How to check                                              |
| -------------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| User always sees progress (e.g. “Step 2 of 4” or progress bar)       | Yes      | Progress indicator visible in header or above content on every step. |
| Progress indicator updates when moving to next step (no stale state) | Yes      | After tapping Continue, progress reflects new step immediately.      |
| Back / previous is available and predictable                         | Yes      | Back button or gesture returns to previous step without losing data. |

**Score (1–5):** 1 = no progress or broken back; 5 = clear progress + reliable back.

---

## 2. Visual Design (Beauty)

### 2.1 Hierarchy and clarity

| Criterion                                                  | Required | Evidence / How to check                                                 |
| ---------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| One clear headline per screen (e.g. “What’s your budget?”) | Yes      | Single H1 or equivalent; no competing headlines.                        |
| Short, human subcopy where needed (one line preferred)     | Yes      | Subline explains or reassures; no long paragraphs.                      |
| Generous whitespace; content not cramped                   | Yes      | Padding and spacing follow a consistent scale (e.g. 8px grid).          |
| Single primary CTA per screen (e.g. “Continue”)            | Yes      | One dominant button; secondary actions (Skip, Back) visually secondary. |

**Score (1–5):** 1 = dense, multiple CTAs, no clear headline; 5 = one headline, one subline, one primary CTA, ample space.

---

### 2.2 Consistency and brand

| Criterion                                                 | Required    | Evidence / How to check                                             |
| --------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| Same spacing scale across all onboarding screens          | Yes         | Use design tokens or a shared spacing scale (e.g. 8/16/24/32).      |
| One accent color for primary actions (e.g. brand olive)   | Yes         | Primary CTA and key interactive elements use the same accent.       |
| Consistent typography (one heading style, one body style) | Yes         | No ad-hoc font sizes or weights; use shared text components.        |
| Optional: small illustration or icon set per step         | Recommended | Same style for “About you”, “Budget”, “Location” etc. for cohesion. |

**Score (1–5):** 1 = inconsistent spacing/color/type; 5 = full token/component consistency, optional illustration set.

---

### 2.3 Delight and tone

| Criterion                                                                | Required    | Evidence / How to check                                                            |
| ------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| Copy is warm and human, not bureaucratic                                 | Yes         | No “Please enter your preferred budgetary range”; use “What’s your budget?” style. |
| Optional: one moment of delight (e.g. short confirmation or payoff copy) | Recommended | e.g. “We’ll use this to show you homes you can afford” after finances.             |
| No decorative animation that slows or distracts from the task            | Yes         | Motion supports clarity or feedback; no gratuitous effects.                        |

**Score (1–5):** 1 = cold or confusing copy, distracting motion; 5 = warm copy, optional delight, purposeful motion only.

---

## 3. Motion & Feedback

### 3.1 Step transitions

| Criterion                                                                       | Required    | Evidence / How to check                                           |
| ------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| Transition between steps is animated (e.g. slide or fade)                       | Yes         | No instant cut; user sees flow from step N to N+1.                |
| Transition direction is consistent (e.g. next = slide left, back = slide right) | Recommended | Matches platform or app convention; back feels like “going back”. |
| Duration is short (e.g. 200–350 ms) so it doesn’t feel slow                     | Yes         | No multi-second transitions between form steps.                   |

**Score (1–5):** 1 = no transition or very slow; 5 = smooth, consistent, quick transition.

---

### 3.2 Microfeedback

| Criterion                                                                       | Required    | Evidence / How to check                                          |
| ------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| Tapping primary CTA gives immediate feedback (e.g. loading state or transition) | Yes         | Button or screen responds within ~100 ms (no frozen tap).        |
| Selecting an option (chip, card, choice) has visible state change               | Yes         | Selected state is clearly different from unselected.             |
| Haptic feedback on key actions (e.g. continue, selection) where supported       | Recommended | Light haptic on primary tap and/or selection on capable devices. |

**Score (1–5):** 1 = no feedback or laggy; 5 = instant visual + optional haptic.

---

### 3.3 Progress animation

| Criterion                                                 | Required    | Evidence / How to check                                        |
| --------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| Progress bar or step indicator animates when step changes | Recommended | Progress doesn’t jump; short fill or step-highlight animation. |
| Animation is subtle and does not steal focus from content | Yes         | Progress motion is secondary to headline and CTA.              |

**Score (1–5):** 1 = no progress animation or distracting; 5 = subtle, smooth progress update.

---

## 4. Efficiency

### 4.1 Smart defaults and prefill

| Criterion                                                                       | Required | Evidence / How to check                                                      |
| ------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| Signup data (e.g. name, email) is prefilled where used in onboarding            | Yes      | No re-typing email/name on onboarding screens if already collected.          |
| Sensible defaults for optional or “don’t know” answers (e.g. credit “Not sure”) | Yes      | User can tap Continue without answering every field where a default is safe. |
| Defaults are only used when change is obvious and low-effort                    | Yes      | No prechecked consent or hidden assumptions; user can override easily.       |

**Score (1–5):** 1 = no prefill, no defaults; 5 = prefill + safe defaults, clear overrides.

---

### 4.2 Choice design and taps

| Criterion                                                   | Required    | Evidence / How to check                                                       |
| ----------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| At most 3–4 visible options per question where possible     | Recommended | Use chips or cards (e.g. budget bands) instead of open-ended when sufficient. |
| Primary action is one tap (e.g. “Continue”) after answering | Yes         | No “Submit” then “Confirm” for the same step unless truly required.           |
| Autocomplete or typeahead for location/search fields        | Yes         | User can search/select instead of typing full strings where applicable.       |

**Score (1–5):** 1 = many options, multiple confirm taps; 5 = few choices, one tap to continue, autocomplete where relevant.

---

### 4.3 Perceived speed and loading

| Criterion                                                            | Required | Evidence / How to check                                                    |
| -------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| Tapping “Continue” advances to next step immediately (optimistic UI) | Yes      | Next screen or transition starts right away; save in background if needed. |
| No full-screen spinner for step-to-step save when possible           | Yes      | Use inline or minimal loader, or no loader if save is fast.                |
| Keyboard and focus don’t block the primary CTA (keyboard avoiding)   | Yes      | On focusable screens, CTA remains visible or reachable with keyboard open. |

**Score (1–5):** 1 = blocking spinners, CTA hidden by keyboard; 5 = instant step change, minimal loading, CTA always usable.

---

### 4.4 Skip and “finish later”

| Criterion                                                            | Required    | Evidence / How to check                                             |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| “Skip” or “I’ll do this later” is visible on non-essential steps     | Yes         | Wording is clear; user can enter app without completing every step. |
| Skipped steps can be completed later (e.g. Settings or Profile)      | Yes         | Same or equivalent fields available in-app after onboarding.        |
| User is not shamed or blocked for skipping (e.g. no “Are you sure?”) | Recommended | Skip is one tap; optional reminder later is fine.                   |

**Score (1–5):** 1 = no skip or guilt; 5 = clear skip, finish later in app, no friction.

---

## 5. Mobile-Specific

### 5.1 Touch and layout

| Criterion                                                               | Required    | Evidence / How to check                                     |
| ----------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| Primary CTA and key choices have minimum 44pt touch target              | Yes         | Buttons and tappable options are large enough for thumb.    |
| Primary CTA is reachable without stretching (e.g. bottom or thumb zone) | Recommended | Consider fixed bottom CTA or scroll that keeps CTA in view. |
| No hover-only interactions; all actions work with tap                   | Yes         | No “hover to see more” or hover-only tooltips.              |

**Score (1–5):** 1 = small targets, CTA out of reach; 5 = 44pt+ targets, CTA in thumb zone.

---

### 5.2 Keyboard and input

| Criterion                                                                | Required    | Evidence / How to check                                                |
| ------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| Correct input type (e.g. numeric for budget, email for email)            | Yes         | Keyboard matches field type to reduce errors and taps.                 |
| “Next” or “Done” on keyboard advances or dismisses appropriately         | Recommended | Keyboard actions support flow (e.g. Next → next field or next step).   |
| Keyboard does not cover primary CTA (KeyboardAvoidingView or equivalent) | Yes         | User can submit or continue without closing keyboard first if desired. |

**Score (1–5):** 1 = wrong keyboard, CTA covered; 5 = correct type, sensible keyboard actions, CTA visible.

---

### 5.3 Platform and accessibility

| Criterion                                                       | Required    | Evidence / How to check                                            |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| Labels and CTAs have accessible names for screen readers        | Yes         | All interactive elements are announced correctly.                  |
| Progress and step state are communicated to assistive tech      | Recommended | Progress indicator and current step are readable by screen reader. |
| Supports dynamic type / font scaling where platform supports it | Recommended | Layout doesn’t break at larger text sizes.                         |

**Score (1–5):** 1 = missing labels or broken with screen reader; 5 = full labels, progress announced, respects system font size.

---

## 6. Overall Scoring and Use

- **Per section:** Average the scores in that section (e.g. 1.1, 1.2, 1.3 for “Structure & Flow”) or use the lowest item as the section score, depending on whether you want to reward consistency or penalize weak spots.
- **Overall:** Average the six section scores, or weight “Efficiency” and “Structure & Flow” slightly higher if you prioritize completion and time-to-value.
- **Target:** Aim for **4+ on every section** for “most beautiful and optimized”; **3+** is acceptable for first release with a plan to improve.
- **Review:** Run the rubric on each new design or build (e.g. Figma or dev build) and fix any criterion that scores below 3 before ship.

---

## References

- Internal: `packages/features/profile/utils/steps.ts` (getOnboardingSteps), `homeauth/components/pages/OnboardingPage.tsx` (web flow).
- Mobile: `apps/mobile/app/navigation/AuthStack.native.tsx` (Onboarding screen); implement in `homeauth/components/onboarding-mobile/` or `apps/mobile/app/screens/`.

```

```
