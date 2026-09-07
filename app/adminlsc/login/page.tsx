"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError || !data.user) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    // Confirm this account is an active staff member, not just any Supabase auth user.
    const { data: staffRow } = await supabase
      .from("staff")
      .select("id, is_active")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (!staffRow || !staffRow.is_active) {
      setError("This account is not an active staff member.");
      await supabase.auth.signOut();
      setSubmitting(false);
      return;
    }

    router.push("/adminlsc");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-teal flex items-center justify-center px-4">
      <div className="bg-cream rounded-sm p-8 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="La Shefa Cafe" width={64} height={64} className="rounded-sm" />
        </div>
        <h1 className="font-display text-2xl text-brown text-center mb-1">Admin Login</h1>
        <p className="text-brown/60 text-sm text-center mb-8">La Shefa Cafe management</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brown mb-1">Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-50">
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
