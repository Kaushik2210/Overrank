import { z } from "zod";

/** Identifiers from the browser: short, plain characters only. Matches uuids and the preview ids alike. */
export const idSchema = z.string().min(1, "Missing id").max(64).regex(/^[A-Za-z0-9_-]+$/, "Invalid id");
export const studentIdSchema = z.string().regex(/^\d{5,12}$/, "Invalid student ID");
export const iconSchema = z.string().regex(/^[A-Za-z0-9]{1,30}$/, "Invalid icon");
export const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #22C55E");

export const awardSchema = z.object({
  studentIds: z.array(studentIdSchema).min(1, "Pick at least one student").max(80),
  amount: z.coerce
    .number({ message: "Enter a number" })
    .int("Whole numbers only")
    .refine((n) => n !== 0, "Amount can't be zero")
    .refine((n) => Math.abs(n) <= 1000, "Max 1,000 points at a time"),
  categoryId: idSchema.or(z.literal("")).refine((v) => v !== "", "Pick a category"),
  reason: z.string().trim().min(3, "Add a reason").max(200),
  eventId: idSchema.optional().nullable(),
});
export type AwardFormInput = z.infer<typeof awardSchema>;

export const teamSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2, "Name is too short").max(40),
  motto: z.string().trim().max(80),
  colorPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #22C55E"),
  colorGlow: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #4ADE80"),
});

export const xpSettingsSchema = z.object({
  xpPerPoint: z.coerce.number().min(0.1).max(100),
  thresholds: z.array(z.coerce.number().int().min(1)).min(1).max(30),
});
