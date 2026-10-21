import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={[
        // w-full is required: PageContainer is a block child of a flex column.
          // Without it, `align-items: normal` makes it shrink to content width
          // (measured 636px inside a 1168px column), so every page rendered in
          // a narrow centred strip with large empty margins.
          'mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      {children}
    </div>
  )
}
