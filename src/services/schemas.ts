import { z } from "zod";

export const RequestSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  description: z.string(),
  region: z.string().optional().default(""),
  status: z.string(),
  createdAt: z.string(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
});

export const RequestInputSchema = RequestSchema.pick({
  categoryId: true,
  description: true,
  region: true,
  budgetMin: true,
  budgetMax: true,
}).partial({
  budgetMin: true,
  budgetMax: true,
});

export const RequestUpdateSchema = RequestInputSchema.partial();

export const QuoteSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  proId: z.string(),
  price: z.number(),
  message: z.string(),
  createdAt: z.string(),
});

export const QuoteInputSchema = QuoteSchema.pick({ requestId: true, proId: true, price: true, message: true });

export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  from: z.string(),
  text: z.string(),
  createdAt: z.string(),
});

export const MessageInputSchema = MessageSchema.pick({ threadId: true, from: true, text: true });

export const OrderSchema = z.object({
  id: z.string(),
  proId: z.string(),
  title: z.string(),
  status: z.string(),
  scheduledAt: z.string(),
});

export const OrderInputSchema = OrderSchema.pick({ proId: true, title: true, status: true, scheduledAt: true });

export const ProfileSchema = z.object({
  id: z.string(),
  role: z.enum(["customer", "pro"]),
  name: z.string(),
  phone: z.string().optional().default(""),
  region: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  createdAt: z.string().optional().default(""),
});

export const ProfileInputSchema = ProfileSchema.pick({
  id: true,
  role: true,
  name: true,
  phone: true,
  region: true,
  bio: true,
});

export const MetaSchema = z.object({
  version: z.number().int().nonnegative(),
});

export type ServiceRequest = z.infer<typeof RequestSchema>;
export type RequestInput = z.infer<typeof RequestInputSchema>;
export type RequestUpdate = z.infer<typeof RequestUpdateSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type QuoteInput = z.infer<typeof QuoteInputSchema>;
export type ServiceMessage = z.infer<typeof MessageSchema>;
export type MessageInput = z.infer<typeof MessageInputSchema>;
export type ServiceOrder = z.infer<typeof OrderSchema>;
export type OrderInput = z.infer<typeof OrderInputSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInput = z.infer<typeof ProfileInputSchema>;
export type Meta = z.infer<typeof MetaSchema>;
