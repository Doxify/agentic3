"use client";

import { motion } from "framer-motion";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { ComplianceRow } from "./ComplianceRow";
import type { Subcontractor, ComplianceSummary } from "@/types";

interface ComplianceDashboardProps {
  subcontractors: Subcontractor[];
  summary: ComplianceSummary;
}

export function ComplianceDashboard({
  subcontractors,
  summary,
}: ComplianceDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard label="Total" value={summary.total} color="blue" />
        <SummaryCard label="Compliant" value={summary.compliant} color="emerald" />
        <SummaryCard label="Expiring Soon" value={summary.expiringSoon} color="amber" />
        <SummaryCard label="Non-Compliant" value={summary.nonCompliant} color="red" />
        <SummaryCard label="Pending" value={summary.pending} color="slate" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Compliance by Subcontractor
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {subcontractors.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No subcontractors to display.
            </div>
          ) : (
            subcontractors.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <ComplianceRow subcontractor={sub} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
