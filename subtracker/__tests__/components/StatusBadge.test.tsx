import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/StatusBadge";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("renders the correct label for compliant status", () => {
    const { getByText } = render(<StatusBadge status="compliant" />);
    expect(getByText("Compliant")).toBeInTheDocument();
  });

  it("renders the correct label for non_compliant status", () => {
    const { getByText } = render(<StatusBadge status="non_compliant" />);
    expect(getByText("Non-Compliant")).toBeInTheDocument();
  });

  it("renders the correct label for expiring_soon status", () => {
    const { getByText } = render(<StatusBadge status="expiring_soon" />);
    expect(getByText("Expiring Soon")).toBeInTheDocument();
  });

  it("renders the correct label for pending status", () => {
    const { getByText } = render(<StatusBadge status="pending" />);
    expect(getByText("Pending")).toBeInTheDocument();
  });

  it("has an accessible role and label", () => {
    const { container } = render(<StatusBadge status="compliant" />);
    const badge = container.querySelector('[role="status"]');
    expect(badge).toHaveAttribute("aria-label", "Compliance status: Compliant");
  });

  it("supports small size variant", () => {
    const { container } = render(<StatusBadge status="compliant" size="sm" />);
    const badge = container.querySelector('[role="status"]');
    expect(badge?.className).toContain("text-xs");
  });
});
