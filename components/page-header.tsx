import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[1.3] sm:text-[40px] font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-base font-normal leading-relaxed text-foreground/85 max-w-prose">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </div>
  )
}
