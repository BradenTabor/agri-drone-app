import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (maxLength: number) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .max(maxLength, `Must be ${maxLength} characters or fewer.`)
      .optional(),
  );

const optionalEmail = () =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .max(255, "Email must be 255 characters or fewer.")
      .optional(),
  );

const optionalDecimal = (opts: { min?: number; max?: number; label: string }) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .union([z.number(), z.string().trim()])
      .transform((value) => (typeof value === "number" ? value : Number(value)))
      .refine((value) => Number.isFinite(value), {
        message: `${opts.label} must be a number.`,
      })
      .refine((value) => opts.min === undefined || value >= opts.min, {
        message: `${opts.label} must be at least ${opts.min}.`,
      })
      .refine((value) => opts.max === undefined || value <= opts.max, {
        message: `${opts.label} must be no more than ${opts.max}.`,
      })
      .optional(),
  );

const checkboxBoolean = (defaultValue: boolean) =>
  z.preprocess(
    (value) => {
      if (value === "true" || value === true) return true;
      if (value === "false" || value === false) return false;
      return defaultValue;
    },
    z.boolean(),
  );

export const customerCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(120, "Customer name must be 120 characters or fewer."),
  contactName: optionalText(120),
  email: optionalEmail(),
  phone: optionalText(40),
  address: optionalText(255),
  city: optionalText(120),
  state: optionalText(32),
  zip: optionalText(20),
  notes: optionalText(2000),
});

export const customerUpdateSchema = customerCreateSchema;

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const fieldCreateSchema = z.object({
  name: z.string().trim().min(1, "Field name is required.").max(120),
  defaultLat: optionalDecimal({ min: -90, max: 90, label: "Latitude" }),
  defaultLng: optionalDecimal({ min: -180, max: 180, label: "Longitude" }),
  acres: optionalDecimal({ min: 0, max: 100000, label: "Acres" }),
  notes: optionalText(2000),
});

export const fieldUpdateSchema = fieldCreateSchema;

export type FieldCreateInput = z.infer<typeof fieldCreateSchema>;
export type FieldUpdateInput = z.infer<typeof fieldUpdateSchema>;

export const equipmentCreateSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Identifier is required.")
    .max(80, "Identifier must be 80 characters or fewer."),
  type: optionalText(50),
  notes: optionalText(2000),
  active: checkboxBoolean(true),
});

export const equipmentUpdateSchema = equipmentCreateSchema;

export type EquipmentCreateInput = z.infer<typeof equipmentCreateSchema>;
export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>;

const costUnitSchema = z.enum(["gal", "oz", "fl_oz", "lb"], {
  message: "Cost unit must be gal, oz, fl_oz, or lb.",
});

const productIngredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingredient name is required.")
    .max(200, "Ingredient name must be 200 characters or fewer."),
});

export const productCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(120, "Product name must be 120 characters or fewer."),
  epaNumber: optionalText(40),
  manufacturer: optionalText(120),
  unitCost: optionalDecimal({ min: 0, max: 1000000, label: "Wholesale cost" }),
  retailCost: optionalDecimal({ min: 0, max: 1000000, label: "Retail cost" }),
  costUnit: z.preprocess(emptyStringToUndefined, costUnitSchema.optional()),
  restrictedUse: checkboxBoolean(false),
  ingredients: z.array(productIngredientSchema).max(50, "A product can have at most 50 ingredients.").default([]),
  notes: optionalText(2000),
  active: checkboxBoolean(true),
});

export const productUpdateSchema = productCreateSchema;

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

const defaultUnitSchema = z.enum(["oz", "fl_oz", "gal", "%"], {
  message: "Default unit must be oz, fl_oz, gal, or %.",
});

