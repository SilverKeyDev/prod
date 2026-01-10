# UI State Hooks

Pure UI state management hooks for local state, modals, toasts, and other UI concerns.

## Purpose

UI hooks provide reusable React logic for UI state management:
- LocalStorage integration
- Modal state management
- Toast notifications
- Mobile detection
- Session timeout
- Step-up authentication
- Health checks
- Message scrolling
- One-time effects

## Architecture Rules

### Allowed Imports
- ✅ `utils/*` - Utility functions
- ✅ `schemas/*` - Type definitions (if needed)

### Forbidden Imports
- ❌ `config/api/*` - UI hooks should not make API calls
- ❌ `services/*` - UI hooks should not use services
- ❌ `store/*` - UI hooks are for local state
- ❌ `apps/web/*` - Hooks should not import components

## Available Hooks

### Storage
- `useLocalStorage.ts` - LocalStorage integration with reactive updates

### Modals
- `useModal.ts` - Modal state management

### Toasts
- `useToast.ts` - Toast notification management

### Device Detection
- `useMobile.ts` - Mobile device detection

### Authentication
- `useStepUpAuth.ts` - Step-up authentication flow
- `useSessionTimeout.ts` - Session timeout handling

### Other
- `useHealthCheck.ts` - Health check monitoring
- `useMessageScroll.ts` - Message scrolling behavior
- `useOnceEffect.ts` - One-time effect execution
- `useWhy.ts` - Debug hook for understanding re-renders

## Usage Examples

### LocalStorage Hook

```typescript
import { useLocalStorage } from "../../../packages/hooks/ui/useLocalStorage";

function Component() {
  const { value, setValue, removeValue } = useLocalStorage("key", defaultValue);

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={removeValue}>Clear</button>
    </div>
  );
}
```

### Modal Hook

```typescript
import { useModal } from "../../../packages/hooks/ui/useModal";

function Component() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <button onClick={open}>Open Modal</button>
      {isOpen && (
        <Modal onClose={close}>
          <div>Modal Content</div>
        </Modal>
      )}
    </>
  );
}
```

### Toast Hook

```typescript
import { useToast } from "../../../packages/hooks/ui/useToast";

function Component() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({
      message: "Success!",
      type: "success",
    });
  };

  return <button onClick={handleSuccess}>Show Toast</button>;
}
```

### Mobile Detection

```typescript
import { useMobile } from "../../../packages/hooks/ui/useMobile";

function Component() {
  const isMobile = useMobile();

  return <div>{isMobile ? "Mobile View" : "Desktop View"}</div>;
}
```

## Best Practices

1. **Keep hooks pure** - UI hooks should not make API calls
2. **Use for local state** - Don't use for global state (use stores instead)
3. **Handle edge cases** - LocalStorage availability, SSR, etc.
4. **Provide cleanup** - Clean up event listeners and timers

## Further Reading

- [hooks/README.md](../README.md) - Hooks package overview
- [utils/storage.ts](../../utils/storage.ts) - Storage utilities (framework-agnostic)
