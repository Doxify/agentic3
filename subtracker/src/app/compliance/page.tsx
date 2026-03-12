"use client";

import { useEffect, useState } from "react";
import { ComplianceDashboard } from "@/components/compliance/ComplianceDashboard";
import { fetchSubcontractors, fetchComplianceSummary } from "@/lib/api";
import type { Subcontractor, ComplianceSummary } from "@/types";

export default function CompliancePage() {
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSubcontractors(), fetchComplianceSummary()]).then(
      ([s, c]) => {
        setSubs(s);
        setSummary(c);
        setLoading(false);
      },
    );
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Compliance Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor document status and compliance across all subcontractors.
        </p>
      </div>

      {loading || !summary ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <ComplianceDashboard subcontractors={subs} summary={summary} />
      )}
    </div>
  );
}
