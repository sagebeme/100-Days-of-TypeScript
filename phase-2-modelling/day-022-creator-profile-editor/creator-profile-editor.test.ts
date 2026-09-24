import { describe, it, expect } from "vitest";
import { updateProfile, toPublicProfile, type CreatorProfile, type ProfileUpdate } from "./starter/profile.ts";

const profile: CreatorProfile = {
  id: "u_42",
  handle: "@wanjiru.beats",
  displayName: "Wanjiru",
  bio: "Beats and bugs.",
  followers: 1200,
  createdAt: "2025-03-01",
};

describe("updateProfile", () => {
  it("applies the fields you pass and keeps the rest", () => {
    const updated = updateProfile(profile, { displayName: "Wanjiru K", bio: "Producer." });
    expect(updated).toEqual({ ...profile, displayName: "Wanjiru K", bio: "Producer." });
  });

  it("returns a new object and leaves the original alone", () => {
    const updated = updateProfile(profile, { handle: "@wanjiru" });
    expect(updated).not.toBe(profile);
    expect(profile.handle).toBe("@wanjiru.beats");
  });

  it("does not wipe a field when its update value is undefined", () => {
    expect(updateProfile(profile, { bio: undefined }).bio).toBe("Beats and bugs.");
  });

  it("only lets the editable fields through the type", () => {
    // @ts-expect-error followers is not in ProfileUpdate
    const update: ProfileUpdate = { followers: 5 };
    expect(updateProfile(profile, update).followers).toBe(1200);
  });

  it("ignores fields that aren't editable even when they sneak in at runtime", () => {
    const smuggled = { bio: "New bio", followers: 999_999, id: "u_1" } as unknown as ProfileUpdate;
    const updated = updateProfile(profile, smuggled);
    expect(updated.bio).toBe("New bio");
    expect(updated.followers).toBe(1200);
    expect(updated.id).toBe("u_42");
  });
});

describe("toPublicProfile", () => {
  it("keeps the public fields", () => {
    expect(toPublicProfile(profile)).toEqual({
      handle: "@wanjiru.beats",
      displayName: "Wanjiru",
      bio: "Beats and bugs.",
      followers: 1200,
    });
  });

  it("drops the internal fields, in the type and at runtime", () => {
    const publicProfile = toPublicProfile(profile);
    // @ts-expect-error id is not part of PublicProfile
    publicProfile.id;
    expect("id" in publicProfile).toBe(false);
    expect("createdAt" in publicProfile).toBe(false);
  });
});
