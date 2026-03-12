"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Organization = {
  id: string;
  name: string;
  _count: { subcontractors: number };
};

type ComplianceStatus = "compliant" | "non_compliant" | "pending" | "unknown";

type Coverage = {
  id: string;
  coverageType: string;
  expirationDate: string | null;
  isExpired: boolean;
  isCompliant: boolean;
};

type Document = {
  id: string;
  documentType: string;
  status: string;
  createdAt: string;
  coverages: Coverage[];
};

type Subcontractor = {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  documents: Document[];
  complianceStatus: ComplianceStatus;
};

export default function Home() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [uploadSubcontractorId, setUploadSubcontractorId] = useState<string>("");
  const [newOrgName, setNewOrgName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubEmail, setNewSubEmail] = useState("");
  const [newSubPhone, setNewSubPhone] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState("coi");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const counts = useMemo(() => {
    return subcontractors.reduce(
      (acc, sub) => {
        acc.total += 1;
        if (sub.complianceStatus === "compliant") acc.compliant += 1;
        if (sub.complianceStatus === "non_compliant") acc.nonCompliant += 1;
        if (sub.complianceStatus === "pending") acc.pending += 1;
        if (sub.complianceStatus === "unknown") acc.unknown += 1;
        return acc;
      },
      { total: 0, compliant: 0, nonCompliant: 0, pending: 0, unknown: 0 }
    );
  }, [subcontractors]);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/organizations");
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Failed to load organizations");

      const orgs = (payload.data as Organization[]) ?? [];
      setOrganizations(orgs);
      setSelectedOrgId((current) => current || orgs[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubcontractors = useCallback(async (orgId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/subcontractors?organizationId=${orgId}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Failed to load subcontractors");

      setSubcontractors((payload.data as Subcontractor[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (!selectedOrgId) {
      setSubcontractors([]);
      return;
    }
    void loadSubcontractors(selectedOrgId);
  }, [loadSubcontractors, selectedOrgId]);

  async function createOrganization(event: FormEvent) {
    event.preventDefault();
    if (!newOrgName.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Could not create organization");

      setNewOrgName("");
      await loadOrganizations();
      const created = payload.data as Organization;
      setSelectedOrgId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  async function createSubcontractor(event: FormEvent) {
    event.preventDefault();
    if (!selectedOrgId || !newSubName.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/subcontractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubName.trim(),
          contactEmail: newSubEmail.trim() || undefined,
          contactPhone: newSubPhone.trim() || undefined,
          organizationId: selectedOrgId,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Could not create subcontractor");

      setNewSubName("");
      setNewSubEmail("");
      setNewSubPhone("");
      await loadSubcontractors(selectedOrgId);
      await loadOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument(event: FormEvent) {
    event.preventDefault();
    if (!uploadSubcontractorId || !uploadFile) return;
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", uploadFile);
      formData.set("documentType", uploadDocumentType);

      const res = await fetch(
        `/api/subcontractors/${uploadSubcontractorId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Upload failed");

      setUploadFile(null);
      await loadSubcontractors(selectedOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 text-slate-900 md:px-10">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-6 rounded-3xl bg-[var(--card)]/95 p-6 shadow-2xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            SubTracker Command Center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Certificate Compliance at a Glance
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
            Monitor subcontractor COI status, create records, and trigger document extraction from one
            place.
          </p>
          {error ? (
            <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800">
              {error}
            </p>
          ) : null}
        </header>

        <section className="mb-6 grid gap-3 md:grid-cols-5">
          <StatCard label="Total Subs" value={counts.total} tone="text-slate-900" />
          <StatCard label="Compliant" value={counts.compliant} tone="text-[var(--ok)]" />
          <StatCard label="Non-compliant" value={counts.nonCompliant} tone="text-[var(--bad)]" />
          <StatCard label="Pending" value={counts.pending} tone="text-[var(--warn)]" />
          <StatCard label="Unknown" value={counts.unknown} tone="text-[var(--muted)]" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl bg-[var(--card)] p-5 shadow-xl shadow-black/10">
            <h2 className="text-lg font-semibold">Organizations</h2>
            <form className="mt-4 flex gap-2" onSubmit={createOrganization}>
              <input
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="New organization name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Add
              </button>
            </form>
            <div className="mt-4 grid gap-2">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`rounded-xl border px-3 py-2 text-left transition ${
                    selectedOrgId === org.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-400"
                  }`}
                >
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs opacity-80">
                    {org._count.subcontractors} subcontractor{org._count.subcontractors === 1 ? "" : "s"}
                  </p>
                </button>
              ))}
              {!loading && organizations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-sm text-[var(--muted)]">
                  No organizations yet. Create one to start onboarding subcontractors.
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-3xl bg-[var(--card)] p-5 shadow-xl shadow-black/10">
            <h2 className="text-lg font-semibold">Add Subcontractor</h2>
            <form className="mt-4 grid gap-2" onSubmit={createSubcontractor}>
              <input
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="Company name"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              />
              <input
                value={newSubEmail}
                onChange={(e) => setNewSubEmail(e.target.value)}
                placeholder="Contact email (optional)"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              />
              <input
                value={newSubPhone}
                onChange={(e) => setNewSubPhone(e.target.value)}
                placeholder="Contact phone (optional)"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              />
              <button
                type="submit"
                disabled={!selectedOrgId || saving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Create Subcontractor
              </button>
            </form>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              Upload COI Document
            </h3>
            <form className="mt-3 grid gap-2" onSubmit={uploadDocument}>
              <select
                value={uploadSubcontractorId}
                onChange={(e) => setUploadSubcontractorId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              >
                <option value="">Select subcontractor</option>
                {subcontractors.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <select
                value={uploadDocumentType}
                onChange={(e) => setUploadDocumentType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              >
                <option value="coi">COI</option>
                <option value="endorsement">Endorsement</option>
                <option value="other">Other</option>
              </select>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,application/pdf,image/png,image/jpeg,image/tiff"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium"
              />
              <button
                type="submit"
                disabled={!uploadSubcontractorId || !uploadFile || saving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Upload Document
              </button>
            </form>
          </article>
        </section>

        <section className="mt-6 rounded-3xl bg-[var(--card)] p-5 shadow-xl shadow-black/10">
          <h2 className="text-lg font-semibold">Subcontractors</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Latest Expiration</th>
                </tr>
              </thead>
              <tbody>
                {subcontractors.map((sub) => {
                  const latestExpiration = sub.documents
                    .flatMap((doc) => doc.coverages)
                    .map((coverage) => coverage.expirationDate)
                    .filter((date): date is string => Boolean(date))
                    .sort()
                    .at(-1);

                  return (
                    <tr key={sub.id} className="border-t border-slate-200 bg-white">
                      <td className="px-4 py-3 font-medium">{sub.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {sub.contactEmail || sub.contactPhone || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <CompliancePill status={sub.complianceStatus} />
                      </td>
                      <td className="px-4 py-3">{sub.documents.length}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {latestExpiration
                          ? new Date(latestExpiration).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && subcontractors.length === 0 ? (
              <p className="border-t border-slate-200 bg-white px-4 py-8 text-center text-sm text-[var(--muted)]">
                No subcontractors in this organization yet.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="rounded-2xl bg-[var(--card)] px-4 py-3 shadow-lg shadow-black/10">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </article>
  );
}

function CompliancePill({ status }: { status: ComplianceStatus }) {
  const styles: Record<ComplianceStatus, string> = {
    compliant: "bg-emerald-100 text-emerald-800",
    non_compliant: "bg-rose-100 text-rose-800",
    pending: "bg-amber-100 text-amber-800",
    unknown: "bg-slate-200 text-slate-700",
  };
  const labels: Record<ComplianceStatus, string> = {
    compliant: "Compliant",
    non_compliant: "Non-compliant",
    pending: "Pending",
    unknown: "Unknown",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
