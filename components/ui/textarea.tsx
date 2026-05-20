import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-16 w-full min-w-0 rounded-lg border border-transparent bg-foreground/[0.06] px-3 pt-3 pb-4 text-sm text-foreground outline-none transition-colors",
        "placeholder:text-foreground/50",
        "hover:bg-foreground/[0.10]",
        "focus-visible:border-primary focus-visible:bg-foreground/[0.06]",
        "aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
