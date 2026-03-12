import type { Subcontractor, ComplianceSummary } from "@/types";

export const mockSubcontractors: Subcontractor[] = [
  {
    id: "sub-1",
    name: "John Rivera",
    email: "john@riveraelectric.com",
    company: "Rivera Electric LLC",
    status: "compliant",
    invitedAt: "2026-01-15T10:00:00Z",
    onboardedAt: "2026-01-18T14:30:00Z",
    documents: [
      {
        id: "doc-1",
        subcontractorId: "sub-1",
        type: "coi",
        fileName: "rivera_coi_2026.pdf",
        status: "valid",
        uploadedAt: "2026-01-18T14:30:00Z",
        expiresAt: "2027-01-18T00:00:00Z",
        extractedData: {
          policyNumber: "GL-2026-44821",
          carrier: "Hartford Insurance",
          effectiveDate: "2026-01-15",
          expirationDate: "2027-01-15",
          coverageTypes: ["General Liability", "Workers Comp"],
          limits: { generalAggregate: "$2,000,000", eachOccurrence: "$1,000,000" },
        },
      },
      {
        id: "doc-2",
        subcontractorId: "sub-1",
        type: "w9",
        fileName: "rivera_w9.pdf",
        status: "valid",
        uploadedAt: "2026-01-18T14:35:00Z",
        expiresAt: null,
        extractedData: null,
      },
    ],
  },
  {
    id: "sub-2",
    name: "Sarah Chen",
    email: "sarah@chenmechanical.com",
    company: "Chen Mechanical Services",
    status: "expiring_soon",
    invitedAt: "2026-02-01T09:00:00Z",
    onboardedAt: "2026-02-03T11:00:00Z",
    documents: [
      {
        id: "doc-3",
        subcontractorId: "sub-2",
        type: "coi",
        fileName: "chen_mech_coi.pdf",
        status: "expiring",
        uploadedAt: "2026-02-03T11:00:00Z",
        expiresAt: "2026-04-01T00:00:00Z",
        extractedData: {
          policyNumber: "CGL-889912",
          carrier: "State Farm",
          effectiveDate: "2025-04-01",
          expirationDate: "2026-04-01",
          coverageTypes: ["General Liability"],
          limits: { generalAggregate: "$1,000,000", eachOccurrence: "$500,000" },
        },
      },
    ],
  },
  {
    id: "sub-3",
    name: "Mike Thompson",
    email: "mike@thompsonroofing.net",
    company: "Thompson Roofing Co",
    status: "non_compliant",
    invitedAt: "2026-02-10T08:00:00Z",
    onboardedAt: "2026-02-12T16:00:00Z",
    documents: [
      {
        id: "doc-4",
        subcontractorId: "sub-3",
        type: "coi",
        fileName: "thompson_coi_expired.pdf",
        status: "expired",
        uploadedAt: "2026-02-12T16:00:00Z",
        expiresAt: "2026-02-28T00:00:00Z",
        extractedData: {
          policyNumber: "POL-33210",
          carrier: "Zurich",
          effectiveDate: "2025-03-01",
          expirationDate: "2026-02-28",
          coverageTypes: ["General Liability", "Auto"],
          limits: { generalAggregate: "$2,000,000", eachOccurrence: "$1,000,000" },
        },
      },
    ],
  },
  {
    id: "sub-4",
    name: "Lisa Park",
    email: "lisa@parkplumbing.com",
    company: "Park Plumbing Inc",
    status: "pending",
    invitedAt: "2026-03-08T10:00:00Z",
    onboardedAt: null,
    documents: [],
  },
  {
    id: "sub-5",
    name: "David Okafor",
    email: "david@okaforlandscaping.com",
    company: "Okafor Landscaping",
    status: "compliant",
    invitedAt: "2026-01-20T12:00:00Z",
    onboardedAt: "2026-01-22T09:00:00Z",
    documents: [
      {
        id: "doc-5",
        subcontractorId: "sub-5",
        type: "coi",
        fileName: "okafor_coi_2026.pdf",
        status: "valid",
        uploadedAt: "2026-01-22T09:00:00Z",
        expiresAt: "2027-06-15T00:00:00Z",
        extractedData: {
          policyNumber: "INS-77443",
          carrier: "Progressive",
          effectiveDate: "2026-06-15",
          expirationDate: "2027-06-15",
          coverageTypes: ["General Liability", "Workers Comp", "Auto"],
          limits: { generalAggregate: "$3,000,000", eachOccurrence: "$1,000,000" },
        },
      },
    ],
  },
];

export function getMockComplianceSummary(): ComplianceSummary {
  return mockSubcontractors.reduce(
    (acc, sub) => {
      acc.total++;
      if (sub.status === "compliant") acc.compliant++;
      else if (sub.status === "expiring_soon") acc.expiringSoon++;
      else if (sub.status === "non_compliant") acc.nonCompliant++;
      else acc.pending++;
      return acc;
    },
    { total: 0, compliant: 0, expiringSoon: 0, nonCompliant: 0, pending: 0 },
  );
}
