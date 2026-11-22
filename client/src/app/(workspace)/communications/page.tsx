"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneCall, Mail, Search, Plus, PhoneIncoming, PhoneOutgoing, Send, User } from "lucide-react";
import { api } from "@/lib/api";

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<"calls" | "emails" | "lookup">("calls");
  const [calls, setCalls] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Caller Lookup State (SRS Section 10)
  const [searchPhone, setSearchPhone] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);

  // Log Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [direction, setDirection] = useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [createReq, setCreateReq] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [properties, setProperties] = useState<any[]>([]);

  // Compose Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api("/communications/calls"), api("/communications/emails"), api("/properties")])
      .then(([cRes, eRes, pRes]) => {
        setCalls(cRes.calls || []);
        setEmails(eRes.emails || []);
        setProperties(pRes.properties || []);
        if (pRes.properties?.length && !propertyId) {
          setPropertyId(pRes.properties[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSearchCaller() {
    if (!searchPhone.trim()) return;
    try {
      const d = await api(`/communications/calls/lookup?phone=${encodeURIComponent(searchPhone)}`);
      setLookupResults(d.matches || []);
    } catch (e: any) {
      alert(e.message || "Lookup failed");
    }
  }

  async function handleLogCall(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/communications/calls", {
        method: "POST",
        body: JSON.stringify({
          direction,
          callerName,
          callerPhone,
          notes: callNotes,
          propertyId,
          createServiceRequest: createReq,
          requestTitle: reqTitle,
        }),
      });
      setShowCallModal(false);
      setCallerName("");
      setCallerPhone("");
      setCallNotes("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to log call");
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/communications/emails", {
        method: "POST",
        body: JSON.stringify({
          toEmail,
          subject: emailSubject,
          body: emailBody,
        }),
      });
      setShowEmailModal(false);
      setToEmail("");
      setEmailSubject("");
      setEmailBody("");
      load();
    } catch (err: any) {
      alert(err.message || "Failed to send email");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Omnichannel Desk</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Call Center & Email Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log tenant calls, instant caller lookup, linked service requests, and two-way email communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCallModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <PhoneCall size={14} /> Log Call
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Mail size={14} /> Compose Email
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab("calls")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "calls"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <PhoneCall size={14} /> Call Logs ({calls.length})
          </button>
          <button
            onClick={() => setActiveTab("emails")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "emails"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mail size={14} /> Unified Email Inbox ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab("lookup")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "lookup"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search size={14} /> Quick Caller Lookup
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Call Logs */}
          {activeTab === "calls" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Inbound & Outbound Communication Logs</span>
              {!calls.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No calls logged yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase font-semibold">
                        <th className="py-3 px-3">Call Ref</th>
                        <th className="py-3 px-3">Direction</th>
                        <th className="py-3 px-3">Caller & Phone</th>
                        <th className="py-3 px-3">Handled By</th>
                        <th className="py-3 px-3">Outcome</th>
                        <th className="py-3 px-3">Notes</th>
                        <th className="py-3 px-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calls.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{c.callRef}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                                c.direction === "INBOUND"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {c.direction === "INBOUND" ? <PhoneIncoming size={10} /> : <PhoneOutgoing size={10} />}
                              {c.direction}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-800 font-medium">
                            <p>{c.callerName || "Caller"}</p>
                            <p className="text-[10px] text-slate-400">{c.callerPhone}</p>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{c.agent?.name || "Agent"}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {c.outcome}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{c.notes || "—"}</td>
                          <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Email Inbox */}
          {activeTab === "emails" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Threaded Email Conversations</span>
              {!emails.length ? (
                <div className="py-8 text-center text-xs text-slate-400">No emails in inbox.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {emails.map((e) => (
                    <div key={e.id} className="py-3.5 hover:bg-slate-50 px-2 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              e.direction === "INBOUND" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {e.direction}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{e.fromEmail}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{e.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{e.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Caller Lookup */}
          {activeTab === "lookup" && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-700">Instant Tenant / Caller Identification</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter caller phone number to instantly find matching resident profile, property, unit, and open work orders.
                </p>
              </div>

              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. 555-123-4567"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCaller()}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSearchCaller}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Lookup Caller
                </button>
              </div>

              {lookupResults.length > 0 && (
                <div className="space-y-3 pt-2">
                  {lookupResults.map((contact) => (
                    <div key={contact.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">{contact.name}</h3>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {contact.contactType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">Phone: {contact.phone} · Email: {contact.email || "—"}</p>
                      {contact.tenantedUnits?.length ? (
                        <p className="text-xs text-slate-700 font-semibold">
                          Residence: {contact.tenantedUnits[0].unitCode} at {contact.tenantedUnits[0].property?.name}
                        </p>
                      ) : null}

                      {contact.serviceRequests?.length ? (
                        <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                          <span className="font-bold text-amber-700">Active Requests:</span>
                          {contact.serviceRequests.map((sr: any) => (
                            <p key={sr.id} className="text-[11px] mt-0.5">
                              • {sr.reference}: {sr.title} ({sr.status})
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400">No active service requests open.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Log Call */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleLogCall}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Log Interaction Call</h2>
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="INBOUND">Inbound Call (Client calling in)</option>
                <option value="OUTBOUND">Outbound Call (Agent calling out)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Caller Name</label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Call Summary & Notes</label>
              <textarea
                rows={3}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Topic discussed, tenant questions, resolutions..."
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createReq}
                  onChange={(e) => setCreateReq(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Convert into Service Request ticket immediately
              </label>

              {createReq && (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    required
                    placeholder="Issue Title (e.g. Kitchen sink drain clogged)"
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none"
                  />
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Call Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Compose Email */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSendEmail}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Compose Outbound Email</h2>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Recipient Email (To) *</label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="resident@example.com"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Subject *</label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Update regarding your maintenance request"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Message Body *</label>
              <textarea
                rows={5}
                required
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Dear Tenant, our maintenance team has scheduled your repair..."
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Send size={13} /> Send Email
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
