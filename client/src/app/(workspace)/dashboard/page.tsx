"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Wrench,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCw,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPM, setGeneratingPM] = useState(false);
  const [pmMessage, setPmMessage] = useState("");

  function loadDashboard() {
    setLoading(true);
    api("/dashboard")
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function triggerPMEngine() {
    setGeneratingPM(true);
    setPmMessage("");
    try {
      const res = await api("/maintenance/plans/generate", { method: "POST" });
      setPmMessage(res.message || "PM tasks generated successfully");
      loadDashboard();
    } catch (e: any) {
      setPmMessage(e.message || "Failed to generate PM tasks");
    } finally {
      setGeneratingPM(false);
    }
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">
            Executive Summary
          </span>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1">
            Property Operations Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status across properties, dispatch queue, maintenance, and finance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerPMEngine}
            disabled={generatingPM}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200/60 transition-colors"
            title="Scan maintenance plans and auto-generate due work orders"
          >
            <Play size={14} className={generatingPM ? "animate-spin" : ""} />
            <span>{generatingPM ? "Generating..." : "Run PM Scheduler"}</span>
          </button>
          <Link
            href="/work-orders"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/30 transition-all"
          >
            <span>＋ New Work Order</span>
          </Link>
        </div>
      </div>

      {pmMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>{pmMessage}</span>
          <button onClick={() => setPmMessage("")} className="text-emerald-600 font-bold">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Managed Properties"
          value={metrics.totalProperties ?? 3}
          hint={`${metrics.totalUnits ?? 7} units total`}
          icon={Building2}
          color="blue"
        />
        <KpiCard
          label="Occupancy Rate"
          value={metrics.occupancyRate ?? "71%"}
          hint={`${metrics.occupiedUnits ?? 5} units occupied`}
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          label="Active Work Orders"
          value={metrics.openWorkOrders ?? 3}
          hint="Open operational queue"
          icon={Wrench}
          color="amber"
        />
        <KpiCard
          label="Emergency Tickets"
          value={metrics.emergencyWorkOrders ?? 1}
          hint="Requires immediate SLA"
          icon={AlertTriangle}
          color="red"
        />
        <KpiCard
          label="Active Vendors"
          value={metrics.activeVendors ?? 2}
          hint="Compliant contractors"
          icon={ShieldCheck}
          color="indigo"
        />
        <KpiCard
          label="YTD Collections"
          value={`$${Number(metrics.totalRevenue || 2850).toLocaleString()}`}
          hint={`$${Number(metrics.outstandingReceivables || 9120).toLocaleString()} outstanding`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Operations Grid: Urgent Tickets & PM Plans */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Urgent & Active Work Orders */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Priority Work Order Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">Dispatched work requiring attention and progress verification</p>
            </div>
            <Link href="/work-orders" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View all ({metrics.openWorkOrders || 0}) <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {!data?.urgentWorkOrders?.length ? (
              <div className="py-8 text-center text-xs text-slate-400">No open priority work orders.</div>
            ) : (
              data.urgentWorkOrders.map((wo: any) => (
                <div key={wo.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{wo.reference}</span>
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
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {wo.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 line-clamp-1">{wo.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {wo.property?.name} {wo.unit ? `· ${wo.unit.unitCode}` : ""} · Assignee:{" "}
                      <span className="text-slate-600 font-medium">
                        {wo.assignedUser?.name || wo.assignedVendor?.legalName || "Unassigned"}
                      </span>
                    </p>
                  </div>

                  <Link
                    href={`/work-orders/${wo.id}`}
                    className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Manage →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preventive Maintenance Plans */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Maintenance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Recurring preventive plans</p>
            </div>
            <Link href="/maintenance" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Plans →
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {!data?.upcomingMaintenance?.length ? (
              <div className="py-8 text-center text-xs text-slate-400">No scheduled maintenance plans.</div>
            ) : (
              data.upcomingMaintenance.map((plan: any) => (
                <div key={plan.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{plan.title}</span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {plan.frequency}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {plan.property?.name} {plan.asset ? `· ${plan.asset.name}` : ""}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} /> Next Due: {new Date(plan.nextDue).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Log Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Audit Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">Immutable record of operations, assignments and status transitions</p>
          </div>
          <Link href="/settings" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            View full log →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {!data?.recent?.length ? (
            <div className="py-6 text-center text-xs text-slate-400">No recent activity recorded.</div>
          ) : (
            data.recent.map((a: any) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 mr-2">{a.action}</span>
                  <span className="text-slate-600">{a.detail}</span>
                  <span className="text-slate-400 text-[10px] ml-2">by {a.user?.name || "System"}</span>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 leading-tight">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${colorMap[color] || colorMap.blue}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="mt-2">
        <span className="text-2xl font-black text-slate-900 tracking-tight">{value}</span>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{hint}</p>
      </div>
    </div>
  );
}
