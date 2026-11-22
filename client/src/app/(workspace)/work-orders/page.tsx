"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  Kanban,
  Table as TableIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

export default function WorkOrdersPage() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [kanbanData, setKanbanData] = useState<Record<string, any[]>>({});
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Work Order form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [category, setCategory] = useState("PLUMBING");
  const [woPriority, setWoPriority] = useState("NORMAL");
  const [estimatedCost, setEstimatedCost] = useState(150);

  function load() {
    setLoading(true);
    let url = `/work-orders?q=${encodeURIComponent(q)}`;
    let boardUrl = `/work-orders/board?q=${encodeURIComponent(q)}`;
    if (status) {
      url += `&status=${status}`;
      boardUrl += `&status=${status}`;
    }
    if (priority) {
      url += `&priority=${priority}`;
      boardUrl += `&priority=${priority}`;
    }

    Promise.all([api(url), api(boardUrl), api("/properties")])
      .then(([woRes, boardRes, propRes]) => {
        setWorkOrders(woRes.workOrders || []);
        setKanbanData(boardRes.columns || {});
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
  }, [status, priority]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/work-orders", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          propertyId,
          category,
          priority: woPriority,
          estimatedCost: Number(estimatedCost),
        }),
      });
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to create work order");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Field Operations</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Work Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Full lifecycle dispatch, state machine transitions, technician checklist, and quality verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch Table / Kanban */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <TableIcon size={14} /> List View
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Kanban size={14} /> Board View
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Plus size={15} />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, task title, property..."
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
            <option value="APPROVED">Approved</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* VIEW: Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading work orders...</div>
          ) : workOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No work orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Scope & Title</th>
                    <th className="py-3.5 px-4">Property & Unit</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Lifecycle State</th>
                    <th className="py-3.5 px-4">Assignee</th>
                    <th className="py-3.5 px-4">Checklist</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workOrders.map((wo) => {
                    const completedTasks = wo.checklists?.filter((c: any) => c.isCompleted).length || 0;
                    const totalTasks = wo.checklists?.length || 0;
                    return (
                      <tr key={wo.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link href={`/work-orders/${wo.id}`} className="font-bold text-blue-600 hover:underline">
                            {wo.reference}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <p className="font-bold text-slate-900 line-clamp-1">{wo.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{wo.description}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <p className="font-semibold">{wo.property?.name}</p>
                          <p className="text-[11px] text-slate-400">{wo.unit?.unitCode || "Common Area"}</p>
                        </td>
                        <td className="py-3.5 px-4">
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
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {wo.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {wo.assignedUser?.name || wo.assignedVendor?.legalName || (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {totalTasks > 0 ? (
                            <span className="font-medium text-[11px]">
                              {completedTasks}/{totalTasks} done
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No tasks</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/work-orders/${wo.id}`}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Kanban Board View */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
          {[
            {
              key: "SUBMITTED",
              keys: ["SUBMITTED", "PENDING_APPROVAL", "UNDER_REVIEW", "DRAFT"],
              label: "Triage & Review",
              color: "border-amber-400",
            },
            {
              key: "APPROVED",
              keys: ["APPROVED", "ASSIGNED", "SCHEDULED"],
              label: "Approved & Dispatch",
              color: "border-blue-400",
            },
            {
              key: "IN_PROGRESS",
              keys: ["IN_PROGRESS", "ON_HOLD"],
              label: "In Progress",
              color: "border-indigo-500",
            },
            {
              key: "COMPLETED",
              keys: ["COMPLETED", "VERIFIED", "PENDING_VERIFICATION", "CLOSED"],
              label: "Completed & Closed",
              color: "border-emerald-500",
            },
          ].map((col) => {
            const allItems = col.keys.flatMap((k) => kanbanData[k] || []);
            const uniqueMap = new Map();
            for (const item of allItems) {
              uniqueMap.set(item.id, item);
            }
            const list = Array.from(uniqueMap.values());
            return (
              <div key={col.key} className={`bg-slate-100/80 rounded-2xl p-3 border-t-4 ${col.color}`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  <span className="w-5 h-5 bg-white text-slate-600 rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {list.length === 0 ? (
                    <div className="p-4 bg-white/60 rounded-xl text-center text-[11px] text-slate-400 border border-dashed border-slate-200">
                      Empty column
                    </div>
                  ) : (
                    list.map((wo) => (
                      <Link
                        key={wo.id}
                        href={`/work-orders/${wo.id}`}
                        className="block bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-600">{wo.reference}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              wo.priority === "EMERGENCY"
                                ? "bg-red-100 text-red-700"
                                : wo.priority === "HIGH"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {wo.priority}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{wo.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {wo.property?.name} {wo.unit ? `· ${wo.unit.unitCode}` : ""}
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{wo.assignedUser?.name || wo.assignedVendor?.legalName || "Unassigned"}</span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full text-[9px] ${
                              wo.status === "CLOSED"
                                ? "bg-slate-200 text-slate-800"
                                : wo.status === "COMPLETED" || wo.status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : wo.status === "IN_PROGRESS"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {wo.status}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Work Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Create Work Order</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Property *</label>
              <select
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.propertyCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Task Title / Problem *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Repair leak under kitchen sink"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Scope of Work & Notes *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed instructions for the technician or contractor..."
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="PLUMBING">Plumbing</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="HVAC">HVAC</option>
                  <option value="APPLIANCE">Appliance</option>
                  <option value="STRUCTURAL">Structural</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Priority</label>
                <select
                  value={woPriority}
                  onChange={(e) => setWoPriority(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="EMERGENCY">Emergency (SLA 2h)</option>
                  <option value="HIGH">High (SLA 8h)</option>
                  <option value="NORMAL">Normal (SLA 24h)</option>
                  <option value="LOW">Low (SLA 72h)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Estimated ($)</label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Submit Work Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
