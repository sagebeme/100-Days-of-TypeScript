import { z } from "zod";

// What the Ligi API sends, checked at the border (Day 44). Everything the SDK returns comes from here.
export const TeamRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  short: z.string(),
});

export const StandingsSchema = z.object({
  league: z.string(),
  season: z.string(),
  updated: z.iso.datetime({ offset: true }),
  table: z.array(
    z.object({
      position: z.number().int().positive(),
      team: TeamRefSchema,
      played: z.number().int().min(0),
      won: z.number().int().min(0),
      drawn: z.number().int().min(0),
      lost: z.number().int().min(0),
      goalsFor: z.number().int().min(0),
      goalsAgainst: z.number().int().min(0),
      points: z.number().int(),
      form: z.string().regex(/^[WDL]{0,5}$/),
    }),
  ),
});

export const TeamSchema = TeamRefSchema.extend({
  founded: z.number().int(),
  stadium: z.string(),
});

export const FixturesSchema = z.object({
  fixtures: z.array(
    z.object({
      id: z.string(),
      kickoff: z.iso.datetime({ offset: true }).transform((iso) => new Date(iso)),
      home: TeamRefSchema,
      away: TeamRefSchema,
      venue: z.string(),
      status: z.enum(["scheduled", "live", "finished"]),
      score: z.object({ home: z.number().int(), away: z.number().int() }).nullable(),
    }),
  ),
});

export const ErrorBodySchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

// The types users of the SDK see. They come from the schemas, so they can't drift apart.
export type TeamRef = z.infer<typeof TeamRefSchema>;
export type Standings = z.infer<typeof StandingsSchema>;
export type StandingsRow = Standings["table"][number];
export type Team = z.infer<typeof TeamSchema>;
export type Fixture = z.infer<typeof FixturesSchema>["fixtures"][number];
