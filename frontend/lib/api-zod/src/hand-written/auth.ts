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
  id: zod.union([zod.string(), zod.number()]),
  name: zod.string(),
  email: zod.string(),
  onboarded: zod.boolean().optional(),
  is_verified: zod.boolean().optional(),
  onboarding_completed: zod.boolean().optional(),
  github_username: zod.string().nullable().optional(),
  linkedin_url: zod.string().nullable().optional(),
  target_weekly_hours: zod.number().nullable().optional(),
});
export type AuthUserType = zod.infer<typeof AuthUser>;

export const VerifyEmailBody = zod.object({
  email: zod.string().email(),
  otp: zod.string().min(6).max(6),
});
export type VerifyEmailBodyType = zod.infer<typeof VerifyEmailBody>;

export const ResendOtpBody = zod.object({
  email: zod.string().email(),
});
export type ResendOtpBodyType = zod.infer<typeof ResendOtpBody>;

export const OnboardingCompleteBody = zod.object({
  github_username: zod.string().optional(),
  linkedin_url: zod.string().optional(),
  target_weekly_hours: zod.number().optional(),
  skills: zod.array(zod.string()),
});
export type OnboardingCompleteBodyType = zod.infer<typeof OnboardingCompleteBody>;

