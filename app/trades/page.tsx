import type { Metadata } from "next"
import { SCHOLARSHIPS } from "@/lib/data"
import TradesClient from "./TradesClient"

export const metadata: Metadata = {
  title: { absolute: "Trade School Scholarships & Apprenticeships | LocalScholarships.org" },
  description: "Verified scholarships, grants, and paid apprenticeships for trade school students — electricians, welders, HVAC, plumbing, construction, and more.",
  alternates: { canonical: "/trades" },
}

const TRADE_SCHOLARSHIPS = SCHOLARSHIPS.filter(s => s.category === "trade")

export default function TradesPage() {
  return <TradesClient scholarships={TRADE_SCHOLARSHIPS} />
}
