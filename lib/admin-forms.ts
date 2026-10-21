import { z } from "zod";

// Form fields shared by the exercise and project editors. Not in
// lib/actions/, so these helpers never become /rpc endpoints.

// A textarea holding JSON, parsed and validated against the given schema.
export const json = <T extends z.ZodType>(schema: T) =>
  z.string().transform((s, ctx) => {
    try {
      return schema.parse(JSON.parse(s)) as z.infer<T>;
    } catch {
      ctx.addIssue({ code: "custom", message: "JSON tidak valid" });
      return z.NEVER;
    }
  });
export const files = z.object({ html: z.string().optional(), css: z.string().optional(), js: z.string().optional(), code: z.string().optional() });
export const tests = z.array(z.object({ name: z.string().min(1), check: z.string().min(1) }));
