import { EPHEMERAL, InteractionType, ResponseType, timestamp, type Embed, type Interaction, type InteractionResponse, type MessageData } from "./discord.ts";
import type { Tikiti, TikitiEvent } from "./tikiti.ts";

export interface BotOptions {
  tikiti: Tikiti;
  staffRoleId: string; // the server role allowed to check people in
  siteUrl: string; // where the "Buy tickets" buttons go
}

export const BRAND = 0xc2410c; // Tikiti's burnt orange

const reply = (data: MessageData): InteractionResponse => ({ type: ResponseType.Message, data: { allowed_mentions: { parse: [] }, ...data } });
const privately = (content: string) => reply({ content, flags: EPHEMERAL });

const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
export function seats(n: number): string {
  if (n <= 0) return "Sold out";
  if (n <= 20) return `Only ${n} left`;
  return `${n.toLocaleString("en-KE")} left`;
}

function option<T extends string | number>(interaction: Interaction, name: string): T | undefined {
  return interaction.data?.options?.find((o) => o.name === name)?.value as T | undefined;
}

function eventEmbed(event: TikitiEvent, siteUrl: string): Embed {
  const starts = new Date(event.startsAt);
  return {
    title: event.title,
    url: `${siteUrl}/events/${event.id}`,
    color: BRAND,
    description: `${timestamp(starts)} (${timestamp(starts, "R")})\n${event.venue}`,
    fields: [
      { name: "Price", value: kes(event.priceKes), inline: true },
      { name: "Seats", value: seats(event.seatsLeft), inline: true },
    ],
  };
}

function eventList(events: TikitiEvent[], siteUrl: string): InteractionResponse {
  if (events.length === 0) return reply({ content: "Nothing on sale right now. Check back soon." });
  const shown = events.slice(0, 10); // Discord's limit for embeds in one message
  const lines = shown.map((e) => `**[${e.title}](${siteUrl}/events/${e.id})** · ${timestamp(new Date(e.startsAt), "f")} · ${e.venue} · ${kes(e.priceKes)} · ${seats(e.seatsLeft)}`);
  const more = events.length > shown.length ? `\n…and ${events.length - shown.length} more at ${siteUrl}` : "";
  return reply({ embeds: [{ title: "What's on", color: BRAND, description: lines.join("\n") + more }] });
}

function eventDetail(event: TikitiEvent, siteUrl: string): InteractionResponse {
  const soldOut = event.seatsLeft <= 0;
  return reply({
    embeds: [eventEmbed(event, siteUrl)],
    components: [
      {
        type: 1,
        components: [
          soldOut
            ? { type: 2, style: 2, label: "Sold out", custom_id: `soldout:${event.id}`, disabled: true }
            : { type: 2, style: 5, label: "Buy tickets", url: `${siteUrl}/events/${event.id}` },
          { type: 2, style: 2, label: "Remind me the day before", custom_id: `remind:${event.id}` },
        ],
      },
    ],
  });
}

async function checkIn(interaction: Interaction, options: BotOptions, events: TikitiEvent[]): Promise<InteractionResponse> {
  if (!interaction.member) return privately("Check-in only works inside the event's server.");
  if (!options.staffRoleId || !interaction.member.roles.includes(options.staffRoleId)) {
    return privately("Only gate staff can check people in.");
  }
  const event = events.find((e) => e.id === Number(option(interaction, "event")));
  if (!event) return privately("I can't find that event. Pick one from the list as you type.");
  const code = String(option(interaction, "code") ?? "").trim().toUpperCase();
  const result = await options.tikiti.checkIn(event.id, code);
  switch (result.status) {
    case "admitted":
      return privately(`✅ **Let them in.** ${result.holder}, ${event.title}.`);
    case "used":
      return privately(`⛔ **Already used.** ${result.at ? `This ticket got in ${timestamp(new Date(result.at), "R")}.` : "This ticket has already got in."}`);
    case "invalid":
      return privately(`⛔ **Not a ticket for ${event.title}.** Check the code, or send them to the box office.`);
  }
}

function autocomplete(interaction: Interaction, events: TikitiEvent[]): InteractionResponse {
  const typed = String(interaction.data?.options?.find((o) => o.focused)?.value ?? "").trim().toLowerCase();
  const matches = events.filter((e) => !typed || e.title.toLowerCase().includes(typed) || e.venue.toLowerCase().includes(typed));
  return {
    type: ResponseType.AutocompleteResult,
    data: { choices: matches.slice(0, 25).map((e) => ({ name: `${e.title} · ${e.venue}`.slice(0, 100), value: String(e.id) })) },
  };
}

// Discord gives you three seconds to answer. Everything here is one quick call to Tikiti.
export async function handleInteraction(interaction: Interaction, options: BotOptions): Promise<InteractionResponse> {
  if (interaction.type === InteractionType.Ping) return { type: ResponseType.Pong };
  try {
    if (interaction.type === InteractionType.Autocomplete) {
      return autocomplete(interaction, await options.tikiti.upcomingEvents());
    }
    if (interaction.type === InteractionType.Component) {
      const [action, id] = (interaction.data?.custom_id ?? "").split(":");
      const userId = interaction.member?.user.id ?? interaction.user?.id;
      if (action === "remind" && userId) {
        await options.tikiti.remind(userId, Number(id));
        return privately("Done. I'll message you the day before.");
      }
      return privately("That button doesn't do anything any more.");
    }
    if (interaction.type === InteractionType.Command) {
      const events = await options.tikiti.upcomingEvents();
      switch (interaction.data?.name) {
        case "events":
          return eventList(events, options.siteUrl);
        case "event": {
          const event = events.find((e) => e.id === Number(option(interaction, "event")));
          return event ? eventDetail(event, options.siteUrl) : privately("I can't find that event. Pick one from the list as you type.");
        }
        case "checkin":
          return await checkIn(interaction, options, events);
      }
    }
    return privately("I don't know that one.");
  } catch {
    if (interaction.type === InteractionType.Autocomplete) return { type: ResponseType.AutocompleteResult, data: { choices: [] } };
    return privately("Tikiti isn't answering right now. Try again in a minute.");
  }
}
