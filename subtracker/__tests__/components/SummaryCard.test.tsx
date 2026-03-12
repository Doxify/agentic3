import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryCard } from "@/components/ui/SummaryCard";

describe("SummaryCard", () => {
  it("renders label and value", () => {
    render(<SummaryCard label="Compliant" value={42} color="emerald" />);
    expect(screen.getByText("Compliant")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("applies correct color classes", () => {
    const { container } = render(
      <SummaryCard label="Test" value={0} color="red" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("red");
  });
});
