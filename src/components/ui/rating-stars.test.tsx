import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RatingStars } from "@/components/ui/rating-stars";

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

describe("RatingStars", () => {
  it("permet de choisir une note", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RatingStars value={3} onChange={onChange} />);
    const fifth = screen.getByLabelText("5 étoiles");
    await user.click(fifth);
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
