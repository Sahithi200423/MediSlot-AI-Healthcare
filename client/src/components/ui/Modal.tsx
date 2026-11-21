import React, { useEffect, useId } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { modalBackdropVariants, modalDialogVariants } from "@/lib/motion"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = "md" }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-editorial-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-[#1e1815]/55 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Dialog Content */}
          <motion.div
            variants={modalDialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative z-10 w-full rounded-3xl bg-[#fbf9f5] p-6 shadow-2xl border border-[#e8e2d8] text-[#1e1815] dark:bg-[#1a1613] dark:border-[#362f2a] dark:text-[#fbf9f5] max-h-[90vh] overflow-y-auto",
              maxWidths[maxWidth]
            )}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#ece6dd] dark:border-[#362f2a]">
              <div>
                <h3 id={titleId} className="font-editorial-serif text-2xl font-normal text-[#1e1815] dark:text-[#fbf9f5]">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-[#6e6059] dark:text-[#c4b5a8] mt-1">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#8c7e77] hover:bg-[#ede5d9] hover:text-[#1e1815] dark:hover:bg-[#2b2520] dark:hover:text-[#fbf9f5] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
