// Utility to build absolute URLs for SEO
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freemoneydir.com"
export const SITE_NAME = "Free Money Directory"
export const SITE_DESCRIPTION = "220+ scholarships, grants, trades & local foundations — all verified, all free to apply."

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`
}

export function formatAmount(amount: string): string {
  return amount.startsWith("$") || amount.startsWith("Up") || amount.startsWith("Full")
    ? amount : "$" + amount
}
