import { notFound } from "next/navigation"
import Link from "next/link"
import { LOCAL_DATA } from "@/lib/data"

export function generateStaticParams() {
  const states = Array.from(new Set(LOCAL_DATA.map(l => l.state.toLowerCase())))
  return states.map(state => ({ state }))
}

export default function StatePage({ params }: { params: { state: string } }) {
  const stateUpper = params.state.toUpperCase()
  const listings = LOCAL_DATA.filter(l => l.state.toUpperCase() === stateUpper)
  if (!listings.length) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/local" className="text-blue-600 hover:underline text-sm">
            &larr; All States
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {stateUpper} Local Foundation Scholarships
        </h1>
        <p className="text-gray-500 mb-8">
          {listings.length} verified foundation{listings.length !== 1 ? "s" : ""} &mdash; all confirmed via IRS 990 filings
        </p>
        <div className="space-y-4">
          {listings.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">{s.name}</h2>
                  <p className="text-gray-600 text-sm mb-3">{s.eligibility}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>Deadline: {s.deadline}</span>
                    <span>Location: {s.city}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-blue-700 hover:underline">
                      Apply
                    </a>
                    {s.propublica_url && (
                      <a href={s.propublica_url} target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:underline">
                        990 Filing
                      </a>
                    )}
                  </div>
                </div>
                <div className="shrink-0 bg-green-50 text-green-700 text-sm font-semibold px-3 py-1 rounded-full border border-green-200">
                  {s.amount}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
