import data from "../../app/dashboard/data.json"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"

export default function AdminDashboard() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_28%),linear-gradient(180deg,rgba(12,17,29,0.92),rgba(7,12,22,0.96))] py-4 md:py-6">
        <div className="mb-4 px-4 lg:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-300/80">
            Admin Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
            Course & Subscriber Management
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Manage user inventory, track subscriber metrics, and monitor course engagement.
          </p>
        </div>
        <SectionCards />
        <div className="mt-4 px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <div className="mt-4">
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}
