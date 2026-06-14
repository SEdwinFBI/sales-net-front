import * as React from "react"

import { cn } from "@/lib/utils"

function TimeInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="time"
      data-slot="time-input"
      className={cn(
        "h-9 w-full min-w-0",
        "rounded-xl",
        "border border-border",
        "bg-transparent",
        "px-3 text-sm",
        "transition-all duration-150",
        "hover:border-border",
        "hover:bg-primary-nav/45",
        "focus-visible:outline-none",
        "focus-visible:border-primary",
        "focus-visible:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export { TimeInput }
