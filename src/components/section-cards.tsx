"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

export function SectionCards({ stats }: { stats?: any }) {
  const cards = [
    { label: "Total Revenue", value: stats?.courseRevenueLabel || "No volume", note: "From recorded purchases" },
    { label: "New Subscribers", value: stats?.totalSubscribers ?? 0, note: "Confirmed newsletter subscribers" },
    { label: "Active Subscriptions", value: "Not tracked", note: "No subscription billing table configured" },
    { label: "Course Enrollments", value: stats?.courseEnrollments ?? 0, note: "Recorded course access" },
  ]
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => <Card key={card.label} className="@container/card border border-white/10 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_45%),linear-gradient(180deg,rgba(18,24,39,0.98),rgba(12,17,29,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-0"><CardHeader><CardDescription className="text-[15px] text-[#b8c0cc]">{card.label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">{card.value}</CardTitle></CardHeader><CardFooter className="flex-col items-start gap-1.5 text-sm"><div className="text-[#a7afbb]">{card.note}</div></CardFooter></Card>)}
    </div>
  )
}
