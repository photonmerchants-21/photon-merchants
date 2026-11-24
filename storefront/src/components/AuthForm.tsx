"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { MedusaApiError } from "../lib/medusa-browser";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-cream outline-none placeholder:text-cream/35 focus:border-mustard/60";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/account");
    } catch (err) {
      setError(
        err instanceof MedusaApiError
          ? err.message
          : "Could not sign in. Check email and password."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access order history and saved addresses."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-cream/55">
        <Link href="/account/forgot-password" className="hover:text-mustard">
          Forgot password?
        </Link>
        {" · "}
        <Link href="/account/register" className="hover:text-mustard">
          Create account
        </Link>
      </p>
    </AuthCard>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ email, password, firstName, lastName, phone });
      router.push("/account");
    } catch (err) {
      setError(
        err instanceof MedusaApiError
          ? err.message
          : "Could not create account."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create account"
      subtitle="Guest checkout still works — accounts save addresses and history."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
              First name
            </span>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              autoComplete="given-name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
              Last name
            </span>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              autoComplete="family-name"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Phone
          </span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            autoComplete="tel"
            placeholder="07XX XXX XXX"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            Password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-cream/55">
        Already have an account?{" "}
        <Link href="/account/login" className="hover:text-mustard">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof MedusaApiError
          ? err.message
          : "Could not request reset."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Reset password"
      subtitle="We'll email a link if that address has an account."
    >
      {done ? (
        <p className="text-sm text-cream/75">
          If an account exists for that email, a reset link was sent. Check your
          inbox (and spam). On local staging the link is also printed in the
          server log.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
          </label>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-cream/55">
        <Link href="/account/login" className="hover:text-mustard">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setError("This reset link is missing a token or email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword({ email, password, token });
      router.push("/account/login");
    } catch (err) {
      setError(
        err instanceof MedusaApiError
          ? err.message
          : "Could not reset password. Request a new link."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={email ? `Resetting password for ${email}` : "Invalid reset link"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mustard">
            New password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy || !token || !email}
          className="w-full rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl text-cream">{title}</h1>
      <p className="mt-2 text-sm text-cream/60">{subtitle}</p>
      <div className="mt-8 rounded-2xl border border-white/10 bg-ink-soft p-5">
        {children}
      </div>
    </div>
  );
}
