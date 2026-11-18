import React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "teal"
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const variants = {
    neutral:
      "bg-[#f5f1e9] text-[#4a3e39] border border-[#e4ded5] dark:bg-[#26211d] dark:text-[#e4ded5] dark:border-[#362f2a]",
    success:
      "bg-[#4a6356]/12 text-[#3a5245] border border-[#4a6356]/25 dark:bg-[#4a6356]/25 dark:text-[#99aa77] dark:border-[#4a6356]/40",
    warning:
      "bg-[#c5a880]/20 text-[#7d5f32] border border-[#c5a880]/40 dark:bg-[#c5a880]/15 dark:text-[#e5cfa9] dark:border-[#c5a880]/30",
    danger:
      "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800",
    info:
      "bg-[#cb6440]/10 text-[#b85633] border border-[#cb6440]/25 dark:bg-[#cb6440]/20 dark:text-[#f09a7a] dark:border-[#cb6440]/35",
    teal:
      "bg-[#4a6b5d]/12 text-[#4a6b5d] border border-[#4a6b5d]/25 dark:bg-[#4a6b5d]/25 dark:text-[#99aa77] dark:border-[#4a6b5d]/40",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
