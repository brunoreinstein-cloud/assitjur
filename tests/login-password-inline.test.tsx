/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EmailPasswordForm } from "@/components/auth/EmailPasswordForm";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

describe("EmailPasswordForm password validation", () => {
  it("shows inline password error with aria attributes", async () => {
    render(<EmailPasswordForm mode="signin" onModeChange={() => {}} />);

    await userEvent.type(screen.getByLabelText("E-mail"), "teste@exemplo.com");
    const passwordInput = screen.getByLabelText("Senha");
    await userEvent.type(passwordInput, "123");
    const submitButton = screen.getByRole("button", {
      name: /Acessar área segura/i,
    });
    await userEvent.click(submitButton);

    const error = await screen.findByText("Mínimo de 6 caracteres");
    expect(error).toHaveAttribute("id", "password-help");
    expect(passwordInput).toHaveAttribute("aria-describedby", "password-help");
    expect(screen.queryByText("E-mail inválido.")).not.toBeInTheDocument();
  });
});
