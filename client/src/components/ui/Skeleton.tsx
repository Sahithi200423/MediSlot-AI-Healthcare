import React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export function Skeleton({ className, rounded = "lg", ...props }: SkeletonProps) {
  const radii = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }

  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer", radii[rounded], className)}
      {...props}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-2xl border border-[#ece6dd] dark:border-[#362f2a] bg-white dark:bg-[#1d1916] p-5 space-y-4",
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        <Skeleton rounded="xl" className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#f2ede4] dark:border-[#2b2520]">
        <Skeleton className="h-4 w-20" />
        <Skeleton rounded="full" className="h-7 w-24" />
      </div>
    </div>
  )
}
