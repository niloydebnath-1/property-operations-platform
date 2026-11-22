"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cog, Plus, Play, Search, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<"plans" | "assets" | "inspections">("plans");
  const [plans, setPlans] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api("/maintenance/plans"), api("/maintenance/assets"), api("/maintenance/inspections")])
      .then(([pRes, aRes, iRes]) => {
        setPlans(pRes.plans || []);
        setAssets(aRes.assets || []);
        setInspections(iRes.inspections || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRunPMEngine() {
    setGenerating(true);
    setMessage("");
    try {
      const res = await api("/maintenance/plans/generate", { method: "POST" });
      setMessage(res.message || "PM tasks generated successfully");
      load();
    } catch (e: any) {
      setMessage(e.message || "Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Facility Engineering</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Maintenance & Asset Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Preventive maintenance recurrence engine, critical equipment register, and safety inspections.
          </p>
        </div>

        <button
          onClick={handleRunPMEngine}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
        >
          <Play size={14} className={generating ? "animate-spin" : ""} />
          <span>{generating ? "Generating Work Orders..." : "Run PM Scheduler"}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === "plans"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Preventive Plans ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === "assets"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Asset Register ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab("inspections")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === "inspections"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Inspections ({inspections.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Plans */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Scheduled Recurring Maintenance Plans</span>
                <span className="text-[11px] text-slate-400">Auto-generates due work orders idempotently</span>
              </div>

              {!plans.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No maintenance plans configured.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Plan Title</th>
                        <th className="py-3 px-3">Property / Asset</th>
                        <th className="py-3 px-3">Frequency</th>
                        <th className="py-3 px-3">Assigned Team</th>
                        <th className="py-3 px-3">Next Scheduled Due</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plans.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{p.title}</td>
                          <td className="py-3 px-3 text-slate-700">
                            {p.property?.name} {p.asset ? `· ${p.asset.name}` : ""}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                              {p.frequency}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{p.assignedTeam || "Maintenance Team"}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {new Date(p.nextDue).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {p.active ? "ACTIVE" : "PAUSED"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Assets */}
          {activeTab === "assets" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Maintainable Equipment & Systems</span>
              {!assets.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No assets in register.</div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((a) => (
                    <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {a.assetCode}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {a.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{a.name}</h3>
                      <p className="text-[11px] text-slate-500">{a.property?.name}</p>
                      <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 space-y-0.5">
                        <p>Category: <span className="font-semibold text-slate-700">{a.category}</span></p>
                        <p>Serial: <span className="font-semibold text-slate-700">{a.serialNo || "—"}</span></p>
                        <p>Condition: <span className="font-semibold text-slate-700">{a.condition}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Inspections */}
          {activeTab === "inspections" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Scheduled Building Inspections</span>
              {!inspections.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No inspections logged.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Inspection Code</th>
                        <th className="py-3 px-3">Property</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Scheduled Date</th>
                        <th className="py-3 px-3">Inspector</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspections.map((i) => (
                        <tr key={i.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{i.inspectionCode}</td>
                          <td className="py-3 px-3 text-slate-700">{i.property?.name}</td>
                          <td className="py-3 px-3 uppercase text-slate-600">{i.type}</td>
                          <td className="py-3 px-3">{new Date(i.scheduledAt).toLocaleDateString()}</td>
                          <td className="py-3 px-3 text-slate-600">{i.inspector?.name || "Staff Inspector"}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {i.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