export const surfactantCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Surfactant name is required.")
    .max(120, "Surfactant name must be 120 characters or fewer."),
  manufacturer: optionalText(120),
  epaNumber: optionalText(40),
  defaultUnit: z.preprocess(emptyStringToUndefined, defaultUnitSchema.optional()),
  unitCost: optionalDecimal({ min: 0, max: 1000000, label: "Unit cost" }),
  costUnit: z.preprocess(emptyStringToUndefined, costUnitSchema.optional()),
  notes: optionalText(2000),
  active: checkboxBoolean(true),
});

export const surfactantUpdateSchema = surfactantCreateSchema;

export type SurfactantCreateInput = z.infer<typeof surfactantCreateSchema>;
export type SurfactantUpdateInput = z.infer<typeof surfactantUpdateSchema>;

const requiredDecimal = (opts: { min?: number; max?: number; label: string }) =>
  z
    .union([z.number(), z.string().trim()])
    .transform((value) => (typeof value === "number" ? value : Number(value)))
    .refine((value) => Number.isFinite(value), {
      message: `${opts.label} must be a number.`,
    })
    .refine((value) => opts.min === undefined || value >= opts.min, {
      message: `${opts.label} must be at least ${opts.min}.`,
    })
    .refine((value) => opts.max === undefined || value <= opts.max, {
      message: `${opts.label} must be no more than ${opts.max}.`,
    });

const amountUnitSchema = z.enum(["gal", "oz", "fl_oz", "lb"], {
  message: "Amount unit must be gal, oz, fl_oz, or lb.",
});

const mixRateUnitSchema = z.enum(["oz", "fl_oz", "gal", "lb"], {
  message: "Rate unit must be oz, fl_oz, gal, or lb.",
});

const surfactantUnitSchema = z.enum(["oz", "fl_oz", "gal", "%"], {
  message: "Surfactant unit must be oz, fl_oz, gal, or %.",
});

const windDirectionSchema = z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW"], {
  message: "Wind direction must be one of N, NE, E, SE, S, SW, W, or NW.",
});

const optionalUuid = () =>
  z.preprocess(emptyStringToUndefined, z.string().uuid("Invalid ID.").optional());

export const mixRecordProductLineSchema = z
  .object({
    productId: optionalUuid(),
    amountAdded: requiredDecimal({ min: 0, max: 100000, label: "Amount added" }),
    amountUnit: amountUnitSchema,
    ratePerAcre: optionalDecimal({ min: 0, max: 100000, label: "Rate per acre" }),
    rateUnit: z.preprocess(emptyStringToUndefined, mixRateUnitSchema.optional()),
    sortOrder: z.number().int().min(0).default(0),
  })
  .superRefine((line, ctx) => {
    if (line.ratePerAcre !== undefined && !line.rateUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rateUnit"],
        message: "Rate unit is required when rate per acre is set.",
      });
    }
  });

export const mixRecordCreateSchema = z
  .object({
    recordDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
    timeMixed: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM format."),
    applicatorId: optionalUuid(),
    applicatorNameOverride: optionalText(120),
    licenseCertNo: optionalText(80),
    equipmentId: optionalUuid(),
    customerId: z.string().uuid("Customer is required."),
    fieldId: z.string().uuid("Field is required."),
    mixLat: requiredDecimal({ min: -90, max: 90, label: "Latitude" }),
    mixLng: requiredDecimal({ min: -180, max: 180, label: "Longitude" }),
    tankSizeGal: requiredDecimal({ min: 0, max: 100000, label: "Tank size" }),
    targetGpa: requiredDecimal({ min: 0.01, max: 100000, label: "Target GPA" }),
    waterGal: requiredDecimal({ min: 0, max: 100000, label: "Water" }),
    surfactantName: optionalText(120),
    surfactantAmount: optionalDecimal({ min: 0, max: 100000, label: "Surfactant amount" }),
    surfactantUnit: z.preprocess(emptyStringToUndefined, surfactantUnitSchema.optional()),
    totalMixGal: requiredDecimal({ min: 0, max: 1000000, label: "Total mix" }),
    expectedAcres: requiredDecimal({ min: 0, max: 100000, label: "Expected acres" }),
    actualAcres: optionalDecimal({ min: 0, max: 100000, label: "Actual acres" }),
    windSpeedMph: requiredDecimal({ min: 0, max: 200, label: "Wind speed" }),
    windDirection: windDirectionSchema,
    tempF: optionalDecimal({ min: -100, max: 200, label: "Temperature" }),
    humidityPct: optionalDecimal({ min: 0, max: 100, label: "Humidity" }),
    notes: optionalText(4000),
    signedTypedName: z
      .string()
      .trim()
      .min(1, "Typed signature is required.")
      .max(120, "Typed signature must be 120 characters or fewer."),
    signatureAttested: checkboxBoolean(false),
    productLines: z.array(mixRecordProductLineSchema).min(1, "Add at least one product line."),
  })
  .superRefine((data, ctx) => {
    if (!data.signatureAttested) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["signatureAttested"],
        message: "Attestation is required before submitting.",
      });
    }
  });

