# Task: Implement Huey Chat V1 in Viewer (TanStack AI)

## Status

completed

## Priority

P0

## Linked Spec

`apps/viewer/content/notes/spec-huey-chat-tanstack-ai-agui.md`

## Goal

Ship a first-party Huey chat page in Viewer and make it the default chat path, with MCP unchanged.

## Checklist

- [x] Add Viewer route `/huey` and page layout for chat timeline + composer
- [x] Install and wire TanStack AI client package(s)
- [x] Add server endpoint/adapter to stream Huey/Tensura responses
- [x] Render tool output events in chat UI (at least text + structured JSON block)
- [x] Add interrupt/cancel control for in-flight generation
- [x] Add navbar link to `/huey` and mark as primary chat entry
- [x] Keep Tensura OpenCode path available as fallback during migration
- [x] Add basic tests for route render + request wiring

## Notes

1. AG-UI is for user interaction protocol only.
2. MCP remains the source of truth for tool/data operations.
3. Do not duplicate MCP tool contracts in frontend code.
