const formatCurrency = (value) => {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) {
    return "-";
  }
  return `$${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (value) => {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) {
    return "0%";
  }
  return `${numeric.toFixed(1)}%`;
};

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toLocaleString()
    : "-";
};

const AnalyticsTab = ({ offeringAnalytics = [], userLearningPaths = [] }) => {
  const topOfferings = [...offeringAnalytics]
    .sort((a, b) => Number(b.total_sales || 0) - Number(a.total_sales || 0))
    .slice(0, 12);

  const activeUsers = userLearningPaths.filter((row) => row.engagement_status === "active").slice(0, 12);
  const atRiskUsers = userLearningPaths.filter((row) => row.engagement_status === "at_risk").slice(0, 12);

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Analytics</h2>
        <p className="mt-1 text-xs text-white/60">
          Live offering and learner signals from the storefront analytics read models.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Offerings tracked</p>
          <p className="mt-3 text-3xl font-semibold text-white">{offeringAnalytics.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Active learners</p>
          <p className="mt-3 text-3xl font-semibold text-white">{activeUsers.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">At-risk learners</p>
          <p className="mt-3 text-3xl font-semibold text-white">{atRiskUsers.length}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
        <h3 className="text-sm font-semibold text-white">Top offerings by sales</h3>
        {topOfferings.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead className="border-b border-white/10 text-white/70">
                <tr>
                  <th className="py-3 pr-6">Offering</th>
                  <th className="py-3 pr-6">Sales</th>
                  <th className="py-3 pr-6">Revenue</th>
                  <th className="py-3 pr-6">Conversion</th>
                  <th className="py-3 pr-6">Course progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {topOfferings.map((offering) => (
                  <tr key={offering.offering_id} className="hover:bg-white/5">
                    <td className="py-3 pr-6 font-medium text-white">{offering.title || offering.offering_id}</td>
                    <td className="py-3 pr-6">{offering.total_sales ?? 0}</td>
                    <td className="py-3 pr-6">{formatCurrency(offering.total_revenue)}</td>
                    <td className="py-3 pr-6">{formatPercent(offering.conversion_rate)}</td>
                    <td className="py-3 pr-6">{offering.avg_course_progress != null ? `${offering.avg_course_progress.toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/60">No offering analytics available yet.</p>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
        <h3 className="text-sm font-semibold text-white">Learner engagement</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Active learners</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white/80">
                <thead className="border-b border-white/10 text-white/70">
                  <tr>
                    <th className="py-3 pr-6">Email</th>
                    <th className="py-3 pr-6">Enrolled</th>
                    <th className="py-3 pr-6">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {activeUsers.map((profile) => (
                    <tr key={profile.user_id} className="hover:bg-white/5">
                      <td className="py-3 pr-6 font-medium text-white">{profile.email}</td>
                      <td className="py-3 pr-6">{profile.total_enrolled ?? 0}</td>
                      <td className="py-3 pr-6">{profile.avg_course_progress != null ? `${profile.avg_course_progress.toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">At-risk learners</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white/80">
                <thead className="border-b border-white/10 text-white/70">
                  <tr>
                    <th className="py-3 pr-6">Email</th>
                    <th className="py-3 pr-6">Current</th>
                    <th className="py-3 pr-6">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {atRiskUsers.map((profile) => (
                    <tr key={profile.user_id} className="hover:bg-white/5">
                      <td className="py-3 pr-6 font-medium text-white">{profile.email}</td>
                      <td className="py-3 pr-6">{profile.currently_learning ?? 0}</td>
                      <td className="py-3 pr-6">{formatDate(profile.last_activity_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsTab;