export const mixRecordUpdateSchema = mixRecordCreateSchema;

export type MixRecordCreateInput = z.infer<typeof mixRecordCreateSchema>;
export type MixRecordUpdateInput = z.infer<typeof mixRecordUpdateSchema>;
export type MixRecordProductLineInput = z.infer<typeof mixRecordProductLineSchema>;

const specialRateUnitSchema = z.enum(["per_acre", "per_hour", "flat", "other"], {
  message: "Unit must be per_acre, per_hour, flat, or other.",
});

const specialRateRowSchema = z.object({
  name: z.string().trim().min(1, "Service name is required."),
  rate: z.coerce.number().min(0, "Rate must be 0 or greater."),
  unit: specialRateUnitSchema,
  notes: optionalText(500),
});

export const pricingConfigSchema = z.object({
  aerialRatePerAcre: optionalDecimal({ min: 0, max: 100000, label: "Aerial rate" }),
  minimumJobFee: optionalDecimal({ min: 0, max: 1000000, label: "Minimum job fee" }),
  travelFeePerMile: optionalDecimal({ min: 0, max: 100000, label: "Travel fee" }),
  setupFee: optionalDecimal({ min: 0, max: 1000000, label: "Setup fee" }),
  productMarkupPct: optionalDecimal({ min: 0, max: 100, label: "Product markup" }),
  markupCap: optionalDecimal({ min: 0, max: 1000000, label: "Markup cap" }),
  paymentTerms: optionalText(2000),
  specialRates: z.array(specialRateRowSchema).default([]),
});

export type PricingConfigInput = z.infer<typeof pricingConfigSchema>;

const quoteLineKindSchema = z.enum(["aerial", "product", "fee", "custom"], {
  message: "Invalid line item type.",
});
const quoteBasisSchema = z.enum(["per_acre", "flat"], { message: "Invalid basis." });
const quoteStatusSchema = z.enum(["draft", "sent", "accepted", "declined"], {
  message: "Invalid status.",
});

const quoteLineItemSchema = z.object({
  kind: quoteLineKindSchema.default("custom"),
  productId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  description: z.string().trim().min(1, "Line description is required.").max(200),
  basis: quoteBasisSchema.default("flat"),
  quantity: z.coerce.number().min(0, "Quantity must be 0 or greater."),
  unitPrice: z.coerce.number(),
  amount: z.coerce.number(),
});

export const quoteCreateSchema = z.object({
  quoteNumber: optionalText(40),
  status: quoteStatusSchema.default("draft"),
  customerId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  fieldId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  customerName: z.string().trim().min(1, "Customer name is required.").max(120),
  sourceAppRecordId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  quoteDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
  validUntil: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.").optional(),
  ),
  acres: optionalDecimal({ min: 0, max: 100000, label: "Acres" }),
  serviceFor: optionalText(200),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  otherLabel: optionalText(120),
  otherAmount: z.coerce.number().default(0),
  notes: optionalText(2000),
  terms: optionalText(2000),
  lineItems: z.array(quoteLineItemSchema).min(1, "Add at least one line item."),
});

