import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: {
      button: React.forwardRef(function MotionButton(
        props: React.ButtonHTMLAttributes<HTMLButtonElement>,
        ref: React.Ref<HTMLButtonElement>
      ) {
        return React.createElement("button", { ...props, ref });
      }),
    },
  };
});

describe("Button", () => {
  it("rend le label et réagit au clic", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continuer</Button>);
    expect(screen.getByRole("button", { name: /continuer/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
