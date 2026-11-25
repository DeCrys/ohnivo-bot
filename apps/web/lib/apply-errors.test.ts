import { describe, expect, it } from "vitest";
import {
  isStaffPermissionFailure,
  parseOmittedStaffPermissions,
  parseReplacementBlockers,
} from "./apply-errors";

describe("parseReplacementBlockers", () => {
  it("recognizes the legacy Czech role hierarchy error", () => {
    expect(
      parseReplacementBlockers(
        "Nahrazení bylo zastaveno před smazáním: 4 rolí je na stejné nebo vyšší pozici než nejvyšší role bota. Povol botovi potřebná oprávnění nebo uprav pozice rolí a potom akci spusť znovu.",
      ),
    ).toEqual([{ kind: "hierarchy", count: 4, names: "" }]);
  });

  it("keeps parsing current replacement errors with role names", () => {
    expect(
      parseReplacementBlockers(
        "Replacement stopped before deleting anything: 2 roles are at or above the bot's highest role (Admin, Moderator). In Discord open Server Settings → Roles and retry.",
      ),
    ).toEqual([{ kind: "hierarchy", count: 2, names: "Admin, Moderator" }]);
  });

  it("does not translate unrelated errors as replacement blockers", () => {
    expect(parseReplacementBlockers("Něco jiného selhalo.")).toBeNull();
  });

  it("recognizes the legacy staff-permission failure and warning details", () => {
    expect(
      isStaffPermissionFailure(
        "Nahrazení bylo zastaveno, protože bot nemůže přidělit některá požadovaná oprávnění staff rolím. Stávající struktura zůstala nedotčená.",
      ),
    ).toBe(true);
    expect(
      parseOmittedStaffPermissions(
        "Vynechána oprávnění staff role, která bot nemá: VIEW_AUDIT_LOG, KICK_MEMBERS. Oprav oprávnění.",
      ),
    ).toEqual(["VIEW_AUDIT_LOG", "KICK_MEMBERS"]);
  });
});
