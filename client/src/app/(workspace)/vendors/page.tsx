"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Search, Plus, ShieldCheck, AlertCircle, Check, FileCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  function load() {
    setLoading(true);
    api(`/vendors?q=${encodeURIComponent(q)}`)
      .then((d) => {
        setVendors(d.vendors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function verifyDoc(docId: string) {
    try {
      await api(`/vendors/compliance/${docId}/verify`, { method: "PATCH" });
      if (selectedVendor) {
        api(`/vendors/${selectedVendor.id}`).then((d) => setSelectedVendor(d.vendor));
      }
      load();
    } catch (err: any) {
      alert(err.message || "Failed to verify document");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">External Contractors</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Vendor & Contractor Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Credentialing, license & insurance compliance, trade categories, and dispatch eligibility.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, trade category, service area..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button onClick={load} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
          Search
        </button>
      </div>

      {/* Vendors Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading contractors...</div>
        ) : vendors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No vendors registered.</div>
        ) : (
          vendors.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {v.vendorCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{v.legalName}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.complianceStatus === "COMPLIANT"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {v.complianceStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">Categories: {v.serviceCategories}</p>
                <p className="text-[11px] text-slate-400">Coverage: {v.serviceArea}</p>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-0.5">
                  <p>Email: <span className="text-slate-800">{v.email}</span></p>
                  <p>Phone: <span className="text-slate-800">{v.phone}</span></p>
                  <p>Rating: <span className="font-bold text-amber-500">★ {v.rating}</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{v.complianceDocs?.length || 0} Docs on file</span>
                <button
                  onClick={() => {
                    api(`/vendors/${v.id}`).then((d) => setSelectedVendor(d.vendor));
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold"
                >
                  Compliance Profile →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Vendor Compliance Profile */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedVendor.legalName}</h2>
                <p className="text-xs text-slate-500">Compliance & Insurance Documents</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Uploaded Licenses & Policies</span>
              {!selectedVendor.complianceDocs?.length ? (
                <p className="text-xs text-slate-400 py-3">No compliance documents attached.</p>
              ) : (
                selectedVendor.complianceDocs.map((doc: any) => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{doc.docType}</span>
                        {doc.verified ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                            <Check size={10} /> Verified
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Pending Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Number: {doc.docNumber || "N/A"}</p>
                      <p className="text-[10px] text-slate-400">
                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                      </p>
                    </div>

                    {!doc.verified && (
                      <button
                        onClick={() => verifyDoc(doc.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1"
                      >
                        <ShieldCheck size={12} /> Verify
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
