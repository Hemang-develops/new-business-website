"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-xl text-sm font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow,border-color,transform] outline-none focus-visible:ring-[3px] focus-visible:ring-white/15 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-transparent text-white/72 hover:bg-white/[0.06] hover:text-white data-[state=on]:border-white/12 data-[state=on]:bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.10))] data-[state=on]:text-white data-[state=on]:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_24px_rgba(0,0,0,0.18)]",
        outline:
          "border border-white/8 bg-transparent text-white/72 shadow-none hover:border-white/10 hover:bg-white/[0.06] hover:text-white data-[state=on]:border-white/12 data-[state=on]:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.10))] data-[state=on]:text-white data-[state=on]:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_24px_rgba(0,0,0,0.18)]",
      },
      size: {
        default: "h-10 min-w-10 px-4",
        sm: "h-9 min-w-9 px-3",
        lg: "h-11 min-w-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
