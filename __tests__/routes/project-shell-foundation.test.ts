import { describe, expect, it } from 'vitest'

import {
  PROJECT_ROUTE_TABS,
  getProjectTabPath,
} from '../../src/lib/routes/v3-routing'
import { projectSearchParams } from '../../src/lib/routes/search-params'
import { Route as ProjectTasksRoute } from '../../app/routes/project.$slug.tasks'
import { Route as ProjectKnowledgeRoute } from '../../app/routes/project.$slug.knowledge'
import { Route as ProjectAutomationRoute } from '../../app/routes/project.$slug.automation'
import { Route as ProjectTimelineRoute } from '../../app/routes/project.$slug.timeline'
import { Route as ProjectDependenciesRoute } from '../../app/routes/project.$slug.dependencies'
import { Route as ProjectRisksRoute } from '../../app/routes/project.$slug.risks'
import { Route as ProjectSettingsRoute } from '../../app/routes/project.$slug.settings'

describe('project shell foundation', () => {
  it('builds canonical project tab paths from tab patterns', () => {
    expect(getProjectTabPath('rent-stability-pantin')).toBe(
      '/project/rent-stability-pantin',
    )
    expect(
      getProjectTabPath('rent-stability-pantin', '/project/$slug/tasks'),
    ).toBe('/project/rent-stability-pantin/tasks')
    expect(getProjectTabPath('project/with-slash', '/project/$slug/settings')).toBe(
      '/project/project%2Fwith-slash/settings',
    )
  })

  it('keeps every project tab inside the canonical $slug route family', () => {
    expect(PROJECT_ROUTE_TABS.every((tab) => tab.to.startsWith('/project/$slug'))).toBe(
      true,
    )
  })

  it.each([
    ['tasks', ProjectTasksRoute],
    ['knowledge', ProjectKnowledgeRoute],
    ['automation', ProjectAutomationRoute],
    ['timeline', ProjectTimelineRoute],
    ['dependencies', ProjectDependenciesRoute],
    ['risks', ProjectRisksRoute],
    ['settings', ProjectSettingsRoute],
  ])('project %s route validates canonical project search params', (_label, route) => {
    expect(route.options.validateSearch).toBe(projectSearchParams)
  })
})
