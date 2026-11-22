"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Search, Plus, MapPin, Users, Wrench, Layers } from "lucide-react";
import { api } from "@/lib/api";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [showModal, setShowModal] = useState(false);

  // New property form state
  const [name, setName] = useState("");
  const [propertyCode, setPropertyCode] = useState("");
  const [propType, setPropType] = useState("RESIDENTIAL");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Metro City");
  const [state, setState] = useState("CA");
  const [zipCode, setZipCode] = useState("90210");
  const [notes, setNotes] = useState("");

  function load() {
    setLoading(true);
    let url = `/properties?q=${encodeURIComponent(q)}`;
    if (status) url += `&status=${status}`;
    if (type) url += `&type=${type}`;

    api(url)
      .then((d) => {
        setProperties(d.properties || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status, type]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/properties", {
        method: "POST",
        body: JSON.stringify({
          name,
          propertyCode,
          type: propType,
          address,
          city,
          state,
          zipCode,
          notes,
        }),
      });
      setShowModal(false);
      setName("");
      setPropertyCode("");
      setAddress("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to create property");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Portfolio Management</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Properties</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage buildings, multi-family complexes, commercial towers, and sites.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus size={15} />
          <span>Add Property</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, address, city..."
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

        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="MIXED">Mixed Use</option>
            <option value="INDUSTRIAL">Industrial</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Properties Cards / Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No properties found. Add a new property to get started.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {p.propertyCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{p.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {p.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{p.address}, {p.city || ""} {p.state || ""}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Units</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{p._count?.units || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Open WOs</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{p._count?.workOrders || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Assets</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{p._count?.assets || 0}</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>
                    <span className="text-slate-400">Manager:</span> {p.manager?.name || "Unassigned"}
                  </p>
                  <p>
                    <span className="text-slate-400">Owner:</span> {p.owner?.name || "Corporate Asset"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">{p.type}</span>
                <Link
                  href={`/properties/${p.id}`}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Property */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Managed Property</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Property Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marina Bay Tower"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Property Code *</label>
                <input
                  type="text"
                  required
                  value={propertyCode}
                  onChange={(e) => setPropertyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PROP-MBT-01"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Property Type</label>
              <select
                value={propType}
                onChange={(e) => setPropType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="RESIDENTIAL">Residential (Multi-family / Condo)</option>
                <option value="COMMERCIAL">Commercial (Office / Retail)</option>
                <option value="MIXED">Mixed Use</option>
                <option value="INDUSTRIAL">Industrial / Warehouse</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Street Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Zip Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Operational Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Access codes, building features, amenities..."
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
                Create Property
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
