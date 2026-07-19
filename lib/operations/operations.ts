import { z } from "zod";

import { EmbeddedActionOutcomesSchema, MutatingOutcomesSchema } from "./outcomes";
import { InvokeBindingSchema, OperationDataSchema, WriteBindingSchema } from "./data";

const ColumnFormatSchema = z.enum(["string", "number", "date", "badge"]);
const FieldFormatSchema = z.enum(["string", "number", "text", "date"]);
const FormFieldTypeSchema = z.enum([
  "text",
  "textarea",
  "email",
  "number",
  "select",
  "checkbox",
]);
const ActionVariantSchema = z.enum(["primary", "danger", "secondary"]);

export const TableColumnSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    format: ColumnFormatSchema.optional(),
  })
  .strict();

export const TableFilterSchema = z
  .object({
    field: z.string().min(1),
    label: z.string().min(1),
    options: z
      .array(
        z
          .object({
            value: z.string(),
            label: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const HeaderMetricSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    value: z.union([z.number(), z.string()]),
  })
  .strict();

export const TablePresentationSchema = z
  .object({
    layout: z.literal("table"),
    columns: z.array(TableColumnSchema).min(1),
    filter: TableFilterSchema.optional(),
    header: z
      .object({
        metrics: z.array(HeaderMetricSchema).min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

export const FormFieldSchema = z
  .object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: FormFieldTypeSchema,
    required: z.boolean().optional(),
    default: z.unknown().optional(),
    options: z
      .array(
        z
          .object({
            value: z.string(),
            label: z.string().min(1),
          })
          .strict(),
      )
      .min(1)
      .optional(),
  })
  .strict();

export const FormPresentationSchema = z
  .object({
    layout: z.literal("form"),
    fields: z.array(FormFieldSchema).min(1),
  })
  .strict();

export const DetailFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    format: FieldFormatSchema.optional(),
  })
  .strict();

export const EmbeddedActActionSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("act"),
    label: z.string().min(1),
    variant: ActionVariantSchema.optional(),
    invoke: InvokeBindingSchema,
    outcomes: EmbeddedActionOutcomesSchema,
  })
  .strict();

export const EmbeddedDeleteActionSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("delete"),
    label: z.string().min(1),
    variant: ActionVariantSchema.optional(),
    confirm: z
      .object({
        message: z.string().min(1),
      })
      .strict(),
    write: WriteBindingSchema.extend({
      method: z.literal("DELETE"),
    }),
    outcomes: EmbeddedActionOutcomesSchema,
  })
  .strict();

export const EmbeddedActionSchema = z.discriminatedUnion("type", [
  EmbeddedActActionSchema,
  EmbeddedDeleteActionSchema,
]);

export const DetailPresentationSchema = z
  .object({
    layout: z.literal("detail"),
    sections: z
      .array(
        z
          .object({
            title: z.string().min(1),
            fields: z.array(DetailFieldSchema).min(1),
          })
          .strict(),
      )
      .min(1),
    actions: z.array(EmbeddedActionSchema).optional(),
  })
  .strict();

export const ConfirmPresentationSchema = z
  .object({
    layout: z.literal("confirm"),
    message: z.string().min(1),
  })
  .strict();

export const BreadcrumbSchema = z
  .object({
    label: z.string().min(1),
    operation: z.string().min(1),
  })
  .strict();

export const OperationContextSchema = z
  .object({
    breadcrumb: BreadcrumbSchema,
  })
  .strict();

const OperationBaseSchema = z.object({
  id: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1),
  route: z.string().min(1).startsWith("/"),
  params: z.array(z.string().min(1)).optional(),
  context: OperationContextSchema.optional(),
});

export const BrowseOperationSchema = OperationBaseSchema.extend({
  type: z.literal("browse"),
  presentation: TablePresentationSchema,
  data: OperationDataSchema,
}).strict();

export const ReadOperationSchema = OperationBaseSchema.extend({
  type: z.literal("read"),
  presentation: DetailPresentationSchema,
  data: OperationDataSchema,
}).strict();

export const CreateOperationSchema = OperationBaseSchema.extend({
  type: z.literal("create"),
  presentation: FormPresentationSchema,
  data: OperationDataSchema,
  outcomes: MutatingOutcomesSchema,
}).strict();

export const UpdateOperationSchema = OperationBaseSchema.extend({
  type: z.literal("update"),
  presentation: FormPresentationSchema,
  data: OperationDataSchema,
  outcomes: MutatingOutcomesSchema,
}).strict();

export const DeleteOperationSchema = OperationBaseSchema.extend({
  type: z.literal("delete"),
  presentation: ConfirmPresentationSchema,
  data: OperationDataSchema,
  outcomes: MutatingOutcomesSchema,
}).strict();

export const OperationSchema = z.discriminatedUnion("type", [
  BrowseOperationSchema,
  ReadOperationSchema,
  CreateOperationSchema,
  UpdateOperationSchema,
  DeleteOperationSchema,
]);

export type Operation = z.infer<typeof OperationSchema>;
export type BrowseOperation = z.infer<typeof BrowseOperationSchema>;
export type ReadOperation = z.infer<typeof ReadOperationSchema>;
export type EmbeddedAction = z.infer<typeof EmbeddedActionSchema>;
