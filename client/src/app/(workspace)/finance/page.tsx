"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Search, Plus, CreditCard, ArrowDownRight, ArrowUpRight, CheckCircle2, FileText, Printer, Download, X } from "lucide-react";
import { api } from "@/lib/api";

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses">("invoices");
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("BANK_TRANSFER");
  const [payNotes, setPayNotes] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api("/finance/invoices"), api("/finance/expenses")])
      .then(([invRes, expRes]) => {
        setInvoices(invRes.invoices || []);
        setExpenses(expRes.expenses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openPayModal(inv: any) {
    setSelectedInvoice(inv);
    setPayAmount(Number(inv.balanceDue));
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api("/finance/payments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          referenceNotes: payNotes,
        }),
      });
      setSelectedInvoice(null);
      load();
    } catch (err: any) {
      alert(err.message || "Payment allocation failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Accounting & Billing</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Invoices, Billing & Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sequential invoice register, tenant and vendor statements, payment reconciliation, and cost ledger.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "invoices"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <DollarSign size={14} /> Invoices & Bills ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "expenses"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard size={14} /> Cost & Expense Ledger ({expenses.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Invoices */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Issued Statements & Open Receivables</span>
              {!invoices.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No invoices recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Invoice No</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Party / Billed To</th>
                        <th className="py-3 px-3">Property</th>
                        <th className="py-3 px-3">Total Amount</th>
                        <th className="py-3 px-3">Balance Due</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{inv.invoiceNo}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {inv.partyType}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-800 font-medium">
                            {inv.contact?.name || inv.vendor?.legalName || "General Account"}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{inv.property?.name || "Portfolio"}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ${Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-600">
                            ${Number(inv.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.status === "PAID"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : inv.status === "PARTIALLY_PAID"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href="/reports"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1"
                                title="View in Reports & Export PDF"
                              >
                                <FileText size={11} /> PDF
                              </Link>
                              {Number(inv.balanceDue) > 0 ? (
                                <button
                                  onClick={() => openPayModal(inv)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold"
                                >
                                  Record Pay
                                </button>
                              ) : (
                                <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1 pl-1">
                                  <CheckCircle2 size={12} /> Settled
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Expenses */}
          {activeTab === "expenses" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Property Maintenance Expenses & Materials</span>
              {!expenses.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No expenses logged.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Expense Ref</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Description</th>
                        <th className="py-3 px-3">Property</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{exp.expenseRef}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{exp.description || "—"}</td>
                          <td className="py-3 px-3 text-slate-600">{exp.property?.name}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              {exp.status}
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

      {/* Modal: Record Payment */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Record Payment Allocation</h2>
                <p className="text-xs text-slate-500">Invoice: {selectedInvoice.invoiceNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-semibold text-slate-800">${Number(selectedInvoice.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Current Balance Due:</span>
                <span>${Number(selectedInvoice.balanceDue).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Payment Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                max={Number(selectedInvoice.balanceDue)}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CHEQUE">Paper Cheque</option>
                <option value="CASH">Cash Deposit</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Transaction Notes / Reference</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g. Wire confirmation #881294"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Confirm Allocation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
