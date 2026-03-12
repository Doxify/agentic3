"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { SubcontractorList } from "@/components/subcontractors/SubcontractorList";
import { fetchSubcontractors } from "@/lib/api";
import type { Subcontractor } from "@/types";

export default function SubcontractorsPage() {
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubcontractors().then((data) => {
      setSubs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subcontractors</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your subcontractor roster and compliance documents.
          </p>
        </div>
        <Link
          href="/subcontractors/invite"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Invite
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <SubcontractorList subcontractors={subs} />
      )}
    </div>
  );
}
