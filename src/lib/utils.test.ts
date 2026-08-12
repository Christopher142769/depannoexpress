import { describe, expect, it } from "vitest";
import { cn, formatFCFA } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";

describe("formatFCFA", () => {
  it("formate un montant en XOF", () => {
    const result = formatFCFA(15000);
    expect(result).toMatch(/15/);
    expect(result.toUpperCase()).toMatch(/F|XOF|CFA/);
  });
});

describe("cn", () => {
  it("fusionne les classes sans conflits", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toContain("text-sm");
  });
});

describe("sanitizeText", () => {
  it("retire les balises et scripts triviaux", () => {
    expect(sanitizeText("<script>alert(1)</script>hello")).toBe("scriptalert(1)/scripthello");
    expect(sanitizeText("javascript:alert(1)")).not.toMatch(/javascript\s*:/i);
  });
});
