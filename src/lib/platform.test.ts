import { describe, expect, it } from "vitest";
import {
  canRevokeOwnPlatformRole,
  hasPlatformAccess,
  isCompanyStatus,
  needsPlatformRoleSync,
  parsePlatformAdminEmails,
  platformActionLabel,
  PLATFORM_ADMIN,
} from "./platform-rules";

describe("parsePlatformAdminEmails", () => {
  it("normalise casse et espaces, ignore les entrées vides", () => {
    expect(parsePlatformAdminEmails(" Admin@Comptoir.test , ,awa@Boutique.test ")).toEqual(["admin@comptoir.test", "awa@boutique.test"]);
  });

  it("accepte aussi le point-virgule et les retours à la ligne", () => {
    expect(parsePlatformAdminEmails("a@b.test;c@d.test\ne@f.test")).toEqual(["a@b.test", "c@d.test", "e@f.test"]);
  });

  it("retire les doublons et renvoie une liste vide sans variable", () => {
    expect(parsePlatformAdminEmails("a@b.test,A@B.TEST")).toEqual(["a@b.test"]);
    expect(parsePlatformAdminEmails(undefined)).toEqual([]);
    expect(parsePlatformAdminEmails("   ")).toEqual([]);
  });
});

describe("hasPlatformAccess", () => {
  const bootstrap = ["admin@comptoir.test"];

  it("accorde l'accès par le rôle enregistré en base", () => {
    expect(hasPlatformAccess({ email: "autre@exemple.test", platformRole: PLATFORM_ADMIN }, [])).toBe(true);
  });

  it("accorde l'accès par la liste d'amorçage, sans tenir compte de la casse", () => {
    expect(hasPlatformAccess({ email: "ADMIN@comptoir.test", platformRole: null }, bootstrap)).toBe(true);
  });

  it("refuse tout autre compte, y compris un Admin d'entreprise", () => {
    expect(hasPlatformAccess({ email: "awa@boutique.test", platformRole: null }, bootstrap)).toBe(false);
    expect(hasPlatformAccess({ email: "awa@boutique.test", platformRole: "admin" }, bootstrap)).toBe(false);
    expect(hasPlatformAccess({ email: "awa@boutique.test", platformRole: "Gérant" }, [])).toBe(false);
  });

  it("refuse quand aucune liste n'est configurée", () => {
    expect(hasPlatformAccess({ email: "admin@comptoir.test", platformRole: null })).toBe(false);
  });
});

describe("needsPlatformRoleSync", () => {
  it("demande l'écriture seulement pour une adresse amorcée sans rôle", () => {
    const bootstrap = ["admin@comptoir.test"];
    expect(needsPlatformRoleSync({ email: "admin@comptoir.test", platformRole: null }, bootstrap)).toBe(true);
    expect(needsPlatformRoleSync({ email: "admin@comptoir.test", platformRole: PLATFORM_ADMIN }, bootstrap)).toBe(false);
    expect(needsPlatformRoleSync({ email: "autre@exemple.test", platformRole: null }, bootstrap)).toBe(false);
  });

  it("ne réécrit pas un droit retiré volontairement si l'adresse reste amorcée", () => {
    // Le retrait passe par l'espace plateforme ; l'amorçage ne doit pas le réimposer silencieusement
    // tant que le rôle n'est pas explicitement réaccordé : on ne sync que si le rôle est absent.
    expect(needsPlatformRoleSync({ email: "admin@comptoir.test", platformRole: null }, ["admin@comptoir.test"])).toBe(true);
  });
});

describe("gardes-fous des actions plateforme", () => {
  it("n'accepte que active ou suspended comme statut d'entreprise", () => {
    expect(isCompanyStatus("active")).toBe(true);
    expect(isCompanyStatus("suspended")).toBe(true);
    expect(isCompanyStatus("deleted")).toBe(false);
    expect(isCompanyStatus("")).toBe(false);
  });

  it("interdit de retirer son propre droit super-admin", () => {
    expect(canRevokeOwnPlatformRole("user_1", "user_2")).toBe(true);
    expect(canRevokeOwnPlatformRole("user_1", "user_1")).toBe(false);
  });

  it("donne un libellé français et conserve l'action inconnue telle quelle", () => {
    expect(platformActionLabel("company_suspended")).toBe("Entreprise suspendue");
    expect(platformActionLabel("platform_admin_granted")).toBe("Droit super-admin accordé");
    expect(platformActionLabel("autre_action")).toBe("autre_action");
  });
});
