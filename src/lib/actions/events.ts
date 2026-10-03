"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, run, zodFail } from "./helpers";
import { getRepo } from "@/lib/data";

const eventSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Give the event a title").max(120),
  description: z.string().trim().max(1000).default(""),
  startsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Pick a start time"),
  endsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Pick an end time"),
  points: z.coerce.number().int().min(0).max(5000),
  categoryId: z.string().min(1, "Pick a category"),
  location: z.string().trim().min(1, "Add a location").max(120),
});

export async function saveEventAction(input: unknown) {
  const p = eventSchema.safeParse(input);
  if (!p.success) return zodFail(p.error);
  if (Date.parse(p.data.endsAt) <= Date.parse(p.data.startsAt)) return fail("End time must be after the start", { endsAt: "Must be after the start" });
  const r = await run({ staff: true }, (s) =>
    getRepo().saveEvent(s, { ...p.data, startsAt: new Date(p.data.startsAt).toISOString(), endsAt: new Date(p.data.endsAt).toISOString() }),
  );
  revalidatePath("/events");
  revalidatePath("/admin/events");
  return r;
}

export async function deleteEventAction(id: string) {
  const r = await run({ staff: true }, (s) => getRepo().deleteEvent(s, id));
  revalidatePath("/events");
  revalidatePath("/admin/events");
  return r;
}

export async function setWinnerAction(eventId: string, teamId: string, award: boolean) {
  const r = await run({ staff: true }, (s) => getRepo().setEventWinner(s, eventId, teamId, award));
  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/leaderboard");
  return r;
}
