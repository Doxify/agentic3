"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InviteForm } from "@/components/subcontractors/InviteForm";

export default function InvitePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/subcontractors"
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Subcontractors
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          Invite Subcontractor
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Send an onboarding invitation and optionally pre-attach compliance documents.
        </p>
      </div>

      <InviteForm />
    </div>
  );
}
