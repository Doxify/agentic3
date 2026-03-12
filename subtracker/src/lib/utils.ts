import type { ComplianceStatus, DocumentStatus } from "@/types";

export function complianceColor(status: ComplianceStatus) {
  const map: Record<ComplianceStatus, { bg: string; text: string; dot: string }> = {
    compliant: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    expiring_soon: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    non_compliant: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    pending: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  };
  return map[status];
}

export function documentStatusColor(status: DocumentStatus) {
  const map: Record<DocumentStatus, { bg: string; text: string }> = {
    valid: { bg: "bg-emerald-50", text: "text-emerald-700" },
    expiring: { bg: "bg-amber-50", text: "text-amber-700" },
    expired: { bg: "bg-red-50", text: "text-red-700" },
    pending_review: { bg: "bg-blue-50", text: "text-blue-700" },
    missing: { bg: "bg-slate-100", text: "text-slate-500" },
  };
  return map[status];
}

export function complianceLabel(status: ComplianceStatus): string {
  const map: Record<ComplianceStatus, string> = {
    compliant: "Compliant",
    expiring_soon: "Expiring Soon",
    non_compliant: "Non-Compliant",
    pending: "Pending",
  };
  return map[status];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
