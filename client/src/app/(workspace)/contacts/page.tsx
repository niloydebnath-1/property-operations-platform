"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, Plus, Phone, Mail, Building } from "lucide-react";
import { api } from "@/lib/api";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [showModal, setShowModal] = useState(false);

  // New Contact State
  const [name, setName] = useState("");
  const [contactType, setContactType] = useState("TENANT");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");

  function load() {
    setLoading(true);
    let url = `/contacts?q=${encodeURIComponent(q)}`;
    if (type) url += `&type=${type}`;

    api(url)
      .then((d) => {
        setContacts(d.contacts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [type]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name,
          contactType,
          email,
          phone,
          company,
          address,
        }),
      });
      setShowModal(false);
      setName("");
      setEmail("");
      setPhone("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to create contact");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Relationship Management</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Clients, Tenants & Owners</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Directory of residents, corporate clients, asset owners, and vendor representatives.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Plus size={15} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, company..."
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
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none"
        >
          <option value="">All Contact Types</option>
          <option value="TENANT">Tenants / Residents</option>
          <option value="CLIENT">Commercial Clients</option>
          <option value="OWNER">Property Owners</option>
          <option value="VENDOR_REP">Vendor Representatives</option>
        </select>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading contacts directory...</div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No contacts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Linked Property / Unit</th>
                  <th className="py-3.5 px-4">Interactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      {c.company && <p className="text-[11px] text-slate-400">{c.company}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.contactType === "OWNER"
                            ? "bg-purple-100 text-purple-700"
                            : c.contactType === "TENANT"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {c.contactType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {c.email || "—"}</p>
                      <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {c.phone || "—"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {c.tenantedUnits?.length ? (
                        <span>
                          {c.tenantedUnits[0].unitCode} · {c.tenantedUnits[0].property?.name}
                        </span>
                      ) : c.ownedProperties?.length ? (
                        <span>Owner of {c.ownedProperties[0].name}</span>
                      ) : (
                        <span className="text-slate-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span>{c._count?.serviceRequests || 0} Requests</span> ·{" "}
                      <span>{c._count?.callLogs || 0} Calls</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Contact */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Contact</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Contact Type</label>
              <select
                value={contactType}
                onChange={(e) => setContactType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="TENANT">Tenant / Resident</option>
                <option value="CLIENT">Commercial Client</option>
                <option value="OWNER">Property Owner / Investor</option>
                <option value="VENDOR_REP">Vendor Representative</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Sterling Holdings LLC"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Create Contact
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
