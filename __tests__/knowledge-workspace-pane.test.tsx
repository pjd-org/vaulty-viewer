import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { KnowledgeWorkspacePane } from '../app/components/knowledge/KnowledgeWorkspacePane'
import { apiFetch } from '../src/utils/api'

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')

  return {
    ...actual,
    Link: ({
      to,
      search,
      className,
      children,
    }: {
      to: string
      search?: Record<string, unknown>
      className?: string
      children: React.ReactNode
    }) => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(search ?? {})) {
        if (value === undefined || value === null) continue
        params.set(key, String(value))
      }
      const query = params.toString()
      return (
        <a href={`${to}${query ? `?${query}` : ''}`} className={className}>
          {children}
        </a>
      )
    },
  }
})

vi.mock('../src/utils/api', () => ({
  apiFetch: vi.fn(),
}))

const mockedApiFetch = vi.mocked(apiFetch)

afterEach(() => {
  cleanup()
  mockedApiFetch.mockReset()
})

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('KnowledgeWorkspacePane', () => {
  it('renders the selected note, related references, and workspace actions', async () => {
    const notePath = 'notes/knowledge/human/engineering/typescript-guide.md'

    mockedApiFetch.mockImplementation(async (request) => {
      const url = String(request)

      if (url.includes('/api/v1/notes/')) {
        return response({
          structuredContent: {
            path: notePath,
            content: '# TypeScript Guide\n\nUse the workspace to edit notes in context.',
            frontmatter: {
              title: 'TypeScript Guide',
              type: 'note',
              status: 'draft',
              tags: ['typescript', 'knowledge'],
              created: '2026-03-30T00:00:00.000Z',
            },
          },
        })
      }

      if (url.includes('/api/v1/graph/related/')) {
        return response({
          structuredContent: {
            related: [
              {
                path: 'notes/knowledge/agent/tooling/mcp-protocol.md',
                score: 0.92,
                reasons: ['linked reference'],
              },
            ],
          },
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    render(
      <KnowledgeWorkspacePane
        noteId={notePath}
        mode="edit"
        projectId="rent-stability-pantin"
      />,
    )

    expect(await screen.findByText('Use the workspace to edit notes in context.')).toBeTruthy()
    expect(screen.getByText('Workspace actions')).toBeTruthy()
    expect(screen.getByText('Edit mode')).toBeTruthy()
    expect(screen.getByRole('link', { name: /open full editor/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /open graph/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /mcp protocol/i })).toBeTruthy()
  })
})
