import { describe, expect, it } from "vitest";
import {
  botInstallPermissionBits,
  buildBotInviteUrl,
  evaluatePermission,
  isStaffRoleName,
  normalizePermissionName,
  permissionBits,
  STAFF_EXTRA_PERMISSIONS,
} from "../src/permissions.js";
import { normalizeBlueprint } from "../src/blueprint.js";

describe("permission whitelist", () => {
  it("normalises model output variants", () => {
    expect(normalizePermissionName("View Channel")).toBe("VIEW_CHANNEL");
    expect(normalizePermissionName("viewChannel")).toBe("VIEW_CHANNEL");
    expect(normalizePermissionName("SEND_MESSAGES")).toBe("SEND_MESSAGES");
    expect(normalizePermissionName("nonsense")).toBeNull();
  });

  it("never allows administrator, manage guild or webhooks", () => {
    for (const permission of ["Administrator", "Manage Guild", "Manage Webhooks"]) {
      expect(evaluatePermission(permission, true).allowed).toBe(false);
      expect(evaluatePermission(permission, false).allowed).toBe(false);
    }
  });

  it("reserves ban and mention permissions for staff roles", () => {
    expect(evaluatePermission("BanMembers", false).allowed).toBe(false);
    expect(evaluatePermission("MentionEveryone", false).allowed).toBe(false);
    expect(evaluatePermission("BanMembers", true).allowed).toBe(true);
    expect(evaluatePermission("MentionEveryone", true).allowed).toBe(true);
  });

  it("recognises czech owner and staff role names", () => {
    for (const name of ["Majitel", "Vlastník", "Zakladatel", "Šéf", "Ředitel", "Owner", "Founder"]) {
      expect(isStaffRoleName(name)).toBe(true);
    }
    for (const name of ["Hráč", "Stavitel", "Člen", "Fanoušek"]) {
      expect(isStaffRoleName(name)).toBe(false);
    }
  });

  it("keeps staff permissions for a czech owner role", () => {
    const { blueprint, removedPermissions } = normalizeBlueprint({
      serverName: "X",
      categories: [{ name: "A", channels: [{ name: "chat", type: "text" }] }],
      roles: [
        { name: "Majitel", permissions: ["ManageMessages", "KickMembers", "BanMembers"] },
        { name: "Hráč", permissions: ["ViewChannel", "KickMembers"] },
      ],
      welcome: { channel: "chat", message: "Ahoj" },
      rules: [],
    });
    expect(blueprint.roles[0]?.permissions).toEqual([
      "MANAGE_MESSAGES",
      "KICK_MEMBERS",
      "BAN_MEMBERS",
    ]);
    expect(blueprint.roles[1]?.permissions).toEqual(["VIEW_CHANNEL"]);
    expect(removedPermissions).toEqual([{ role: "Hráč", permission: "KICK_MEMBERS" }]);
  });

  it("strips dangerous permissions from a blueprint and reports them", () => {
    const { blueprint, removedPermissions } = normalizeBlueprint({
      serverName: "X",
      categories: [{ name: "A", channels: [{ name: "chat", type: "text" }] }],
      roles: [
        {
          name: "Člen",
          permissions: ["Administrator", "ViewChannel", "BanMembers"],
        },
        {
          name: "Moderátor",
          permissions: ["Administrator", "ManageGuild", "BanMembers"],
        },
      ],
      welcome: { channel: "chat", message: "Ahoj" },
      rules: [],
    });
    expect(blueprint.roles[0]?.permissions).toEqual(["VIEW_CHANNEL"]);
    expect(blueprint.roles[1]?.permissions).toEqual(["BAN_MEMBERS"]);
    expect(removedPermissions.map((entry) => entry.permission)).toEqual(
      expect.arrayContaining(["ADMINISTRATOR", "MANAGE_GUILD", "BAN_MEMBERS"]),
    );
  });

  it("requests every staff permission on the install URL", () => {
    expect(permissionBits(["VIEW_CHANNEL", "SEND_MESSAGES"])).toBe(3072n);
    expect(botInstallPermissionBits()).toBe("12121904131222");
    // The bot must be allowed to grant the same permissions it assigns to staff roles.
    const installBits = BigInt(botInstallPermissionBits());
    expect(installBits & permissionBits(STAFF_EXTRA_PERMISSIONS)).toBe(
      permissionBits(STAFF_EXTRA_PERMISSIONS),
    );
    const url = new URL(buildBotInviteUrl("123", "456"));
    expect(url.searchParams.get("guild_id")).toBe("456");
    expect(url.searchParams.get("scope")).toContain("bot");
  });
});
