import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, onClick, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(15_23_42/0.03)] transition-[background-color,border-color,box-shadow] duration-150",
        "placeholder:text-muted-foreground/75",
        "hover:border-primary/40",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/60",
        "disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-55",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:bg-background/60 dark:hover:border-primary/45 dark:focus-visible:bg-background/90",
        className
      )}
      {...props}
      onClick={(event) => {
        onClick?.(event)

        const input = event.currentTarget
        if (
          type !== "date" ||
          event.defaultPrevented ||
          input.disabled ||
          input.readOnly ||
          typeof input.showPicker !== "function"
        ) return

        try {
          input.showPicker()
        } catch {
          // Keep the native picker available when the browser blocks showPicker.
        }
      }}
    />
  )
}

export { Input }
