# Task: Implement Huey Chat V1 in Viewer (TanStack AI)

## Status
in_progress

## Priority
P0

## Linked Spec
`apps/viewer/content/notes/spec-huey-chat-tanstack-ai-agui.md`

## Goal
Ship a first-party Huey chat page in Viewer and make it the default chat path, with MCP unchanged.

## Checklist
- [ ] Add Viewer route `/huey` and page layout for chat timeline + composer
- [ ] Install and wire TanStack AI client package(s)
- [ ] Add server endpoint/adapter to stream Huey/Tensura responses
- [ ] Render tool output events in chat UI (at least text + structured JSON block)
- [ ] Add interrupt/cancel control for in-flight generation
- [ ] Add navbar link to `/huey` and mark as primary chat entry
- [ ] Keep Tensura OpenCode path available as fallback during migration
- [ ] Add basic tests for route render + request wiring

## Notes
1. AG-UI is for user interaction protocol only.
2. MCP remains the source of truth for tool/data operations.
3. Do not duplicate MCP tool contracts in frontend code.

