"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="max-w-sm">
      <h1 className="font-display text-3xl text-brown mb-6">Change Password</h1>

      {success && <p className="text-teal text-sm mb-4">Password updated successfully.</p>}

      <form onSubmit={handleSubmit} className="bg-white border border-brown/10 rounded-sm p-5 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-brown mb-1">New password</span>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
            minLength={8}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brown mb-1">Confirm new password</span>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            minLength={8}
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Updating…" : "Update Password"}
        </button>
      </form>

      <style>{`
        .input { width: 100%; border: 1px solid rgba(65,29,13,0.2); border-radius: 4px; padding: 0.6rem 0.8rem; background: white; color: #2C1409; font-size: 0.95rem; }
      `}</style>
    </div>
  );
}
