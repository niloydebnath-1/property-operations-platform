"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Home,
  Wrench,
  Cog,
  FileText,
  ClipboardCheck,
  Plus,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [property, setProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"units" | "workOrders" | "assets" | "inspections" | "documents">("units");
  const [loading, setLoading] = useState(true);

  // Unit modal
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitCode, setUnitCode] = useState("");
  const [floor, setFloor] = useState("1");
  const [unitType, setUnitType] = useState("APARTMENT");
  const [rentAmount, setRentAmount] = useState(2000);
  const [areaSqFt, setAreaSqFt] = useState(800);

  function load() {
    setLoading(true);
    api(`/properties/${id}`)
      .then((d) => {
        setProperty(d.property);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/units", {
        method: "POST",
        body: JSON.stringify({
          propertyId: id,
          unitCode,
          floor,
          type: unitType,
          rentAmount: Number(rentAmount),
          areaSqFt: Number(areaSqFt),
        }),
      });
      setShowUnitModal(false);
      setUnitCode("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to create unit");
    }
  }

  if (loading) return <div className="p-12 text-center text-xs text-slate-400">Loading property profile...</div>;
  if (!property) return <div className="p-12 text-center text-xs text-slate-400">Property not found.</div>;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <Link href="/properties" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2">
          <ArrowLeft size={13} /> Back to Properties
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {property.propertyCode}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {property.status}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase">{property.type}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{property.name}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin size={13} /> {property.address}, {property.city} {property.state} {property.zipCode}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus size={14} /> Add Unit
            </button>
            <Link
              href="/work-orders"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              <Wrench size={14} /> Create WO
            </Link>
          </div>
        </div>
      </div>

      {/* Property Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Manager</span>
          <p className="text-sm font-bold text-slate-800 mt-1">{property.manager?.name || "Unassigned"}</p>
          <p className="text-[10px] text-slate-400">{property.manager?.email || "—"}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400">Ownership</span>
          <p className="text-sm font-bold text-slate-800 mt-1">{property.owner?.name || "Sterling Assets LLC"}</p>
          <p className="text-[10px] text-slate-400">{property.owner?.phone || "—"}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400">Units Total</span>
          <p className="text-sm font-bold text-slate-800 mt-1">{property.units?.length || 0} Units</p>
          <p className="text-[10px] text-slate-400">
            {property.units?.filter((u: any) => u.status === "OCCUPIED").length || 0} Occupied
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Work Orders</span>
          <p className="text-sm font-bold text-slate-800 mt-1">{property.workOrders?.length || 0} Open</p>
          <p className="text-[10px] text-slate-400">Traceable lifecycle</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab("units")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "units"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Home size={14} /> Units ({property.units?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("workOrders")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "workOrders"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench size={14} /> Work Orders ({property.workOrders?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "assets"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Cog size={14} /> Assets ({property.assets?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("inspections")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "inspections"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ClipboardCheck size={14} /> Inspections ({property.inspections?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "documents"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText size={14} /> Documents ({property.documents?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Units */}
          {activeTab === "units" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Units & Assigned Tenants</span>
                <button
                  onClick={() => setShowUnitModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Unit
                </button>
              </div>

              {!property.units?.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No units added yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Unit Code</th>
                        <th className="py-3 px-3">Floor</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Area</th>
                        <th className="py-3 px-3">Rent</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Current Tenant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {property.units.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{u.unitCode}</td>
                          <td className="py-3 px-3 text-slate-600">Floor {u.floor || "—"}</td>
                          <td className="py-3 px-3 text-slate-600 uppercase">{u.type}</td>
                          <td className="py-3 px-3 text-slate-600">{u.areaSqFt ? `${u.areaSqFt} sq ft` : "—"}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {u.rentAmount ? `$${Number(u.rentAmount).toLocaleString()}` : "—"}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === "OCCUPIED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {u.currentTenant ? (
                              <div>
                                <p className="font-semibold">{u.currentTenant.name}</p>
                                <p className="text-[10px] text-slate-400">{u.currentTenant.phone || u.currentTenant.email}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Vacant</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Work Orders */}
          {activeTab === "workOrders" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Property Work Orders</span>
                <Link href="/work-orders" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Manage all →
                </Link>
              </div>

              {!property.workOrders?.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No work orders recorded for this property.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Reference</th>
                        <th className="py-3 px-3">Issue Title</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Assignee</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {property.workOrders.map((wo: any) => (
                        <tr key={wo.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-blue-600">{wo.reference}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{wo.title}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                wo.priority === "EMERGENCY"
                                  ? "bg-red-100 text-red-700"
                                  : wo.priority === "HIGH"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {wo.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                              {wo.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {wo.assignedUser?.name || wo.assignedVendor?.legalName || "Unassigned"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/work-orders/${wo.id}`}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Assets */}
          {activeTab === "assets" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Equipment & Building Assets</span>
                <Link href="/maintenance" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Asset Register →
                </Link>
              </div>

              {!property.assets?.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No assets linked to this property.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {property.assets.map((a: any) => (
                    <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{a.name}</span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {a.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Code: <span className="font-semibold text-slate-700">{a.assetCode}</span> · S/N: {a.serialNo || "—"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Status: <span className="font-semibold text-emerald-600">{a.status}</span> · Condition: {a.condition}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Inspections */}
          {activeTab === "inspections" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Recent Inspection Records</span>
              {!property.inspections?.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No inspections logged for this property.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {property.inspections.map((insp: any) => (
                    <div key={insp.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 mr-2">{insp.inspectionCode}</span>
                        <span className="text-slate-500 uppercase">{insp.type}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Scheduled: {new Date(insp.scheduledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {insp.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Documents */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Attached Documents & Manuals</span>
              {!property.documents?.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No documents uploaded.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {property.documents.map((d: any) => (
                    <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-800">{d.fileName}</p>
                          <p className="text-[10px] text-slate-400">{d.fileCategory} · {d.fileSizeKb} KB</p>
                        </div>
                      </div>
                      <span className="text-blue-600 font-semibold cursor-pointer">Download</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Unit */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUnit}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Unit to {property.name}</h2>
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Unit Code / Number *</label>
                <input
                  type="text"
                  required
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  placeholder="e.g. Unit 302"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Floor Level</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Unit Type</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="APARTMENT">Apartment / Residential</option>
                <option value="STUDIO">Studio</option>
                <option value="OFFICE">Commercial Office</option>
                <option value="RETAIL">Retail Space</option>
                <option value="STORAGE">Storage / Warehouse</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Monthly Rent ($)</label>
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Area (Sq Ft)</label>
                <input
                  type="number"
                  value={areaSqFt}
                  onChange={(e) => setAreaSqFt(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUnitModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Unit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
