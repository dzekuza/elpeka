"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex w-full sm:inline-flex sm:w-auto items-center gap-2 rounded-xl bg-muted p-1 overflow-x-auto scrollbar-none",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  badge,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  badge?: number
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative flex flex-1 sm:flex-none sm:shrink-0 items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-normal whitespace-nowrap text-foreground transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-card data-[state=active]:shadow-[0_0_2px_rgba(0,0,0,0.08)]",
        className
      )}
      {...props}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute right-2 top-[12.5px] flex size-[19px] items-center justify-center rounded-full bg-notification text-[12px] font-medium leading-none text-white">
          {badge}
        </span>
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
