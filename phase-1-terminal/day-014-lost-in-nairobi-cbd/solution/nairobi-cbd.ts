export type Room = {
  id: string;
  description: string;
  exits: Record<string, string>;
  isEnding?: boolean;
};

export type World = Record<string, Room>;

export const nairobiCbdWorld: World = {
  "bus-stage": {
    id: "bus-stage",
    description:
      "You step off a matatu at the bus stage. Horns everywhere, music from three directions. Tom Mboya Street is to the north.",
    exits: { north: "tom-mboya-street" },
  },
  "tom-mboya-street": {
    id: "tom-mboya-street",
    description:
      "Tom Mboya Street. Hawkers, handcarts and a preacher with a speaker. Kencom is north, River Road is east, the bus stage is south.",
    exits: { south: "bus-stage", north: "kencom", east: "river-road" },
  },
  "river-road": {
    id: "river-road",
    description:
      "River Road, packed. A conductor grabs your sleeve: 'Rongai! Rongai! Last seat!' Tom Mboya Street is west, and the matatu is right there to the east.",
    exits: { west: "tom-mboya-street", east: "wrong-matatu" },
  },
  "wrong-matatu": {
    id: "wrong-matatu",
    description:
      "You climb in. Forty minutes later the conductor announces the terminus, and it is definitely not Uhuru Park. Game over.",
    exits: {},
    isEnding: true,
  },
  kencom: {
    id: "kencom",
    description:
      "Kencom. Office workers stream past. The green of Uhuru Park is visible to the north, Tom Mboya Street is south.",
    exits: { south: "tom-mboya-street", north: "uhuru-park" },
  },
  "uhuru-park": {
    id: "uhuru-park",
    description:
      "You made it. Grass, a boat on the lake, and finally some quiet. You win.",
    exits: {},
    isEnding: true,
  },
};

export function move(world: World, currentRoomId: string, direction: string): string {
  const room = world[currentRoomId];
  if (room === undefined) {
    throw new Error(`Unknown room: ${currentRoomId}`);
  }
  const next = room.exits[direction];
  if (next === undefined) {
    return currentRoomId;
  }
  return next;
}

export function isEnding(world: World, roomId: string): boolean {
  const room = world[roomId];
  return room !== undefined && room.isEnding === true;
}
