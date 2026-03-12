"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ShieldCheck, UserPlus } from "lucide-react";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { fetchComplianceSummary, fetchSubcontractors } from "@/lib/api";
import { SubcontractorList } from "@/components/subcontractors/SubcontractorList";
import type { Subcontractor, ComplianceSummary } from "@/types";

export default function DashboardPage() {
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

  if (loading || !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Subcontractor compliance overview
          </p>
        </div>
        <Link
          href="/subcontractors/invite"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Invite Subcontractor
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-5"
      >
        <SummaryCard label="Total" value={summary.total} color="blue" />
        <SummaryCard label="Compliant" value={summary.compliant} color="emerald" />
        <SummaryCard label="Expiring Soon" value={summary.expiringSoon} color="amber" />
        <SummaryCard label="Non-Compliant" value={summary.nonCompliant} color="red" />
        <SummaryCard label="Pending" value={summary.pending} color="slate" />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link
          href="/subcontractors"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Subcontractors</p>
            <p className="text-sm text-slate-500">
              View and manage all subcontractors
            </p>
          </div>
        </Link>
        <Link
          href="/compliance"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Compliance Dashboard</p>
            <p className="text-sm text-slate-500">
              Document status and expiration tracking
            </p>
          </div>
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Recent Subcontractors
        </h2>
        <SubcontractorList subcontractors={subs.slice(0, 5)} />
      </div>
    </div>
  );
}
