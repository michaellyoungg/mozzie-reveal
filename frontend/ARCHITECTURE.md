# Architecture

## Dependency Rules

This project follows strict dependency rules to maintain clean separation of concerns:

```
┌─────────────┐
│   Types     │ ← No dependencies
└─────────────┘
       ▲
       │
┌─────────────┐
│   Store     │ ← Only depends on: types, zustand/vanilla
└─────────────┘
       ▲
       │
┌─────────────────────────────┐
│   WebSocket Service         │ ← Depends on: store, types
└─────────────────────────────┘
       ▲
       │
┌─────────────────────────────┐
│   Game Actions              │ ← Depends on: store, websocket service, types
└─────────────────────────────┘
       ▲
       │
┌─────────────────────────────┐
│   Hooks                     │ ← Depends on: store, actions, zustand/react
└─────────────────────────────┘
       ▲
       │
┌─────────────────────────────┐
│   Components                │ ← Depends on: hooks, actions
└─────────────────────────────┘
```

### Key Principles

1. **Store (src/store/gameStore.ts)**
   - Pure state management
   - NO dependencies except types and zustand/vanilla
   - Can be used anywhere (React, Node.js, tests)

2. **WebSocket Service (src/services/websocket.ts)**
   - Owns connection lifecycle
   - Handles incoming messages
   - Updates store directly

3. **Game Actions (src/actions/gameActions.ts)**
   - Business logic layer
   - Uses websocket service to send messages
   - Uses store to read/update state

4. **Hooks (src/hooks/useGameSelectors.ts)**
   - React integration layer
   - Wraps vanilla store for React components
   - Re-exports actions

5. **Components**
   - UI layer
   - Use hooks for state
   - Call actions for logic

### Enforcing Rules

To prevent violations:
- Comments at top of critical files (store, services)
- Code reviews check dependencies
- Consider adding `eslint-plugin-import` rules
- Consider adding `dependency-cruiser` for automated enforcement
