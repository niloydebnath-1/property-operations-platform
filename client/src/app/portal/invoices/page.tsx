"use client";

import { useEffect, useState } from "react";
import { DollarSign, CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

export default function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<any>(null);
  const [paySuccess, setPaySuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function load() {
    setLoading(true);
    api("/finance/invoices")
      .then((d) => {
        setInvoices(d.invoices || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSimulatedStripeCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!payingInvoice) return;
    setIsProcessing(true);
    setPaySuccess("");

    try {
      // Trigger Stripe Webhook directly to simulate checkout session completion
      const res = await fetch("http://localhost:4000/api/webhooks/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              id: `cs_live_${Date.now()}`,
              client_reference_id: payingInvoice.invoiceNo,
              amount_total: Math.round(Number(payingInvoice.balanceDue) * 100),
            },
          },
        }),
      });

      const d = await res.json();
      setPaySuccess(`Payment of $${Number(payingInvoice.balanceDue).toFixed(2)} processed via Stripe! Receipt issued.`);
      setPayingInvoice(null);
      load();
    } catch (err: any) {
      alert(err.message || "Checkout failed");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Rent Statements & Online Payments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review monthly rent invoices, security deposits, payment history, and pay online with credit card or ACH wire.
        </p>
      </div>

      {paySuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span className="font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} /> {paySuccess}
          </span>
          <button onClick={() => setPaySuccess("")} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading billing statements...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No statements due. You are all caught up!
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{inv.invoiceNo}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inv.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{inv.notes || "Monthly rental statement"}</p>
                <p className="text-[11px] text-slate-400">
                  Due date: {new Date(inv.dueDate).toLocaleDateString()} · Property: {inv.property?.name || "Portfolio"}
                </p>
              </div>

              <div className="flex items-center gap-4 sm:text-right">
                <div>
                  <p className="text-xs text-slate-400">Total Billed</p>
                  <p className="text-base font-bold text-slate-900">${Number(inv.total).toFixed(2)}</p>
                  {Number(inv.balanceDue) > 0 && (
                    <p className="text-[11px] font-bold text-amber-600">Balance: ${Number(inv.balanceDue).toFixed(2)}</p>
                  )}
                </div>

                {Number(inv.balanceDue) > 0 ? (
                  <button
                    onClick={() => setPayingInvoice(inv)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <CreditCard size={14} /> Pay with Stripe
                  </button>
                ) : (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={15} /> Settled
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Stripe Hosted Checkout Simulation */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSimulatedStripeCheckout}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Stripe Hosted Checkout</h2>
                  <p className="text-[10px] text-slate-400">Secure 256-bit Encrypted Card Payment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Invoice:</span>
                <span className="font-semibold text-slate-800">{payingInvoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                <span>Amount to Charge:</span>
                <span className="text-blue-600">${Number(payingInvoice.balanceDue).toFixed(2)} USD</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Cardholder Name</label>
              <input
                type="text"
                required
                defaultValue="Alice Morgan"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Card Number (Test Mode)</label>
              <input
                type="text"
                required
                defaultValue="4242 •••• •••• 4242"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Expires</label>
                <input
                  type="text"
                  required
                  defaultValue="12/28"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">CVC</label>
                <input
                  type="text"
                  required
                  defaultValue="123"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                {isProcessing ? "Processing..." : `Pay $${Number(payingInvoice.balanceDue).toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
