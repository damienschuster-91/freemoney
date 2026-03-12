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

export function nextDeadlineDate(deadline: string): Date {
  if (!deadline) return new Date(9999, 0, 1)
  const monthMap: Record<string, number> = {
    jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11,
  }
  const match = deadline.toLowerCase().match(/([a-z]+)\s+(\d+)/)
  if (!match) return new Date(9999, 0, 1)
  const month = monthMap[match[1]]
  const day = parseInt(match[2])
  if (month === undefined || isNaN(day)) return new Date(9999, 0, 1)
  const now = new Date()
  const thisYear = new Date(now.getFullYear(), month, day)
  return thisYear < now ? new Date(now.getFullYear() + 1, month, day) : thisYear
}
