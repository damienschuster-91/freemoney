import type { Metadata } from "next"
import { SCHOLARSHIPS, LOCAL_DATA } from "@/lib/data"
import ScholarshipsClient from "./ScholarshipsClient"

export const metadata: Metadata = {
  title: "All Scholarships, Grants & Trades",
  description: `Browse ${SCHOLARSHIPS.length}+ scholarships, grants, trades and no-essay awards. Filter by category, tags, GPA and deadline.`,
}

export default function ScholarshipsPage() {
  return <ScholarshipsClient scholarships={SCHOLARSHIPS} total={SCHOLARSHIPS.length + LOCAL_DATA.length} />
}
