"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Search, Filter, Building2, User } from "lucide-react";
import { api } from "@/lib/api";

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  function load() {
    setLoading(true);
    let url = `/units?q=${encodeURIComponent(q)}`;
    if (status) url += `&status=${status}`;

    api(url)
      .then((d) => {
        setUnits(d.units || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Inventory & Occupancy</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Units Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track unit occupancy, rent rates, floor locations, and assigned resident contacts.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by unit code or property name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button onClick={load} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
            Search
          </button>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="VACANT">Vacant</option>
          <option value="UNDER_MAINTENANCE">Maintenance</option>
          <option value="RESERVED">Reserved</option>
        </select>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading units inventory...</div>
        ) : units.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No units matched your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Floor / Type</th>
                  <th className="py-3.5 px-4">Area</th>
                  <th className="py-3.5 px-4">Rent Rate</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Resident / Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.unitCode}</td>
                    <td className="py-3.5 px-4 text-blue-600 font-medium">
                      <Link href={`/properties/${u.property?.id}`}>{u.property?.name}</Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      Floor {u.floor || "1"} · <span className="uppercase text-[11px]">{u.type}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.areaSqFt ? `${u.areaSqFt} sq ft` : "—"}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {u.rentAmount ? `$${Number(u.rentAmount).toLocaleString()}/mo` : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === "OCCUPIED"
                            ? "bg-emerald-100 text-emerald-700"
                            : u.status === "RESERVED"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.currentTenant ? (
                        <div>
                          <p className="font-semibold text-slate-800">{u.currentTenant.name}</p>
                          <p className="text-[10px] text-slate-400">{u.currentTenant.phone || u.currentTenant.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Active Tenant</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
