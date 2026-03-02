# react-phone-number-input (Web → React Native)

## Web

- **Package:** `react-phone-number-input` (in `Client/apps/web/package.json`).
- **Role:** Phone number input with country selector and formatting; typically wraps an HTML `<input>` or input component.
- **Where used:** Any form in `apps/web/` or `packages/` that collects phone numbers (e.g. profile, auth, or contact forms).

## React Native

- **Replacement options:**
  1. **react-native-phone-number-input** — RN-specific phone input with country picker; similar UX to web.
  2. **Custom:** `TextInput` + a country picker (e.g. modal or dropdown) + formatting (e.g. `libphonenumber-js` or same parsing lib as web if it’s framework-agnostic). Use the same validation/parsing logic in `packages/utils` if possible.
- **Implementation:**
  - **Where:** Any shared form component that uses `react-phone-number-input` on web should have a **`.native.tsx`** that uses the chosen RN package or custom `TextInput` + picker. Keep validation/parsing in shared `packages/utils` so both platforms use the same rules. Web implementation stays in `.web.tsx`.
  - **API:** Match semantics (value, onChange, country, placeholder, disabled) so the parent form doesn’t need to know the platform.
- **Package:** Add `react-native-phone-number-input` (or equivalent) to `Client/apps/mobile/package.json` when implementing. Do not add `react-phone-number-input` to mobile — it is DOM/input-based.

## Package (RN)

- **Add to `apps/mobile/package.json`:** e.g. `react-native-phone-number-input`. Not `react-phone-number-input`.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | react-phone-number-input | react-native-phone-number-input or custom TextInput + picker |
| Where | .web.tsx forms | .native.tsx forms |
| Validation/parsing | Prefer shared in packages/utils | Same |
