interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[40px] font-medium leading-[48px] tracking-[-1.6px] text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-base font-normal leading-6 text-foreground/85">
          {description}
        </p>
      )}
    </div>
  )
}
