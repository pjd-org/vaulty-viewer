import { describe, expect, it } from 'vitest'

import {
  PROJECT_ROUTE_TABS,
  VIEWER_TOP_LEVEL_PATHS,
  getLegacyViewerRedirect,
} from '../../src/lib/routes/v3-routing'

describe('viewer V3 routing canon', () => {
  it('lists the Phase 1 top-level route canon', () => {
    expect(VIEWER_TOP_LEVEL_PATHS).toEqual([
      '/',
      '/inbox',
      '/actions',
      '/automation',
      '/work',
      '/knowledge',
      '/portfolio',
      '/bubble',
      '/health',
      '/graph',
      '/timeline',
      '/settings',
      '/archive',
    ])
  })

  it('keeps the project tab canon in V3 order', () => {
    expect(PROJECT_ROUTE_TABS.map((tab) => tab.to)).toEqual([
      '/project/$slug',
      '/project/$slug/tasks',
      '/project/$slug/knowledge',
      '/project/$slug/automation',
      '/project/$slug/timeline',
      '/project/$slug/dependencies',
      '/project/$slug/risks',
      '/project/$slug/settings',
    ])
  })

  it('maps legacy project URLs to the new V3 surfaces', () => {
    expect(getLegacyViewerRedirect('/projects')).toBe('/work')
    expect(getLegacyViewerRedirect('/projects/')).toBe('/work')
    expect(getLegacyViewerRedirect('/projects/rent-stability-pantin')).toBe(
      '/project/rent-stability-pantin',
    )
    expect(getLegacyViewerRedirect('/projects/rent-stability-pantin/')).toBe(
      '/project/rent-stability-pantin',
    )
    expect(getLegacyViewerRedirect('/projects/rent-stability-pantin/tasks')).toBe(
      null,
    )
    expect(getLegacyViewerRedirect('/work')).toBe(null)
  })
})
