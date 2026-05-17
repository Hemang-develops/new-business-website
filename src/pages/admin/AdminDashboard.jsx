import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"

export default function AdminDashboard({ stats }) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-6">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_28%),linear-gradient(180deg,rgba(12,17,29,0.92),rgba(7,12,22,0.96))] py-4 md:py-6">
        <div className="mb-4 px-4 lg:px-6">
          <div>
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
        </div>
        <SectionCards />
        <div className="mt-4 grid gap-4 px-4 lg:grid-cols-4 lg:px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Courses</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats?.totalCourses ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Course purchases</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats?.totalCoursePurchases ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Active access</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats?.activeCourseAccess ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Payment volume</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats?.courseRevenueLabel || "$0.00"}</p>
          </div>
        </div>
        {stats?.dashboardSummaryViewData ? (
          <div className="mt-4 grid gap-4 px-4 lg:grid-cols-4 lg:px-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">New purchases (7d)</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.dashboardSummaryViewData.new_purchases_7d ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Completions (7d)</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.dashboardSummaryViewData.completions_7d ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Revenue (30d)</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {stats.dashboardSummaryViewData.revenue_30d != null
                  ? `$${Number(stats.dashboardSummaryViewData.revenue_30d).toLocaleString()}`
                  : "No volume"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Content changes (30d)</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.dashboardSummaryViewData.content_changes_30d ?? 0}</p>
            </div>
          </div>
        ) : null}
        {stats?.recentNotifications?.length ? (
          <div className="mt-4 px-4 lg:px-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200/80">Recent course purchases</p>
              <div className="mt-4 divide-y divide-white/10">
                {stats.recentNotifications.map((notification) => (
                  <div key={notification.id} className="py-3 text-sm text-white/70 first:pt-0 last:pb-0">
                    <p className="font-semibold text-white">{notification.title}</p>
                    <p className="mt-1 text-xs text-white/50">{notification.customer_email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <div className="mt-4 px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <div className="mt-4">
          <DataTable data={stats?.courseAccess || []} />
        </div>
      </div>
    </div>
  )
}
