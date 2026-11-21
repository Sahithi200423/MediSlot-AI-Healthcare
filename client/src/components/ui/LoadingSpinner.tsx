import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} role="status" aria-live="polite">
      <Loader2 className={cn("animate-spin text-[#cb6440] dark:text-[#f07e54]", sizes[size])} />
      {text && <p className="text-xs font-medium text-[#8c7e77] dark:text-[#c4b5a8]">{text}</p>}
    </div>
  )
}
