// Already written: the parts of Discord's interactions API this bot uses.
// https://discord.com/developers/docs/interactions/receiving-and-responding

export const InteractionType = { Ping: 1, Command: 2, Component: 3, Autocomplete: 4 } as const;
export const ResponseType = { Pong: 1, Message: 4, AutocompleteResult: 8 } as const;
export const EPHEMERAL = 64; // a message flag: only the person who asked sees it

export interface CommandOption {
  name: string;
  type: number;
  value?: string | number | boolean;
  focused?: boolean; // in an autocomplete: the option being typed right now
}

export interface Interaction {
  type: number;
  id: string;
  token: string;
  guild_id?: string;
  member?: { user: { id: string; username: string }; roles: string[] }; // in a server
  user?: { id: string; username: string }; // in a DM
  data?: {
    name?: string; // the command
    options?: CommandOption[];
    custom_id?: string; // the button that was pressed
  };
}

export interface Embed {
  title?: string;
  url?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
}

export type Button =
  | { type: 2; style: 1 | 2; label: string; custom_id: string; disabled?: boolean } // 1 primary, 2 secondary
  | { type: 2; style: 5; label: string; url: string }; // a link

export interface ActionRow {
  type: 1;
  components: Button[];
}

export interface MessageData {
  content?: string;
  embeds?: Embed[];
  components?: ActionRow[];
  flags?: number;
  allowed_mentions?: { parse: string[] };
}

export type InteractionResponse =
  | { type: typeof ResponseType.Pong }
  | { type: typeof ResponseType.Message; data: MessageData }
  | { type: typeof ResponseType.AutocompleteResult; data: { choices: { name: string; value: string }[] } };

// Discord shows <t:1765551600:F> as a date in each reader's own time zone.
export const timestamp = (date: Date, style: "F" | "R" | "f" = "F") => `<t:${Math.floor(date.getTime() / 1000)}:${style}>`;
