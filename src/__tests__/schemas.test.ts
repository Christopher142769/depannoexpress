import { describe, it, expect } from "vitest";
import { z } from "zod";

const CURRENCIES = ["XOF", "XAF", "NGN", "EUR", "USD"] as const;
const CATEGORIES = ["pneu", "piece", "accessoire"] as const;

const pricingSchema = z.object({
  tradeId: z.string().uuid(),
  basePrice: z.number().min(1).max(5_000_000),
  pricePerKm: z.number().min(0).max(100_000).optional(),
  currency: z.enum(CURRENCIES).optional(),
});

const tradeCreateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  icon: z.string().max(50).optional(),
  imageUrl: z.string().url().max(500).optional(),
});

const tradeUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  icon: z.string().max(50).optional(),
  imageUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().optional(),
});

const productCreateSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  category: z.enum(CATEGORIES),
  price: z.number().min(0).max(50_000_000),
  stock: z.number().int().min(0).max(100_000),
  imageUrl: z.string().url().max(500).optional(),
  vendorId: z.string().uuid().optional(),
});

describe("Pricing schema validation", () => {
  const UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid pricing data", () => {
    expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: 5000 }).success).toBe(true);
  });

  it("accepts valid pricing with currency", () => {
    expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: 5000, pricePerKm: 500, currency: "XOF" }).success).toBe(true);
  });

  it("rejects invalid currency", () => {
    expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: 5000, currency: "BITCOIN" }).success).toBe(false);
  });

  it("rejects basePrice of 0", () => {
    expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: 0 }).success).toBe(false);
  });

  it("rejects negative basePrice", () => {
    expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: -100 }).success).toBe(false);
  });

  it("rejects basePrice exceeding max", () => {
    expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: 6_000_000 }).success).toBe(false);
  });

  it("rejects negative pricePerKm", () => {
    expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: 5000, pricePerKm: -1 }).success).toBe(false);
  });

  it("rejects invalid tradeId UUID", () => {
    expect(pricingSchema.safeParse({ tradeId: "not-a-uuid", basePrice: 5000 }).success).toBe(false);
  });

  it("rejects missing tradeId", () => {
    expect(pricingSchema.safeParse({ basePrice: 5000 }).success).toBe(false);
  });

  it("accepts all valid currencies", () => {
    for (const c of CURRENCIES) {
      expect(pricingSchema.safeParse({ tradeId: UUID, basePrice: 5000, currency: c }).success).toBe(true);
    }
  });
});

describe("Trade create schema validation", () => {
  it("accepts valid trade data", () => {
    expect(tradeCreateSchema.safeParse({ name: "Mécanicien" }).success).toBe(true);
  });

  it("accepts trade with slug", () => {
    expect(tradeCreateSchema.safeParse({ name: "Mécano", slug: "mecano" }).success).toBe(true);
  });

  it("accepts trade with imageUrl", () => {
    expect(tradeCreateSchema.safeParse({ name: "Test", imageUrl: "https://example.com/img.png" }).success).toBe(true);
  });

  it("rejects name too short", () => {
    expect(tradeCreateSchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("rejects invalid slug characters", () => {
    expect(tradeCreateSchema.safeParse({ name: "Test", slug: "Méca No!" }).success).toBe(false);
  });

  it("accepts valid slug with hyphens", () => {
    expect(tradeCreateSchema.safeParse({ name: "Test", slug: "mon-metier-2" }).success).toBe(true);
  });

  it("rejects invalid imageUrl", () => {
    expect(tradeCreateSchema.safeParse({ name: "Test", imageUrl: "not-a-url" }).success).toBe(false);
  });
});

describe("Trade update schema validation", () => {
  const UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid update with id", () => {
    expect(tradeUpdateSchema.safeParse({ id: UUID }).success).toBe(true);
  });

  it("rejects missing id", () => {
    expect(tradeUpdateSchema.safeParse({ name: "Test" }).success).toBe(false);
  });

  it("accepts partial updates", () => {
    expect(tradeUpdateSchema.safeParse({ id: UUID, isActive: true }).success).toBe(true);
  });

  it("rejects invalid isActive type", () => {
    expect(tradeUpdateSchema.safeParse({ id: UUID, isActive: "yes" }).success).toBe(false);
  });
});

describe("Product create schema validation", () => {
  const UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid product data", () => {
    expect(productCreateSchema.safeParse({
      name: "Pneu 185/65 R15",
      description: "Pneu tourisme toutes saisons",
      category: "pneu",
      price: 35000,
      stock: 10,
    }).success).toBe(true);
  });

  it("accepts product with vendorId", () => {
    expect(productCreateSchema.safeParse({
      name: "Test",
      description: "Description test",
      category: "piece",
      price: 1000,
      stock: 5,
      vendorId: UUID,
    }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(productCreateSchema.safeParse({
      name: "",
      description: "Desc",
      category: "pneu",
      price: 100,
      stock: 1,
    }).success).toBe(false);
  });

  it("rejects short description", () => {
    expect(productCreateSchema.safeParse({
      name: "Test",
      description: "Hi",
      category: "pneu",
      price: 100,
      stock: 1,
    }).success).toBe(false);
  });

  it("rejects invalid category", () => {
    expect(productCreateSchema.safeParse({
      name: "Test",
      description: "Long enough description",
      category: "electrique",
      price: 100,
      stock: 1,
    }).success).toBe(false);
  });

  it("accepts all valid categories", () => {
    for (const c of CATEGORIES) {
      expect(productCreateSchema.safeParse({
        name: "Test",
        description: "Long enough description",
        category: c,
        price: 100,
        stock: 1,
      }).success).toBe(true);
    }
  });

  it("rejects negative stock", () => {
    expect(productCreateSchema.safeParse({
      name: "Test",
      description: "Long enough description",
      category: "pneu",
      price: 100,
      stock: -1,
    }).success).toBe(false);
  });

  it("rejects non-integer stock", () => {
    expect(productCreateSchema.safeParse({
      name: "Test",
      description: "Long enough description",
      category: "pneu",
      price: 100,
      stock: 1.5,
    }).success).toBe(false);
  });

  it("rejects negative price", () => {
    expect(productCreateSchema.safeParse({
      name: "Test",
      description: "Long enough description",
      category: "pneu",
      price: -10,
      stock: 1,
    }).success).toBe(false);
  });

  it("accepts price of 0 (free)", () => {
    expect(productCreateSchema.safeParse({
      name: "Test",
      description: "Long enough description",
      category: "pneu",
      price: 0,
      stock: 1,
    }).success).toBe(true);
  });
});
