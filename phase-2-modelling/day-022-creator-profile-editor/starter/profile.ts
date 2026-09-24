export interface CreatorProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  followers: number;
  createdAt: string;
}

// TODO: replace with Partial<Pick<CreatorProfile, "handle" | "displayName" | "bio">>
export type ProfileUpdate = {};

// TODO: replace with Omit<CreatorProfile, "id" | "createdAt">
export type PublicProfile = CreatorProfile;

export function updateProfile(profile: CreatorProfile, update: ProfileUpdate): CreatorProfile {
  // TODO: copy the profile, then apply handle / displayName / bio from update, skipping any that are undefined
  // TODO: don't spread the whole update in: only the three editable fields may change
  throw new Error("not implemented yet");
}

export function toPublicProfile(profile: CreatorProfile): PublicProfile {
  // TODO: return the profile without id and createdAt (destructure them out and return the rest)
  throw new Error("not implemented yet");
}
