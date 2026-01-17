"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";

type RegisterFormProps = {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
};

export default function RegisterForm({ onSwitchToLogin, onSuccess }: RegisterFormProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    // If email confirmations are ON, the user may need to confirm before login.
    if (!data.session) {
      setMessage("Account created. Check your email to confirm, then log in.");
      return;
    }

    // If confirmations are OFF, user may already be signed in.
    onSuccess?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-4">
      {/* Title */}
      <div className="space-y-1 text-center">
        <div className="text-sm font-semibold">Create account</div>
        <div className="text-xs text-muted-foreground">
          Use your email and password to get started
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md border px-3 py-2 text-xs">
          {message}
        </div>
      ) : null}

      {/* Email */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Email</label>
        <Input
          name="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Password</label>
        <Input
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <div className="text-[11px] text-muted-foreground">Min 8 characters.</div>
      </div>

      {/* Button */}
      <div className="flex justify-center pt-2">
        <Button type="submit" disabled={loading} className="px-8">
          {loading ? "Creating..." : "Create account"}
        </Button>
      </div>

      {/* Switch */}
      <div className="flex justify-center gap-2 pt-1 text-xs">
        <span className="text-muted-foreground">Already have an account?</span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Log in
        </button>
      </div>
    </form>
  );
}




