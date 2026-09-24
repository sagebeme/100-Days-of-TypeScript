export interface CreatorProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  followers: number;
  createdAt: string;
}

export type ProfileUpdate = Partial<Pick<CreatorProfile, "handle" | "displayName" | "bio">>;

export type PublicProfile = Omit<CreatorProfile, "id" | "createdAt">;

export function updateProfile(profile: CreatorProfile, update: ProfileUpdate): CreatorProfile {
  const next: CreatorProfile = { ...profile };
  if (update.handle !== undefined) {
    next.handle = update.handle;
  }
  if (update.displayName !== undefined) {
    next.displayName = update.displayName;
  }
  if (update.bio !== undefined) {
    next.bio = update.bio;
  }
  return next;
}

export function toPublicProfile(profile: CreatorProfile): PublicProfile {
  const { id, createdAt, ...rest } = profile;
  return rest;
}
