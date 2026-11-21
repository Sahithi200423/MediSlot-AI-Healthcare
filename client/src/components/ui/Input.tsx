import React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, icon, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-semibold text-[#4a3e39] dark:text-[#e4ded5]"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8c7e77]">
              {icon}
            </div>
          )}
          <input
            id={generatedId}
            type={type}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border border-[#dcd3c6] bg-white px-3.5 py-2 text-sm text-[#1e1815] transition-all duration-200 placeholder:text-[#a28c7a] hover:border-[#c5a880] focus:border-[#cb6440] focus:outline-none focus:ring-2 focus:ring-[#cb6440]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#362f2a] dark:bg-[#141210] dark:text-[#fbf9f5] dark:placeholder:text-[#8c7e77] dark:focus:border-[#e17145]",
              icon && "pl-10",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#8c7e77] dark:text-[#c4b5a8]">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"
