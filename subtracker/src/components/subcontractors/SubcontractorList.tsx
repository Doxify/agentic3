"use client";

import { motion } from "framer-motion";
import { Building2, Mail } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Subcontractor } from "@/types";

interface SubcontractorListProps {
  subcontractors: Subcontractor[];
}

export function SubcontractorList({ subcontractors }: SubcontractorListProps) {
  if (subcontractors.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">No subcontractors yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" role="table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                Subcontractor
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                Company
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                Documents
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-600">
                Invited
              </th>
            </tr>
          </thead>
          <tbody>
            {subcontractors.map((sub, index) => (
              <motion.tr
                key={sub.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {sub.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {sub.name}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                        <Mail className="h-3 w-3" aria-hidden="true" />
                        {sub.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {sub.company}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={sub.status} size="sm" />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {sub.documents.length}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(sub.invitedAt)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
