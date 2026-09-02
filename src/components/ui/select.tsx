import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-border bg-card px-2.5 py-1 text-base text-foreground transition-colors outline-none hover:bg-primary-nav/45 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-card dark:text-foreground dark:[color-scheme:dark] [&_option]:bg-card [&_option]:text-foreground dark:[&_option]:bg-card dark:[&_option]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
