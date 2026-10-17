import { describe, expect, it } from "vitest";
import { filterUsers, parseColumns, sortUsers, toCsv } from "./user-list";

const rows = [
  { username: "kofi", name: "M Kofi Zed", role: "Caissier", email: "kofi@x.test" },
  { username: "awa", name: "Mme Awa Koné", role: "Admin", email: "awa@x.test" },
];

describe("liste des utilisateurs", () => {
  it("cherche sans tenir compte de la casse, sur les colonnes visibles seulement", () => {
    expect(filterUsers(rows, "ZED", ["name"])).toHaveLength(1);
    expect(filterUsers(rows, "caissier", ["username", "email"])).toHaveLength(0);
  });
  it("trie dans les deux sens", () => {
    expect(sortUsers(rows, "username", "asc").map((r) => r.username)).toEqual(["awa", "kofi"]);
    expect(sortUsers(rows, "username", "desc").map((r) => r.username)).toEqual(["kofi", "awa"]);
  });
  it("garde l'ordre des colonnes et ignore les inconnues", () => {
    expect(parseColumns("email,username,action")).toEqual(["username", "email"]);
    expect(parseColumns(null)).toHaveLength(4);
  });
  it("produit un CSV sans colonne Action et neutralise les formules", () => {
    const csv = toCsv([{ ...rows[0], name: "=HYPERLINK(1)" }], ["username", "name"]);
    expect(csv.startsWith("﻿Nom d'utilisateur;Nom\r\n")).toBe(true);
    expect(csv).toContain("kofi;'=HYPERLINK(1)");
    expect(csv).not.toContain("Action");
  });
});
