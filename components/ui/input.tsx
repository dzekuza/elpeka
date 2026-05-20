import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-lg border border-transparent bg-foreground/[0.06] px-3 py-3 text-sm text-foreground outline-none transition-colors",
        "placeholder:text-foreground/50",
        "hover:bg-foreground/[0.10]",
        "focus-visible:border-primary focus-visible:bg-foreground/[0.06]",
        "aria-invalid:border-destructive",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
