import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OTPInput } from "@/components/ui/otp-input";

describe("OTPInput", () => {
  it("affiche 6 cases et propage la saisie", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OTPInput value="" onChange={onChange} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
    await user.type(inputs[0], "1");
    expect(onChange).toHaveBeenCalled();
  });

  it("affiche une erreur", () => {
    render(<OTPInput value="" onChange={() => {}} error="Code invalide" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Code invalide");
  });
});
