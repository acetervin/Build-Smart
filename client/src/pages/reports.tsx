import React, { useEffect, useState } from "react";
import { Link } from "wouter";

type ReportSummary = {
  id: string;
  name: string;
  createdAt: string;
  totalCost?: number;
  volumeM3?: number;
};

export default function ReportsList() {
  const [reports, setReports] = useState<ReportSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        // The server returns { estimates, stats, filters }
        const items = (data.estimates || []).map((e: any) => ({
          id: e.id || e._id || `${e.projectId}-${e.createdAt}`,
          name: e.name || "Untitled",
          createdAt: e.createdAt || new Date().toISOString(),
          totalCost: e.totalCost,
          volumeM3: e.volumeM3,
        }));
        if (mounted) setReports(items);
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load reports");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReports();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {loading && <p>Loading reports…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {reports && reports.length > 0 ? (
            reports.map((r) => (
              <div key={r.id} className="p-4 border rounded-md flex justify-between items-center">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground">{r.volumeM3 ? `${r.volumeM3} m³` : "—"}</div>
                  <div className="text-sm font-medium">{r.totalCost ? `$${r.totalCost.toFixed(2)}` : "—"}</div>
                  <Link href={`/report/${encodeURIComponent(r.id)}`}>
                    <button className="btn btn-sm ml-2">View</button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 border rounded-md">No reports found. Create an estimate to generate reports.</div>
          )}
        </div>
      )}
    </div>
  );
}
