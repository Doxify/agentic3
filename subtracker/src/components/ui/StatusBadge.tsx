"use client";

import type { ComplianceStatus } from "@/types";
import { complianceColor, complianceLabel } from "@/lib/utils";

interface StatusBadgeProps {
  status: ComplianceStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colors = complianceColor(status);
  const label = complianceLabel(status);
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses}`}
      role="status"
      aria-label={`Compliance status: ${label}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
