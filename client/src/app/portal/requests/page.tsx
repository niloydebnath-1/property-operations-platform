"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export default function TenantRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PLUMBING");
  const [priority, setPriority] = useState("NORMAL");
  const [propertyId, setPropertyId] = useState("");
  const [accessNotes, setAccessNotes] = useState("Permission to enter if tenant is away");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api("/service-requests"), api("/properties")])
      .then(([reqRes, propRes]) => {
        setRequests(reqRes.requests || []);
        setProperties(propRes.properties || []);
        if (propRes.properties?.length && !propertyId) {
          setPropertyId(propRes.properties[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/service-requests", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          source: "PORTAL",
          propertyId,
          accessNotes,
        }),
      });
      setShowModal(false);
      setTitle("");
      setDescription("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Maintenance & Service Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Report issues in your unit or common areas, track repair status, and review technician updates.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Plus size={15} />
          <span>New Service Request</span>
        </button>
      </div>

      {/* Requests Timeline Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your service tickets...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No active maintenance requests. Click "New Service Request" if you need repairs.
          </div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {r.reference}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.priority === "EMERGENCY"
                        ? "bg-red-100 text-red-700"
                        : r.priority === "HIGH"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {r.priority}
                  </span>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                  {r.status.replace(/_/g, " ")}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{r.property?.name} {r.unit ? `· ${r.unit.unitCode}` : ""}</span>
                <span>Submitted: {new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Service Request */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Submit Service Request</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Select Property / Building</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Issue Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dishwasher leaking water onto floor"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Problem Description *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, when it started, and exact room location..."
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="PLUMBING">Plumbing / Water</option>
                  <option value="ELECTRICAL">Electrical / Lighting</option>
                  <option value="HVAC">Heating & AC</option>
                  <option value="APPLIANCE">Kitchen Appliances</option>
                  <option value="GENERAL">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Urgency</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="NORMAL">Normal (Within 24-48h)</option>
                  <option value="HIGH">Urgent (Within 8h)</option>
                  <option value="EMERGENCY">Emergency (Immediate)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Unit Entry Permission / Access Notes</label>
              <input
                type="text"
                value={accessNotes}
                onChange={(e) => setAccessNotes(e.target.value)}
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
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                {submitting ? "Sending..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
