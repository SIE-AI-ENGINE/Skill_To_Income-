import * as zod from "zod";

// These schemas are hand-written (unlike everything under `generated/`,
// which is produced by `orval` from `lib/api-spec/openapi.yaml`).
//
// If you want auth to show up in the generated OpenAPI client too, add the
// matching paths/schemas to `lib/api-spec/openapi.yaml` and re-run
// `pnpm --filter @workspace/api-spec run codegen`. Until then this file is
// the source of truth for both the server and the frontend.

export const SignupBody = zod.object({
  name: zod.string().trim().min(1, "Name is required").max(120),
  email: zod.string().trim().toLowerCase().email("Enter a valid email address"),
  password: zod.string().min(8, "Password must be at least 8 characters").max(200),
});
export type SignupBodyType = zod.infer<typeof SignupBody>;

export const LoginBody = zod.object({
  email: zod.string().trim().toLowerCase().email("Enter a valid email address"),
  password: zod.string().min(1, "Password is required"),
});
export type LoginBodyType = zod.infer<typeof LoginBody>;

export const AuthUser = zod.object({
  id: zod.string(),
  name: zod.string(),
  email: zod.string(),
  onboarded: zod.boolean(),
});
export type AuthUserType = zod.infer<typeof AuthUser>;
