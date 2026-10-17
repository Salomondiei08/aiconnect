import { describe, expect, it } from "vitest";
import { baseUsername, passwordSchema } from "./validation";
import { mergeLines, SaleError } from "./sales-lines";
import { formatXof } from "./utils";

describe("RG3 mot de passe", () => {
  it.each(["abc12345", "ABCDEFGH1", "Abcdefgh!", "Ab1!"])("refuse %s", (p) => expect(passwordSchema.safeParse(p).success).toBe(false));
  it("accepte un mot de passe complet", () => expect(passwordSchema.safeParse("Erp!2026demo").success).toBe(true));
});

describe("RG2 nom d'utilisateur", () => {
  it("part du prénom sans accents ni espaces", () => expect(baseUsername("Aïcha Marie")).toBe("aichamarie"));
  it("complète un prénom trop court", () => expect(baseUsername("Al")).toBe("aluser"));
});

describe("panier", () => {
  it("regroupe les lignes d'un même produit", () => {
    expect(mergeLines([{ productId: "a", qty: 1 }, { productId: "a", qty: 2 }, { productId: "b", qty: 1 }])).toEqual([
      { productId: "a", qty: 3 },
      { productId: "b", qty: 1 },
    ]);
  });
  it.each([0, -1, 1.5])("refuse la quantité %s", (qty) => expect(() => mergeLines([{ productId: "a", qty }])).toThrow(SaleError));
});

describe("montants", () => {
  it("formate en FCFA avec séparateur de milliers", () => {
    expect(formatXof(3000)).toBe("3 000 FCFA");
    expect(formatXof(0)).toBe("0 FCFA");
    expect(formatXof(1234567)).toBe("1 234 567 FCFA");
  });
});
