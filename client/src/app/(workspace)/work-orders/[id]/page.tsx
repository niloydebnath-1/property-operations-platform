"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Truck,
  Plus,
  Play,
  Pause,
  Check,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [wo, setWo] = useState<any>(null);
  const [permitted, setPermitted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Transition Modal
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [actualCost, setActualCost] = useState<number | "">("");
  const [closureSummary, setClosureSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New Checklist Item State
  const [newTask, setNewTask] = useState("");

  // Assignee Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeType, setAssigneeType] = useState<"TECHNICIAN" | "VENDOR">("TECHNICIAN");
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  function load() {
    setLoading(true);
    api(`/work-orders/${id}`)
      .then((d) => {
        setWo(d.workOrder);
        setPermitted(d.permittedTransitions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // Load eligible technicians and vendors for assignment
    api("/people/employees?department=MAINTENANCE")
      .then((d) => setTechnicians(d.employees || []))
      .catch(() => {});
    api("/vendors")
      .then((d) => setVendors(d.vendors || []))
      .catch(() => {});
  }, [id]);

  async function handleTransition(e: React.FormEvent) {
    e.preventDefault();
    if (!targetStatus) return;
    setSubmitting(true);
    try {
      await api(`/work-orders/${id}/transitions`, {
        method: "POST",
        body: JSON.stringify({
          toStatus: targetStatus,
          reason: transitionReason || `Moved to ${targetStatus}`,
          actualCost: actualCost !== "" ? Number(actualCost) : undefined,
          closureSummary: closureSummary || undefined,
        }),
      });
      setTargetStatus(null);
      setTransitionReason("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleChecklist(checklistId: string) {
    try {
      await api(`/work-orders/checklist/${checklistId}/toggle`, { method: "PATCH" });
      load();
    } catch (err: any) {
      alert(err.message || "Failed to toggle task");
    }
  }

  async function addChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await api(`/work-orders/${id}/checklist`, {
        method: "POST",
        body: JSON.stringify({ task: newTask }),
      });
      setNewTask("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to add checklist item");
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assigneeId) return;
    try {
      await api(`/work-orders/${id}/assignments`, {
        method: "POST",
        body: JSON.stringify({
          assigneeType,
          assigneeId,
          assigneeName,
        }),
      });
      setShowAssignModal(false);
      load();
    } catch (err: any) {
      alert(err.message || "Assignment failed");
    }
  }

  if (loading) return <div className="p-12 text-center text-xs text-slate-400">Loading work order lifecycle...</div>;
  if (!wo) return <div className="p-12 text-center text-xs text-slate-400">Work order not found.</div>;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status */}
      <div>
        <Link href="/work-orders" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2">
          <ArrowLeft size={13} /> Back to Work Orders Queue
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {wo.reference}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  wo.priority === "EMERGENCY"
                    ? "bg-red-100 text-red-700"
                    : wo.priority === "HIGH"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {wo.priority}
              </span>
              <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                {wo.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{wo.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {wo.property?.name} {wo.unit ? `· ${wo.unit.unitCode}` : ""} · Category: {wo.category}
            </p>
          </div>

          {/* Permitted State Transitions Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <User size={13} /> {wo.assigneeType ? "Reassign" : "Assign Resource"}
            </button>

            {permitted.map((target) => (
              <button
                key={target}
                onClick={() => {
                  setTargetStatus(target);
                  setTransitionReason("");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  target === "IN_PROGRESS"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : target === "COMPLETED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : target === "VERIFIED" || target === "CLOSED"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : target === "CANCELLED" || target === "REJECTED"
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    : "bg-slate-800 hover:bg-slate-900 text-white"
                }`}
              >
                Move to {target.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Execution */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scope, Checklist, Closure */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-400">
              Work Order Scope & Instructions
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{wo.description}</p>
            {wo.closureSummary && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Closure / Resolution Summary</span>
                <p className="text-xs text-emerald-900 mt-1">{wo.closureSummary}</p>
              </div>
            )}
          </div>

          {/* Interactive Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Execution Checklist & Proof of Work</h2>
                <p className="text-xs text-slate-500 mt-0.5">Technicians must check off all required steps</p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {wo.checklists?.filter((c: any) => c.isCompleted).length || 0} of {wo.checklists?.length || 0} done
              </span>
            </div>

            <div className="space-y-2">
              {!wo.checklists?.length ? (
                <p className="text-xs text-slate-400 py-3">No checklist tasks defined yet. Add the first task below.</p>
              ) : (
                wo.checklists.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      item.isCompleted
                        ? "bg-emerald-50/60 border-emerald-200 text-slate-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          item.isCompleted ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {item.isCompleted && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span className={`text-xs font-semibold ${item.isCompleted ? "line-through text-slate-500" : ""}`}>
                        {item.task}
                      </span>
                    </div>

                    {item.completedBy && (
                      <span className="text-[10px] text-slate-400">By {item.completedBy}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Task input */}
            <form onSubmit={addChecklist} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add checklist step (e.g. Test valve pressure for 5 mins)..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0"
              >
                Add Task
              </button>
            </form>
          </div>

          {/* Audit Event Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Lifecycle Audit & State History</h2>
            <div className="divide-y divide-slate-100">
              {!wo.events?.length ? (
                <p className="text-xs text-slate-400 py-3">No events recorded.</p>
              ) : (
                wo.events.map((ev: any) => (
                  <div key={ev.id} className="py-3 flex items-start justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {ev.fromStatus ? `${ev.fromStatus} → ${ev.toStatus}` : ev.toStatus}
                        </span>
                        <span className="text-[10px] text-slate-400">by {ev.actorName || "Staff"}</span>
                      </div>
                      {ev.reason && <p className="text-[11px] text-slate-600 mt-0.5">{ev.reason}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Assignee, Financials, Property Details */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Assigned Resource</span>
              <button
                onClick={() => setShowAssignModal(true)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Change
              </button>
            </div>

            {wo.assignedUser ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {wo.assignedUser.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{wo.assignedUser.name}</p>
                  <p className="text-[11px] text-slate-500">Internal Technician</p>
                  <p className="text-[10px] text-slate-400">{wo.assignedUser.email}</p>
                </div>
              </div>
            ) : wo.assignedVendor ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{wo.assignedVendor.legalName}</p>
                  <p className="text-[11px] text-slate-500">Contractor / Vendor</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    Compliance: {wo.assignedVendor.complianceStatus}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                No technician or vendor assigned yet.
              </div>
            )}
          </div>

          {/* Cost & Estimates Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 block pb-2 border-b border-slate-100">
              Cost & Financial Control
            </span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Estimated Budget</span>
              <span className="font-bold text-slate-900">
                {wo.estimatedCost ? `$${Number(wo.estimatedCost).toLocaleString()}` : "Not estimated"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Actual Cost Incurred</span>
              <span className="font-bold text-blue-600">
                {wo.actualCost ? `$${Number(wo.actualCost).toLocaleString()}` : "$0.00"}
              </span>
            </div>
          </div>

          {/* Location Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-800 block pb-2 border-b border-slate-100">Location</span>
            <p className="text-xs font-semibold text-slate-900">{wo.property?.name}</p>
            <p className="text-[11px] text-slate-500">{wo.property?.address}</p>
            {wo.unit && <p className="text-[11px] text-slate-600 font-medium">Unit: {wo.unit.unitCode}</p>}
          </div>
        </div>
      </div>

      {/* Modal: State Machine Transition */}
      {targetStatus && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleTransition}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Transition: {wo.status} → {targetStatus}
                </h2>
                <p className="text-xs text-slate-500">Provide required authorization reason</p>
              </div>
              <button
                type="button"
                onClick={() => setTargetStatus(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Reason / Operational Justification *</label>
              <textarea
                rows={2}
                required
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder="e.g. Work inspected and verified by property supervisor..."
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            {targetStatus === "COMPLETED" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Actual Labor & Material Cost ($)</label>
                  <input
                    type="number"
                    value={actualCost}
                    onChange={(e) => setActualCost(Number(e.target.value))}
                    placeholder="e.g. 185"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Completion Summary / Notes</label>
                  <textarea
                    rows={2}
                    value={closureSummary}
                    onChange={(e) => setClosureSummary(e.target.value)}
                    placeholder="Details of parts replaced, tests conducted, or cleanup done..."
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTargetStatus(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                {submitting ? "Updating..." : "Confirm Transition"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Assign Resource */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAssign}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Assign Dispatch Resource</h2>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Assignee Channel</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAssigneeType("TECHNICIAN");
                    setAssigneeId("");
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    assigneeType === "TECHNICIAN" ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Internal Staff
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssigneeType("VENDOR");
                    setAssigneeId("");
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    assigneeType === "VENDOR" ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Contractor / Vendor
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Select Qualified Resource *</label>
              <select
                required
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  if (assigneeType === "TECHNICIAN") {
                    const tech = technicians.find((t) => t.userId === e.target.value || t.id === e.target.value);
                    setAssigneeName(tech?.name || "");
                  } else {
                    const vnd = vendors.find((v) => v.id === e.target.value);
                    setAssigneeName(vnd?.legalName || "");
                  }
                }}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="">-- Choose resource --</option>
                {assigneeType === "TECHNICIAN"
                  ? technicians.map((t) => (
                      <option key={t.id} value={t.userId || t.id}>
                        {t.name} ({t.jobTitle})
                      </option>
                    ))
                  : vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.legalName} — {v.complianceStatus} ({v.serviceCategories})
                      </option>
                    ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
