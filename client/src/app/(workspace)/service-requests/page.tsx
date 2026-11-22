"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Search, Plus, ArrowRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  // Convert to WO Modal
  const [convertModal, setConvertModal] = useState<any>(null);
  const [woTitle, setWoTitle] = useState("");
  const [woDesc, setWoDesc] = useState("");
  const [woCost, setWoCost] = useState(250);
  const [assigneeType, setAssigneeType] = useState<"TECHNICIAN" | "VENDOR">("TECHNICIAN");

  function load() {
    setLoading(true);
    let url = `/service-requests?q=${encodeURIComponent(q)}`;
    if (status) url += `&status=${status}`;
    if (priority) url += `&priority=${priority}`;

    api(url)
      .then((d) => {
        setRequests(d.requests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [status, priority]);

  function openConvert(r: any) {
    setConvertModal(r);
    setWoTitle(r.title);
    setWoDesc(r.description);
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!convertModal) return;
    try {
      await api(`/service-requests/${convertModal.id}/convert-to-work-order`, {
        method: "POST",
        body: JSON.stringify({
          title: woTitle,
          description: woDesc,
          estimatedCost: Number(woCost),
          assigneeType,
        }),
      });
      setConvertModal(null);
      load();
    } catch (err: any) {
      alert(err.message || "Failed to convert request");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Service Intake Desk</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Service Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Triage inbound issues from resident portal, phone calls, emails, and staff entries.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, issue description, requester..."
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
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CONVERTED_TO_WO">Converted to WO</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading requests queue...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No service requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Category / Issue</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Triage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-bold text-blue-600">{r.reference}</td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-slate-900 line-clamp-1">{r.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{r.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Category: {r.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-semibold">{r.property?.name}</p>
                      <p className="text-[11px] text-slate-400">{r.unit?.unitCode || "Common Area"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">By: {r.requester?.name || "Anonymous / Staff"}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {r.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === "CONVERTED_TO_WO"
                            ? "bg-purple-100 text-purple-700"
                            : r.status === "SUBMITTED"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === "CONVERTED_TO_WO" ? (
                        <span className="text-slate-400 text-[11px]">Converted</span>
                      ) : (
                        <button
                          onClick={() => openConvert(r)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ml-auto"
                        >
                          Convert to WO <ArrowRight size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Convert to Work Order */}
      {convertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConvert}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Convert Request to Work Order</h2>
                <p className="text-xs text-slate-500">Creating dispatchable work order from {convertModal.reference}</p>
              </div>
              <button
                type="button"
                onClick={() => setConvertModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Work Order Scope / Title *</label>
              <input
                type="text"
                required
                value={woTitle}
                onChange={(e) => setWoTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Detailed Instructions *</label>
              <textarea
                rows={3}
                required
                value={woDesc}
                onChange={(e) => setWoDesc(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={woCost}
                  onChange={(e) => setWoCost(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Assignee Channel</label>
                <select
                  value={assigneeType}
                  onChange={(e) => setAssigneeType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="TECHNICIAN">Internal Technician Team</option>
                  <option value="VENDOR">External Contractor / Vendor</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConvertModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Authorize & Convert →
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
