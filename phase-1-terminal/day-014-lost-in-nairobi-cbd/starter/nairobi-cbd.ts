export type Room = {
  id: string;
  description: string;
  exits: Record<string, string>;
  isEnding?: boolean;
};

export type World = Record<string, Room>;

export const nairobiCbdWorld: World = {
  // TODO: add the rooms from the README table (bus-stage, tom-mboya-street, kencom, uhuru-park)
  // TODO: add a few of your own, including at least one more ending
};

export function move(world: World, currentRoomId: string, direction: string): string {
  // TODO: look up the current room; throw new Error(`Unknown room: ${currentRoomId}`) if it doesn't exist
  // TODO: if the room has an exit in that direction, return the id it points to
  // TODO: otherwise return currentRoomId
  throw new Error("not implemented yet");
}

export function isEnding(world: World, roomId: string): boolean {
  // TODO: return true only if the room exists and has isEnding set to true
  throw new Error("not implemented yet");
}
