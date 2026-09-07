"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LogEntry = {
  id: string;
  actor_role: string | null;
  action: string;
  description: string | null;
  related_record: string | null;
  created_at: string;
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setLogs((data as LogEntry[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter((l) => {
    const haystack = `${l.action} ${l.description ?? ""} ${l.related_record ?? ""} ${l.actor_role ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-brown mb-6">Activity Logs</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search logs…"
        className="w-full max-w-sm border border-brown/20 rounded-sm px-4 py-2 text-sm bg-white mb-6"
      />

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
                  <td className="p-3 text-brown capitalize">{l.actor_role ?? "system"}</td>
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
