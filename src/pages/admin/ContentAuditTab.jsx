const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toLocaleString()
    : "-";
};

const getPayloadSummary = (payload) => {
  if (payload == null) {
    return "No payload available";
  }
  const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return text.split("\n")[0].slice(0, 120);
};

const ContentAuditTab = ({ contentAuditTrail = [] }) => {
  const visibleTrail = contentAuditTrail.slice(0, 100);
  const recentChanges = visibleTrail.length;

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Content Audit Trail</h2>
        <p className="mt-1 text-xs text-white/60">
          Review the latest content revisions for courses and site settings from the storefront audit trail.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Tracked changes</p>
          <p className="mt-3 text-3xl font-semibold text-white">{contentAuditTrail.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Recent entries</p>
          <p className="mt-3 text-3xl font-semibold text-white">{recentChanges}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Current revisions</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {contentAuditTrail.filter((item) => item.is_current).length}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/40 p-4">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="border-b border-white/10 text-white/70">
            <tr>
              <th className="py-3 pr-6">When</th>
              <th className="py-3 pr-6">Type</th>
              <th className="py-3 pr-6">Content</th>
              <th className="py-3 pr-6">Changed by</th>
              <th className="py-3 pr-6">Revision</th>
              <th className="py-3 pr-6">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {visibleTrail.map((row, index) => (
              <tr key={`${row.content_type}-${row.content_id}-${row.revision_number}-${index}`} className="hover:bg-white/5">
                <td className="py-3 pr-6">{formatDate(row.changed_at)}</td>
                <td className="py-3 pr-6 capitalize">{row.content_type}</td>
                <td className="py-3 pr-6 font-medium text-white">{row.content_title}</td>
                <td className="py-3 pr-6">{row.changed_by}</td>
                <td className="py-3 pr-6">{row.revision_number}</td>
                <td className="py-3 pr-6">{getPayloadSummary(row.change_summary || row.change_payload)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ContentAuditTab;
