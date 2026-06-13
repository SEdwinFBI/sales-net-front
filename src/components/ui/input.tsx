import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
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

export { Input }
