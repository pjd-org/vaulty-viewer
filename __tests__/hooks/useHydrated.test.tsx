import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { useHydrated } from '../../src/hooks/useHydrated'

function Probe() {
  const hydrated = useHydrated()
  return <span data-testid="hydrated">{hydrated ? 'yes' : 'no'}</span>
}

describe('useHydrated', () => {
  it('is false during SSR and true after mount', async () => {
    expect(renderToString(<Probe />)).toContain('no')

    render(<Probe />)

    await waitFor(() => {
      expect(screen.getByTestId('hydrated').textContent).toBe('yes')
    })
  })
})
