/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";

import { BetaHeader } from "@/components/beta/BetaHeader";

describe("BetaHeader logo link", () => {
  it("is focusable and navigates home on click", () => {
    window.history.pushState({}, "", "/beta");
    render(
      <BrowserRouter>
        <BetaHeader />
      </BrowserRouter>,
    );

    const link = screen.getByRole("link", { name: "Página inicial" });
    link.focus();
    expect(link).toHaveFocus();

    fireEvent.click(link);
    expect(window.location.pathname).toBe("/");
  });
});
