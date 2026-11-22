"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, Search, Plus, Phone, Mail, Clock } from "lucide-react";
import { api } from "@/lib/api";

export default function PeoplePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    let url = "/people/employees";
    if (deptFilter) url += `?department=${deptFilter}`;
    api(url)
      .then((d) => {
        setEmployees(d.employees || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [deptFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Workforce Operations</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Staff, Technicians & Teams</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Internal workforce directory, department assignments, shift timings, and on-call schedules.
          </p>
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-xl focus:outline-none"
        >
          <option value="">All Departments</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="OPERATIONS">Operations</option>
          <option value="CUSTOMER_SUPPORT">Customer Support</option>
          <option value="FINANCE">Finance</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading staff directory...</div>
        ) : employees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No staff members found.</div>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {emp.employeeCode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{emp.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{emp.jobTitle}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {emp.status}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p className="flex items-center gap-1.5">
                  <Mail size={12} className="text-slate-400" /> {emp.email}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" /> Shift: {emp.shiftHours}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Department: <span className="font-semibold text-slate-700">{emp.department}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
