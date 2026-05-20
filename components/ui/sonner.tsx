"use client"

import { CheckCircle, XCircle, Info, Warning, CircleNotch } from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircle className="size-4" weight="regular" />,
        info: <Info className="size-4" weight="regular" />,
        warning: <Warning className="size-4" weight="regular" />,
        error: <XCircle className="size-4" weight="regular" />,
        loading: <CircleNotch className="size-4 animate-spin" weight="regular" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !p-2 !gap-2 !text-[#1d1e20] !text-xs !font-normal !shadow-none !bg-white !border-border",
          icon: "!size-4 !m-0",
          content: "!gap-0",
          title: "!text-xs !font-normal leading-4",
          closeButton:
            "!size-4 !top-1/2 !-translate-y-1/2 !right-2 !left-auto !border-0 !bg-transparent !text-foreground/50 hover:!text-foreground",
          success:
            "!bg-[rgba(62,128,0,0.04)] !border-[rgba(62,128,0,0.25)] [&_[data-icon]]:!text-[#3e8000]",
          error:
            "!bg-[rgba(213,10,10,0.04)] !border-[rgba(213,10,10,0.5)] [&_[data-icon]]:!text-[#d50a0a]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
