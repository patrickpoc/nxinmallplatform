import { z } from "zod";

/** Multilingual product/category name shape stored as JSON in DB. */
export const multilingualStringSchema = z.object({
  en: z.string().min(1),
  pt: z.string().min(1),
  zh: z.string().min(1),
});

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
    role: z.enum(["BUYER", "SELLER"]),
    acceptTerms: z.literal(true),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/** Email or dev admin shortcut `admin` (resolved server-side to the seeded admin user). */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1)
    .refine(
      (v) => v.toLowerCase() === "admin" || z.string().email().safeParse(v).success,
      { message: "Invalid email or login" },
    ),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const onboardingCompanyStepSchema = z.object({
  name: z.string().min(2).max(200),
  legalName: z.string().min(2).max(300).optional(),
  country: z.string().length(2),
  type: z.string().min(1).max(100),
  description: z.string().max(5000).optional(),
});

export const onboardingAddressStepSchema = z.object({
  street: z.string().min(1).max(300),
  city: z.string().min(1).max(120),
  state: z.string().max(120).optional(),
  country: z.string().length(2),
  postalCode: z.string().min(1).max(32),
  contactPhone: z.string().min(6).max(40).optional(),
  contactEmail: z.string().email().optional(),
});

export const onboardingDocumentsStepSchema = z.object({
  tradeLicenseUrl: z.string().url().optional(),
  taxIdUrl: z.string().url().optional(),
});

export const onboardingInterestsStepSchema = z.object({
  categoryIds: z.array(z.string().cuid()).max(50).default([]),
});

export const productCreateSchema = z.object({
  name: multilingualStringSchema,
  description: multilingualStringSchema.optional(),
  categoryId: z.string().cuid(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
  imageUrls: z.array(z.string().url()).max(10).optional(),
});

export const productVariantSchema = z.object({
  sku: z.string().min(1).max(64),
  priceUsd: z.string().regex(/^\d+(\.\d{1,6})?$/),
  minOrderQty: z.number().int().positive(),
  unit: z.enum(["KG", "TON", "UNIT", "BOX", "PALLET"]),
  stockQty: z.number().int().nonnegative(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const rfqCreateSchema = z.object({
  title: z.string().min(3).max(200),
  categoryId: z.string().cuid(),
  description: z.string().min(10).max(10000),
  quantity: z.number().positive(),
  unit: z.enum(["KG", "TON", "UNIT", "BOX", "PALLET"]),
  targetPriceUsd: z.string().optional(),
  deadline: z.coerce.date(),
  shippingCountry: z.string().length(2).optional(),
});

export const rfqResponseSchema = z.object({
  priceUsd: z.string().regex(/^\d+(\.\d{1,6})?$/),
  leadTimeDays: z.number().int().nonnegative(),
  message: z.string().max(5000).optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});
