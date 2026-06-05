import { Children } from 'react'
import { cn } from '@/lib/utils'

interface PortalAnimateInProps {
  children: React.ReactNode
  className?: string
}

export function PortalAnimateIn({ children, className }: PortalAnimateInProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <div
          key={i}
          className={cn(
            'animate-in fade-in slide-in-from-bottom-3',
            'duration-[450ms] fill-mode-both motion-reduce:animate-none'
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
