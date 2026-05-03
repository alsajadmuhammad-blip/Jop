"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<any> // Opaque type after removing DayPicker

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3", className)}>
        Calendar component has been removed to resolve dependency conflicts.
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
