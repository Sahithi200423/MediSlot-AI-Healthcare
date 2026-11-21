import React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "teal"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none"

    const variants = {
      primary:
        "bg-[#cb6440] text-white hover:bg-[#b85633] focus-visible:ring-[#cb6440] shadow-sm shadow-[#cb6440]/20 hover:shadow-md hover:shadow-[#cb6440]/25 dark:shadow-none",
      teal:
        "bg-[#4a6356] text-white hover:bg-[#3d5247] focus-visible:ring-[#4a6356] shadow-sm shadow-[#4a6356]/20 hover:shadow-md dark:shadow-none",
      secondary:
        "bg-[#f5f1e9] text-[#2a201e] hover:bg-[#ede4d5] focus-visible:ring-[#c5a880] dark:bg-[#26211d] dark:text-[#f5f1e9] dark:hover:bg-[#332c26]",
      outline:
        "border border-[#dcd3c6] bg-white/80 hover:bg-[#f5f1e9] hover:border-[#cb6440]/60 text-[#2a201e] focus-visible:ring-[#cb6440] dark:border-[#362f2a] dark:bg-transparent dark:text-[#f5f1e9] dark:hover:bg-[#26211d]",
      ghost:
        "bg-transparent text-[#6e6059] hover:bg-[#f5f1e9] hover:text-[#1e1815] focus-visible:ring-[#c5a880] dark:text-[#c4b5a8] dark:hover:bg-[#26211d] dark:hover:text-[#fbf9f5]",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-sm shadow-rose-200 dark:shadow-none",
    }

    const sizes = {
      sm: "text-xs px-3.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
