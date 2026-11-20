import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2 text-base text-foreground shadow-[0_1px_2px_rgb(15_23_42/0.03)] transition-[background-color,border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground/75 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-55 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-background/60 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
