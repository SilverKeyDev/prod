# React hooks patterns (loop prevention)

Examples and diagrams for hook loop prevention. **Enforced constraints:** [`.cursor/rules/frontend/react-hooks.mdc`](../../../.cursor/rules/frontend/react-hooks.mdc) — read the rule first; this doc adds narrative examples only.

## The six loop patterns (summary)

| # | Anti-pattern | Fix |
|---|--------------|-----|
| 1 | `useEffect` + `setState` with no deps | Add deps or derive with `useMemo` |
| 2 | Unstable object/array in deps | Memoize or hoist outside component |
| 3 | Effect sets state that retriggers effect | Narrow deps; split effects |
| 4 | Context value recreated each render | Memoize provider value |
| 5 | Callback in deps without `useCallback` | Stabilize callback or ref |
| 6 | Sync external store in effect without guard | Compare before setState |
| 7 | Inline callback in hook config (`onLogout`, `onSuccess`) | `useCallback` or hook reads callback via ref |

## Example: useSessionTimeout / config callbacks

`useSessionTimeout` memoizes timeout **primitives** only; `onLogout` is read from a ref. Call sites must still pass a stable callback — inline arrows recreate the config identity and can loop in similar hooks.

```typescript
// ❌ App.tsx — caused "Maximum update depth exceeded"
useSessionTimeout({ onLogout: () => void authLogout() });

// ✅
const onSessionLogout = useCallback(() => void authLogout(), [authLogout]);
useSessionTimeout({ onLogout: onSessionLogout });
```

## Example: unstable dependency

```typescript
// ❌ new object every render
useEffect(() => { fetchData(filters); }, [filters]);

// ✅ stable primitive deps or memoized filters
const filterKey = useMemo(() => JSON.stringify(filters), [filters.city, filters.priceMax]);
useEffect(() => { fetchData(filters); }, [filterKey]);
```

## Example: derive instead of sync effect

```typescript
// ❌
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// ✅
const fullName = `${first} ${last}`;
```

## Further reading

- [react-hooks.mdc](../../../.cursor/rules/frontend/react-hooks.mdc)
- [component audit rubric](./react-component-audit-rubric.md) — Axis 3 state/data flow
