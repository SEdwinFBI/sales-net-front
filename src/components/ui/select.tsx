import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-9 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-card px-3 py-1 text-base text-foreground shadow-[0_1px_2px_rgb(15_23_42/0.03)] transition-[background-color,border-color,box-shadow] duration-150 outline-none hover:border-primary/40 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-55 md:text-sm dark:bg-background/60 dark:text-foreground dark:[color-scheme:dark] dark:hover:border-primary/45 [&_option]:bg-card [&_option]:text-foreground dark:[&_option]:bg-card dark:[&_option]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
