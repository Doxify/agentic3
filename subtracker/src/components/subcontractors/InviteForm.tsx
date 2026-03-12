"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
import { inviteSubcontractor } from "@/lib/api";
import type { SubcontractorInvite } from "@/types";

type FormState = "idle" | "submitting" | "success" | "error";

export function InviteForm() {
  const [form, setForm] = useState<SubcontractorInvite>({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = form.name.trim() && form.email.trim() && form.company.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setState("submitting");
    try {
      await inviteSubcontractor(form);
      setState("success");
      setForm({ name: "", email: "", company: "", message: "" });
    } catch {
      setState("error");
      setErrorMsg("Failed to send invitation. Please try again.");
    }
  };

  const update = (field: keyof SubcontractorInvite, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Invite Subcontractor
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Send an invitation to onboard a new subcontractor and collect compliance documents.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="John Rivera"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="john@company.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="company" className="block text-sm font-medium text-slate-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="company"
              type="text"
              required
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Rivera Electric LLC"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="message" className="block text-sm font-medium text-slate-700">
              Custom Message
            </label>
            <textarea
              id="message"
              rows={3}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Optional message to include in the invitation email..."
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Attach Documents (optional)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Pre-attach COI or compliance documents on behalf of the subcontractor.
        </p>
        <div className="mt-4">
          <FileUpload onFilesSelected={setFiles} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {state === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700"
            role="alert"
          >
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
            Invitation sent successfully!
          </motion.div>
        ) : state === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            {errorMsg}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={!canSubmit || state === "submitting"}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {state === "submitting" ? "Sending..." : "Send Invitation"}
        </button>
      </div>
    </form>
  );
}
