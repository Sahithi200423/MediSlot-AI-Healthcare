const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const inrDecimalFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formats an exact numeric consultation fee in Indian Rupees (INR) using en-IN grouping.
 * Never converts or alters the numeric value returned by the backend.
 */
export function formatINR(amount: number | string | null | undefined): string {
  const numeric = typeof amount === "string" ? Number(amount) : Number(amount ?? 0)
  if (!Number.isFinite(numeric)) {
    return inrWholeFormatter.format(0)
  }

  return Number.isInteger(numeric)
    ? inrWholeFormatter.format(numeric)
    : inrDecimalFormatter.format(numeric)
}
