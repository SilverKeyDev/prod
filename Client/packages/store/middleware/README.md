# Store Middleware

Zustand middleware for devtools, persistence, and store management.

## Purpose

The `middleware/` directory contains middleware that enhances Zustand stores with:

- Redux DevTools integration
- Safe persistence to localStorage
- Store reset functionality

## Files

### `devtools.ts`

Redux DevTools integration for debugging Zustand stores in development.

### `persistSafe.ts`

Safe persistence middleware that saves store state to localStorage with error handling.

### `resettable.ts`

Middleware that adds reset functionality to stores, allowing them to be reset to initial state.

## Usage Examples

### Using DevTools Middleware

```typescript
import { create } from "zustand";
import { devtools } from "./middleware/devtools";

export const useMyStore = create<MyState>()(
  devtools(
    (set) => ({
      // ... store implementation
    }),
    { name: "MyStore" }
  )
);
```

### Using Persist Middleware

```typescript
import { create } from "zustand";
import { persistSafe } from "./middleware/persistSafe";

export const useMyStore = create<MyState>()(
  persistSafe(
    (set) => ({
      // ... store implementation
    }),
    { name: "my-store" }
  )
);
```

### Using Resettable Middleware

```typescript
import { create } from "zustand";
import { resettable } from "./middleware/resettable";

const initialState = {
  count: 0,
};

export const useMyStore = create<MyState>()(
  resettable(
    (set) => ({
      ...initialState,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    initialState
  )
);

// Later, reset the store
useMyStore.getState().reset();
```

## Best Practices

1. **Use middleware appropriately** - Not all stores need all middleware
2. **Handle errors** - Persistence can fail, handle gracefully
3. **Name stores** - Use descriptive names for DevTools
4. **Test reset functionality** - Ensure stores reset correctly

## Further Reading

- [store/README.md](../README.md) - Store package overview
