'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

// Basic Context for Segmented Control
interface SegmentedControlContextProps {
  value: string
  onValueChange: (value: string) => void
}

const SegmentedControlContext = React.createContext<SegmentedControlContextProps | null>(null)

// Hook to use the context
const useSegmentedControl = () => {
  const context = React.useContext(SegmentedControlContext)
  if (!context) {
    throw new Error(
      "useSegmentedControl must be used within a SegmentedControlProvider"
    )
  }
  return context
}

// Main SegmentedControl component (Provider)
interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
}

const SegmentedControl = React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ className, value, onValueChange, children, ...props }, ref) => {
  return (
    <SegmentedControlContext.Provider value={{ value, onValueChange }}>
      <div
        ref={ref}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SegmentedControlContext.Provider>
  )
})
SegmentedControl.displayName = "SegmentedControl"

// SegmentedControlItem component
interface SegmentedControlItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string
}

const SegmentedControlItem = React.forwardRef<
  HTMLButtonElement,
  SegmentedControlItemProps
>(({ className, value, children, ...props }, ref) => {
  const { value: contextValue, onValueChange } = useSegmentedControl()
  const isActive = contextValue === value

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
SegmentedControlItem.displayName = "SegmentedControlItem"

export { SegmentedControl, SegmentedControlItem }; 