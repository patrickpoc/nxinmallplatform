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

export const fairVendorRegisterSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
    companyName: z.string().min(2).max(200),
    slug: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
    acceptTerms: z.literal(true),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const fairBoothProfileSchema = z.object({
  companyName: z.string().min(2).max(200),
  legalName: z.string().max(300).optional(),
  cnpj: z.string().max(20).optional(),
  country: z.string().length(2),
  type: z.string().min(1).max(100),
  street: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  postalCode: z.string().max(32).optional(),
  addressCountry: z.string().length(2).optional(),
  phone: z.string().max(40).optional(),
  whatsappNumber: z.string().max(40).optional(),
  quotationUrl: z.string().url().optional().or(z.literal("")),
  pixKey: z.string().max(200).optional(),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]).optional(),
  pixBeneficiaryName: z.string().max(200).optional(),
  pixImageUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isActive: z.boolean(),
});

export const fairProductImageSchema = z.object({
  url: z.union([z.string().url("URL de imagem inválida"), z.literal("")]),
  isPrimary: z.boolean().default(false),
  kind: z.enum(["GALLERY", "DESCRIPTION"]).default("GALLERY"),
});

/** Strict image schema for persisted products (non-empty URL). */
export const fairProductImagePersistSchema = z.object({
  url: z.string().url(),
  isPrimary: z.boolean().default(false),
  kind: z.enum(["GALLERY", "DESCRIPTION"]).default("GALLERY"),
});

const fairPriceAmountSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().replace(",", ".") : val),
  z.string().regex(/^\d+(\.\d{1,2})?$/, "Use o formato 0.00 (ex.: 10.50)"),
);

export const fairProductVariantSchema = z.object({
  sku: z.string().min(1, "SKU é obrigatório").max(64),
  priceAmount: fairPriceAmountSchema,
  minOrderQty: z.number().int().positive().default(1),
  unit: z.enum(["KG", "TON", "UNIT", "BOX", "PALLET"]),
  stockQty: z.preprocess(
    (val) => (typeof val === "number" && Number.isNaN(val) ? 0 : val),
    z.number().int().nonnegative(),
  ),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

const fairProductCreateBaseSchema = z.object({
  name: z.object({
    en: z.string().optional(),
    pt: z.string().min(1, "Nome do produto é obrigatório"),
    zh: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      pt: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  categoryId: z.string().min(1),
  newCategoryName: z.string().min(2).max(100).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
  variants: z.array(fairProductVariantSchema).min(1).max(5),
  images: z.array(fairProductImageSchema).max(10).default([]),
});

export const fairProductCreateSchema = fairProductCreateBaseSchema.superRefine((data, ctx) => {
  if (data.categoryId === "__new__" && !data.newCategoryName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe o nome da nova categoria",
      path: ["newCategoryName"],
    });
  }
});

/** Server-side schema after empty gallery URLs are stripped and category is resolved. */
export const fairProductPersistSchema = fairProductCreateBaseSchema
  .omit({ images: true })
  .extend({
    images: z.array(fairProductImagePersistSchema).max(10).default([]),
  });

export const fairCheckoutSchema = z
  .object({
    boothSlug: z.string().min(1),
    guestName: z.string().min(2).max(200),
    guestEmail: z.string().email(),
    guestPhone: z.string().min(8).max(40),
    guestDocumentType: z.enum(["CPF", "CNPJ"]).default("CPF"),
    guestCpf: z.string().min(11).max(14),
    street: z.string().min(1).max(300),
    city: z.string().min(1).max(120),
    state: z.string().max(120).optional(),
    postalCode: z.string().min(8).max(9),
    country: z.string().length(2).default("BR"),
    items: z
      .array(
        z.object({
          variantId: z.string().min(1),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
  })
  .refine(
    (d) => (d.guestDocumentType === "CPF" ? d.guestCpf.length === 11 : d.guestCpf.length === 14),
    { message: "Invalid tax document", path: ["guestCpf"] },
  );
