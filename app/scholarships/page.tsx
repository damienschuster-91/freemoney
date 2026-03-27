import type { Metadata } from "next"
import { SCHOLARSHIPS, LOCAL_DATA } from "@/lib/data"
import ScholarshipsClient from "./ScholarshipsClient"

const NON_TRADE = SCHOLARSHIPS.filter(s => s.category !== "trade")

export const metadata: Metadata = {
  title: "All Scholarships & Grants",
  description: `Browse ${NON_TRADE.length}+ scholarships, grants, and no-essay awards. Filter by category, tags, GPA and deadline.`,
}

export default function ScholarshipsPage() {
  return <ScholarshipsClient scholarships={NON_TRADE} total={NON_TRADE.length + LOCAL_DATA.length} />
}
