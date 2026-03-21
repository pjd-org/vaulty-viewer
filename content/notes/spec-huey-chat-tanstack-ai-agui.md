# Spec: Huey Chat Surface (TanStack AI + AG-UI, MCP Preserved)

## Summary
Replace OpenCode web chat as the primary user chat surface with a first-party chat page in Viewer using TanStack AI.

AG-UI is added as the live interaction protocol layer. MCP remains the tool/data protocol.

## Decision
1. Keep MCP as the agent-to-tools/data contract.
2. Add AG-UI for agent-to-frontend interaction (events, streaming, interrupts, UI actions).
3. Build the user chat page in TanStack Start Viewer.
4. Keep Tensura/Aladdin as orchestrator/backend; do not move tool logic into AG-UI.

## Architecture
Viewer UI (TanStack Start)
↕
AG-UI event stream
↕
Agent backend / orchestrator (Huey via Tensura/Aladdin)
↕
API wrapper
↕
Vaulty MCP
↕
Vault + tools/actions

## Scope (Phase 1)
1. New Viewer route: `/huey`
2. Streaming chat via TanStack AI client hooks
3. Server adapter endpoint in Viewer for chat stream passthrough
4. Render assistant/user messages and tool result blocks
5. Navbar entry to the new chat route

## Out of Scope (Phase 1)
1. Replacing MCP
2. Agent-to-agent protocol changes
3. Full generative UI blocks
4. Complex multi-agent routing UX

## Phase 2+
1. Interrupt + approval flows
2. Frontend action events
3. Shared agent state across sessions
4. Rich tool output streaming panels

## Acceptance Criteria
1. Chat can send/receive streamed responses from Huey backend.
2. Tool execution results are visible in Viewer chat timeline.
3. MCP-backed actions still execute through existing API/MCP path.
4. OpenCode web chat is no longer the primary entry in Viewer navigation.

