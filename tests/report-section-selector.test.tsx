/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { mockReportData } from "@/lib/mock-data/report-sample";

// Mock useAuth to avoid context requirements if needed
vi.mock("@/hooks/useAuth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuth: () => ({
    user: null,
    profile: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    hasRole: vi.fn(),
    isAdmin: false,
  }),
}));

describe("Report section selector", () => {
  it("hides ROI section when unchecked", async () => {
    render(<ReportGenerator mockData={mockReportData} />);

    // uncheck ROI
    const roiCheckbox = screen.getByLabelText("ROI");
    fireEvent.click(roiCheckbox);

    // fill required fields
    fireEvent.change(screen.getByLabelText("Organização *"), {
      target: { value: "Org" },
    });
    fireEvent.change(screen.getByLabelText("Analista Responsável *"), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByLabelText("Período - Início *"), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Período - Fim *"), {
      target: { value: "2024-01-31" },
    });

    // generate report
    fireEvent.click(screen.getByRole("button", { name: /Gerar Relatório/i }));

    // wait for preview
    expect(
      await screen.findByText("Relatório Conclusivo de Análise"),
    ).toBeInTheDocument();

    // ROI section should not be in document
    expect(screen.queryByText("ROI Estimado")).not.toBeInTheDocument();
  });
});
