# Agent Shell — Server Notes

## SANDBOX_ENABLED ↔ sandboxAvailable wiring (TODO)

`run-agent-runner.ts` gates execution on `process.env.SANDBOX_ENABLED`.
`AgentChat` accepts a `sandboxAvailable` prop that hides `agent_runner` in the
mode switcher when false.

These two signals are not yet connected. When adding a thread history route
(Phase 6) or any route that mounts `AgentChat`:

1. Read `SANDBOX_ENABLED` server-side at route load time (loader or server fn).
2. Pass the resolved boolean as `sandboxAvailable` to `<AgentChat>`.

Example (TanStack Start loader):

```ts
export const Route = createFileRoute('/agent')({
  loader: () => ({
    sandboxAvailable: process.env.SANDBOX_ENABLED === 'true',
  }),
});

// In component:
const { sandboxAvailable } = Route.useLoaderData();
<AgentChat store={store} sandboxAvailable={sandboxAvailable} />
```