export const quoteUpdateSchema = quoteCreateSchema;

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>;
export type QuoteLineItemInput = z.infer<typeof quoteLineItemSchema>;

const appMethodSchema = z.enum(
  ["backpack", "boom", "handgun", "utv", "truck_rig", "drone"],
  { message: "Select a valid application method." },
);

const appTypeSchema = z.enum(["spraying", "spreading"], {
  message: "Select spraying or spreading.",
});

const targetVegSchema = z.enum(
  ["broadleaf", "grasses", "brush", "woody", "aquatic", "other"],
  { message: "Invalid vegetation type." },
);

const skyConditionSchema = z.enum(
  ["clear", "partly_cloudy", "cloudy", "rain"],
  { message: "Invalid sky condition." },
);

const appRecordPesticideSchema = z.object({
  epaRegNumber: optionalText(40),
  productName: z.string().trim().min(1, "Product name is required."),
  activeIngredient: optionalText(500),
  isSurfactant: checkboxBoolean(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const appRecordCreateSchema = z
  .object({
    jobDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
    applicatorName: z.string().trim().min(1, "Applicator name is required.").max(120),
    customerName: z.string().trim().min(1, "Customer name is required.").max(120),
    siteAddress: optionalText(255),
    jobSiteId: optionalText(120),

    locationLat: optionalDecimal({ min: -90, max: 90, label: "Latitude" }),
    locationLng: optionalDecimal({ min: -180, max: 180, label: "Longitude" }),

    tempF: optionalDecimal({ min: -60, max: 140, label: "Temperature" }),
    windSpeedMph: optionalDecimal({ min: 0, max: 200, label: "Wind speed" }),
    windDirection: z.preprocess(emptyStringToUndefined, windDirectionSchema.optional()),
    skyCondition: z.preprocess(emptyStringToUndefined, skyConditionSchema.optional()),

    targetVegetation: z.array(targetVegSchema).min(1, "Select at least one target vegetation type."),
    targetVegOther: optionalText(120),

    appMethod: z.preprocess(emptyStringToUndefined, appMethodSchema.optional()),
    appType: z.preprocess(emptyStringToUndefined, appTypeSchema.optional()),

    startTime: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM.")
      .optional()
      .or(z.literal("")),
    endTime: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM.")
      .optional()
      .or(z.literal("")),

    totalGallons: optionalDecimal({ min: 0, max: 1000000, label: "Total gallons" }),
    gallonsPerAcre: optionalDecimal({ min: 0, max: 10000, label: "Gallons per acre" }),
    acresTreated: optionalDecimal({ min: 0, max: 100000, label: "Acres treated" }),
    tankMixRecord: optionalText(120),

    equipmentNotes: optionalText(500),
    truckId: optionalText(80),
    nozzleType: optionalText(80),

    rei: optionalText(80),
    safeReentryDate: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.").optional(),
    ),

    additionalNotes: optionalText(4000),
    certAttested: checkboxBoolean(false),
    applicatorSig: z.string().trim().min(1, "Applicator signature is required.").max(120),
    licenseCertNo: optionalText(80),

    pesticides: z.array(appRecordPesticideSchema).min(1, "Add at least one product."),
    mixRecordIds: z.array(z.string().uuid()).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.certAttested) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["certAttested"],
        message: "Attestation is required before submitting.",
      });
    }

    if (data.appMethod && !data.appType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appType"],
        message: "Select spraying or spreading.",
      });
    }

    if (data.appType && !data.appMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appMethod"],
        message: "Select an application method.",
      });
    }
  });

export const appRecordUpdateSchema = appRecordCreateSchema;

export type AppRecordCreateInput = z.infer<typeof appRecordCreateSchema>;
export type AppRecordUpdateInput = z.infer<typeof appRecordUpdateSchema>;
export type AppRecordPesticideInput = z.infer<typeof appRecordPesticideSchema>;
