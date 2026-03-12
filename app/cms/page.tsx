import type { Metadata } from "next"
import CMSClient from "./CMSClient"

export const metadata: Metadata = {
  title: "CMS — Free Money Directory",
  description: "Internal content management for Free Money Directory",
  robots: { index: false, follow: false },
}

export default function CMSPage() {
  return <CMSClient />
}
