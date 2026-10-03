import { z } from "zod";

export const suggestionSchema = z.object({
  activity: z.string().trim().min(3, "Name the activity").max(120, "Keep it under 120 characters"),
  description: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(1000),
  categoryId: z.string().min(1, "Pick a category"),
  suggestedPoints: z.coerce.number({ message: "Enter a number" }).int("Whole numbers only").min(1, "At least 1 point").max(500, "Max 500 points"),
});
export type SuggestionInput = z.infer<typeof suggestionSchema>;

export const disputeSchema = z.object({
  transactionId: z.string().min(1, "Pick a transaction"),
  reason: z.string().trim().min(10, "Explain the issue (10+ characters)").max(800),
});
export type DisputeInput = z.infer<typeof disputeSchema>;

export const awardSchema = z.object({
  studentIds: z.array(z.string().regex(/^\d{5,12}$/)).min(1, "Pick at least one student").max(80),
  amount: z.coerce
    .number({ message: "Enter a number" })
    .int("Whole numbers only")
    .refine((n) => n !== 0, "Amount can't be zero")
    .refine((n) => Math.abs(n) <= 1000, "Max 1,000 points at a time"),
  categoryId: z.string().min(1, "Pick a category"),
  reason: z.string().trim().min(3, "Add a reason").max(200),
  eventId: z.string().optional().nullable(),
});
export type AwardFormInput = z.infer<typeof awardSchema>;

export const reviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  points: z.coerce.number().int().min(0).max(1000).nullable().optional(),
  note: z.string().trim().max(400).default(""),
});

export const resolveSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["corrected", "modified", "rejected"]),
  newAmount: z.coerce.number().int().min(-1000).max(1000).nullable().optional(),
  note: z.string().trim().max(400).default(""),
});

export const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Name is too short").max(40),
  motto: z.string().trim().max(80),
  colorPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #22C55E"),
  colorGlow: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #4ADE80"),
});

export const xpSettingsSchema = z.object({
  xpPerPoint: z.coerce.number().min(0.1).max(100),
  thresholds: z.array(z.coerce.number().int().min(1)).min(1).max(30),
});
