"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type LogEntry = {
  id: string;
  actor_role: string | null;
  action: string;
  description: string | null;
  related_record: string | null;
  created_at: string;
  // These are read defensively via select("*") below — they may or may not
  // exist on the live activity_logs table. If present, we resolve them to a
  // staff name; if absent, they're simply undefined and we fall back to
  // showing the role alone, exactly as before.
  actor_id?: string | null;
  actor_user_id?: string | null;
  created_by?: string | null;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("staff").select("id, auth_user_id, full_name")
    ]).then(([{ data }, { data: staffRows }]) => {
      setLogs((data as LogEntry[]) ?? []);
      const map: Record<string, string> = {};
      (staffRows ?? []).forEach((s: any) => {
        if (s.id) map[s.id] = s.full_name;
        if (s.auth_user_id) map[s.auth_user_id] = s.full_name;
      });
      setStaffNames(map);
      setLoading(false);
    });
  }, []);

  function actorLabel(l: LogEntry) {
    const actorRef = l.actor_id ?? l.actor_user_id ?? l.created_by ?? null;
    const name = actorRef ? staffNames[actorRef] : null;
    const role = l.actor_role ?? "system";
    if (name) return `${name} · ${role}`;
    return role;
  }

  const filtered = logs.filter((l) => {
    const haystack = `${l.action} ${l.description ?? ""} ${l.related_record ?? ""} ${actorLabel(l)}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-6">Activity Logs</h1>

      <div className="relative w-full max-w-sm mb-6">
        <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs…"
          className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No activity recorded yet.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">When</th>
                <th className="p-3 font-medium">Actor</th>
                <th className="p-3 font-medium">Action</th>
                <th className="p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-brown/10">
                  <td className="p-3 text-brown/70 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-brown capitalize">{actorLabel(l)}</td>
                  <td className="p-3 text-teal font-medium">{l.action}</td>
                  <td className="p-3 text-brown/80">{l.description ?? l.related_record ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
