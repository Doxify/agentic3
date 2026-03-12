"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { documentStatusColor, formatDate } from "@/lib/utils";
import type { Subcontractor, DocumentStatus } from "@/types";

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const colors = documentStatusColor(status);
  const label = status.replace("_", " ");
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
}

interface ComplianceRowProps {
  subcontractor: Subcontractor;
}

export function ComplianceRow({ subcontractor: sub }: ComplianceRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-slate-50"
        aria-expanded={expanded}
        aria-controls={`docs-${sub.id}`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {sub.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {sub.name}
          </p>
          <p className="truncate text-xs text-slate-500">{sub.company}</p>
        </div>
        <StatusBadge status={sub.status} size="sm" />
        <span className="text-xs text-slate-400">
          {sub.documents.length} doc{sub.documents.length !== 1 ? "s" : ""}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`docs-${sub.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
              {sub.documents.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="space-y-2" aria-label={`Documents for ${sub.name}`}>
                  {sub.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <FileText
                        className="h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {doc.type.toUpperCase()}
                          {doc.expiresAt
                            ? ` · Expires ${formatDate(doc.expiresAt)}`
                            : ""}
                        </p>
                      </div>
                      <DocStatusBadge status={doc.status} />
                    </li>
                  ))}
                </ul>
              )}

              {sub.documents.some((d) => d.extractedData) && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                    Extracted COI Data
                  </summary>
                  <div className="mt-2 space-y-2">
                    {sub.documents
                      .filter((d) => d.extractedData)
                      .map((d) => (
                        <div
                          key={d.id}
                          className="rounded-lg bg-white p-3 text-xs text-slate-600"
                        >
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="font-medium">Policy</span>
                            <span>{d.extractedData!.policyNumber ?? "—"}</span>
                            <span className="font-medium">Carrier</span>
                            <span>{d.extractedData!.carrier ?? "—"}</span>
                            <span className="font-medium">Effective</span>
                            <span>{d.extractedData!.effectiveDate ?? "—"}</span>
                            <span className="font-medium">Expiration</span>
                            <span>{d.extractedData!.expirationDate ?? "—"}</span>
                            <span className="font-medium">Coverage</span>
                            <span>
                              {d.extractedData!.coverageTypes.join(", ") || "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
