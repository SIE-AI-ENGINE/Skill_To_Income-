import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  useLogin,
  useLogout,
  useMe,
  useSignup,
  useVerifyEmail,
  useResendOtp,
  useCompleteOnboarding,
} from '@workspace/api-client-react';
import type { ErrorType } from '@workspace/api-client-react';
import type { AuthUserType } from '@workspace/api-zod';

type AuthContextValue = {
  user: AuthUserType | null | undefined;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUserType>;
  signup: (name: string, email: string, password: string) => Promise<AuthUserType>;
  verifyEmail: (email: string, otp: string) => Promise<AuthUserType>;
  resendOtp: (email: string) => Promise<{ message: string }>;
  completeOnboarding: (data: {
    github_username?: string;
    linkedin_url?: string;
    target_weekly_hours?: number;
    skills: string[];
  }) => Promise<AuthUserType>;
  logout: () => Promise<void>;
  /** Optimistically mark the current user as onboarded (after the onboarding flow saves). */
  markOnboarded: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const me = useMe();
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const verifyEmailMutation = useVerifyEmail();
  const resendOtpMutation = useResendOtp();
  const completeOnboardingMutation = useCompleteOnboarding();
  const logoutMutation = useLogout();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data,
      isLoading: me.isLoading,
      login: (email, password) => loginMutation.mutateAsync({ email, password }),
      signup: (name, email, password) => signupMutation.mutateAsync({ name, email, password }),
      verifyEmail: (email, otp) => verifyEmailMutation.mutateAsync({ email, otp }),
      resendOtp: (email) => resendOtpMutation.mutateAsync({ email }),
      completeOnboarding: (data) => completeOnboardingMutation.mutateAsync(data),
      logout: () => logoutMutation.mutateAsync(),
      markOnboarded: () => {
        if (me.data) me.refetch();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me.data, me.isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function authErrorMessage(err: unknown, fallback: string): string {
  const apiError = err as ErrorType<{ detail?: string; error?: string }> | undefined;
  return apiError?.data?.detail ?? apiError?.data?.error ?? fallback;
}
