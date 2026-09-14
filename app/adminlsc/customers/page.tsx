"use client";

import { useEffect, useState, Fragment } from "react";
import { Search, ChevronDown, ChevronUp, Phone, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { waLink } from "@/lib/whatsapp";

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
};

type CustomerOrder = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: customerRows }, { data: orderRows }] = await Promise.all([
        supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("orders").select("id, order_number, status, total, customer_id, created_at").order("created_at", { ascending: false }).limit(500)
      ]);
      setCustomers((customerRows as Customer[]) ?? []);
      setOrders((orderRows as any[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function ordersFor(customerId: string) {
    return (orders as any[]).filter((o) => o.customer_id === customerId);
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) => [c.full_name, c.phone, c.email ?? ""].some((f) => f.toLowerCase().includes(q)))
    : customers;

  return (
    <div>
      <h1 className="font-display text-display-md text-brown mb-2">Customers</h1>
      <p className="text-sm text-brown/50 mb-6">{customers.length} customers on record.</p>

      <div className="relative w-full sm:w-64 mb-6">
        <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email"
          className="border border-brown/20 rounded-sm pl-9 pr-3 py-2 text-sm bg-white w-full focus:border-teal transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-brown/50 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-brown/50 text-sm">No customers in this view.</p>
      ) : (
        <div className="bg-white border border-brown/10 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-cream text-brown/60 text-left">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Orders</th>
                <th className="p-3 font-medium">Total Spent</th>
                <th className="p-3 font-medium">Customer Since</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const custOrders = ordersFor(c.id);
                const totalSpent = custOrders
                  .filter((o) => o.status !== "cancelled")
                  .reduce((s, o) => s + Number(o.total), 0);
                return (
                  <Fragment key={c.id}>
                    <tr
                      className="border-t border-brown/10 cursor-pointer hover:bg-cream/40 transition-colors"
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      <td className="p-3 text-brown font-medium">{c.full_name}</td>
                      <td className="p-3 text-brown/70">
                        <p className="flex items-center gap-1.5"><Phone size={12} strokeWidth={1.75} />{c.phone}</p>
                        {c.email && <p className="flex items-center gap-1.5 text-xs"><Mail size={12} strokeWidth={1.75} />{c.email}</p>}
                      </td>
                      <td className="p-3 text-brown">{custOrders.length}</td>
                      <td className="p-3 text-brown whitespace-nowrap">KSh {totalSpent.toLocaleString()}</td>
                      <td className="p-3 text-brown/60 text-xs whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-3 text-right text-brown/40">
                        {expandedId === c.id ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr className="bg-cream/50 border-t border-brown/5">
                        <td colSpan={6} className="p-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-brown/60 uppercase tracking-wide">Order History</p>
                            <a
                              href={waLink(c.phone, `Hi ${c.full_name}, this is La Shefa Cafe reaching out.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal text-xs font-medium hover:underline inline-flex items-center gap-1"
                            >
                              <MessageCircle size={13} strokeWidth={1.75} />
                              Message on WhatsApp
                            </a>
                          </div>
                          {custOrders.length === 0 ? (
                            <p className="text-xs text-brown/40">No orders yet.</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {custOrders.map((o) => (
                                <li key={o.id} className="flex justify-between text-sm text-brown/80 max-w-lg">
                                  <span className="text-teal font-medium">{o.order_number}</span>
                                  <span className="capitalize text-brown/60">{o.status.replace(/_/g, " ")}</span>
                                  <span>{new Date(o.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                                  <span>KSh {Number(o.total).toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
