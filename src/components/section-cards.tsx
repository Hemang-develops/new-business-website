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

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card border border-white/10 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_45%),linear-gradient(180deg,rgba(18,24,39,0.98),rgba(12,17,29,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-0">
        <CardHeader>
          <CardDescription className="text-[15px] text-[#b8c0cc]">Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-white">
              <TrendingUpIcon
              />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Trending up this month{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-[#a7afbb]">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card border border-white/10 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_45%),linear-gradient(180deg,rgba(18,24,39,0.98),rgba(12,17,29,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-0">
        <CardHeader>
          <CardDescription className="text-[15px] text-[#b8c0cc]">New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-white">
              <TrendingDownIcon
              />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Down 20% this period{" "}
            <TrendingDownIcon className="size-4" />
          </div>
          <div className="text-[#a7afbb]">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card border border-white/10 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_45%),linear-gradient(180deg,rgba(18,24,39,0.98),rgba(12,17,29,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-0">
        <CardHeader>
          <CardDescription className="text-[15px] text-[#b8c0cc]">Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-white">
              <TrendingUpIcon
              />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Strong user retention{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-[#a7afbb]">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card border border-white/10 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_45%),linear-gradient(180deg,rgba(18,24,39,0.98),rgba(12,17,29,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.28)] ring-0">
        <CardHeader>
          <CardDescription className="text-[15px] text-[#b8c0cc]">Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-white @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-white">
              <TrendingUpIcon
              />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-white">
            Steady performance increase{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-[#a7afbb]">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  )
}
