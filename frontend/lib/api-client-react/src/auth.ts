/**
 * Hand-written (unlike everything under `generated/`).
 *
 * Auth isn't in the OpenAPI spec yet, so these hooks are written by hand in
 * the same style orval would produce. If you later add the auth paths to
 * lib/api-spec/openapi.yaml and run codegen, delete this file and the
 * matching export in index.ts — the generated equivalents will take over.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type { AuthUserType, LoginBodyType, SignupBodyType } from "@workspace/api-zod";
import { customFetch } from "./custom-fetch";
import type { ErrorType } from "./custom-fetch";

const AUTH_ME_URL = "/api/auth/me";

export const getMe = (options?: Parameters<typeof customFetch>[1]): Promise<AuthUserType> =>
  customFetch<AuthUserType>(AUTH_ME_URL, { ...options, method: "GET" });

export const getMeQueryKey = () => [AUTH_ME_URL] as const;

/**
 * The current signed-in user, or `null` if not authenticated. Never throws
 * for the "not logged in" case (401) — that's treated as a normal, valid
 * "no user" result so the UI doesn't need to special-case it.
 */
export function useMe(
  options?: { query?: UseQueryOptions<AuthUserType | null, ErrorType<unknown>> },
): UseQueryResult<AuthUserType | null, ErrorType<unknown>> & { queryKey: QueryKey } {
  const queryKey = getMeQueryKey();
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await getMe();
      } catch (err) {
        if ((err as ErrorType<unknown>)?.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    ...options?.query,
  }) as UseQueryResult<AuthUserType | null, ErrorType<unknown>> & { queryKey: QueryKey };
  query.queryKey = queryKey;
  return query;
}

export const signup = async (
  body: SignupBodyType,
  options?: Parameters<typeof customFetch>[1],
): Promise<AuthUserType> => {
  const data = await customFetch<any>("/api/auth/signup", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
  const token = data?.access_token;
  if (token && typeof window !== "undefined") {
    window.localStorage.setItem("access_token", token);
    window.localStorage.setItem("sie_token", token);
  }
  const user = data?.user || data;
  return {
    id: String(user.id),
    name: user.name || user.full_name || "User",
    email: user.email,
    onboarded: Boolean(user.onboarded),
  };
};

export function useSignup<TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<AuthUserType, TError, SignupBodyType, TContext> },
): UseMutationResult<AuthUserType, TError, SignupBodyType, TContext> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SignupBodyType) => signup(body),
    ...options?.mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getMeQueryKey(), data);
      options?.mutation?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export const login = async (
  body: LoginBodyType,
  options?: Parameters<typeof customFetch>[1],
): Promise<AuthUserType> => {
  const data = await customFetch<any>("/api/auth/login", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
  const token = data?.access_token;
  if (token && typeof window !== "undefined") {
    window.localStorage.setItem("access_token", token);
    window.localStorage.setItem("sie_token", token);
  }
  const user = data?.user || data;
  return {
    id: String(user.id),
    name: user.name || user.full_name || "User",
    email: user.email,
    onboarded: Boolean(user.onboarded),
  };
};

export function useLogin<TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<AuthUserType, TError, LoginBodyType, TContext> },
): UseMutationResult<AuthUserType, TError, LoginBodyType, TContext> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBodyType) => login(body),
    ...options?.mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getMeQueryKey(), data);
      options?.mutation?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export const logout = async (options?: Parameters<typeof customFetch>[1]): Promise<void> => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("sie_token");
  }
  return customFetch<void>("/api/auth/logout", { ...options, method: "POST" });
};


export function useLogout<TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, void, TContext> },
): UseMutationResult<void, TError, void, TContext> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    ...options?.mutation,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(getMeQueryKey(), null);
      queryClient.clear();
      options?.mutation?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
