import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={[
        'mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 space-y-6',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      {children}
    </div>
  )
}
