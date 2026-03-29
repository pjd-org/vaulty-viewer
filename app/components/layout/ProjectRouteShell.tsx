import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import { PROJECT_ROUTE_TABS } from '../../../src/lib/routes/v3-routing'
import { PageContainer } from './PageContainer'
import { PageFrame } from './PageFrame'
import { SummaryRow, type SummaryRowItem } from './SummaryRow'

interface ProjectRouteShellProps {
  slug: string
  summaryItems?: readonly SummaryRowItem[]
  children: React.ReactNode
}

export function ProjectRouteShell({
  slug,
  summaryItems = [],
  children,
}: ProjectRouteShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <PageContainer>
      <PageFrame
        title={`Project: ${slug}`}
        subtitle="Scoped command center"
        actions={
          <Link
            to={'/work' as never}
            className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100"
          >
            Back to Work
          </Link>
        }
      >
        <div className="genie-surface genie-surface--utility rounded-[24px] p-2">
          <div className="flex flex-wrap gap-2">
            {PROJECT_ROUTE_TABS.map((tab) => {
              const to = tab.to.replace('$slug', encodeURIComponent(slug))
              const active =
                pathname === to || (to !== `/project/${slug}` && pathname.startsWith(`${to}/`))

              return (
                <Link
                  key={tab.label}
                  to={to as never}
                  className={[
                    'tab rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active ? 'active text-slate-100' : 'text-slate-300',
                  ].join(' ')}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>

        <SummaryRow items={summaryItems} />
        {children}
      </PageFrame>
    </PageContainer>
  )
}
