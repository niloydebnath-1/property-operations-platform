"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Shield,
  Key,
  History,
  Activity,
  Check,
  CheckCircle2,
  PhoneCall,
  Mail,
  CreditCard,
  RefreshCw,
  Building2,
  UserPlus,
  Search,
  Lock,
  Globe,
  Bell,
  FileCheck,
  AlertCircle,
  Save,
  ExternalLink,
  Zap,
  ChevronRight,
  Server,
  X,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "workflows" | "integrations" | "users" | "audit">("general");
  const [settings, setSettings] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for General Settings
  const [companyName, setCompanyName] = useState("Apex Property Management & Operations Ltd");
  const [taxId, setTaxId] = useState("TAX-US-8829104-E");
  const [address, setAddress] = useState("742 Evergreen Terrace, Suite 500, New York, NY 10001");
  const [supportPhone, setSupportPhone] = useState("+1 (800) 555-PROP");
  const [supportEmail, setSupportEmail] = useState("support@propertyops.com");
  const [billingEmail, setBillingEmail] = useState("billing@propertyops.com");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [operatingTimezone, setOperatingTimezone] = useState("America/New_York");

  // Workflow switches
  const [approvalThreshold, setApprovalThreshold] = useState("500");
  const [vendorThreshold, setVendorThreshold] = useState("1200");
  const [emergencyBypass, setEmergencyBypass] = useState(true);
  const [autoEmailConversion, setAutoEmailConversion] = useState(true);
  const [strictVendorCompliance, setStrictVendorCompliance] = useState(true);
  const [autoReceipts, setAutoReceipts] = useState(true);
  const [smsUrgentAlerts, setSmsUrgentAlerts] = useState(true);

  // Saving states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User Filter & Invite Modal
  const [userQuery, setUserQuery] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("PROPERTY_MANAGER");
  const [inviteDept, setInviteDept] = useState("Operations");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);

  // Integration simulator state
  const [simPhone, setSimPhone] = useState("+1 (555) 123-4567");
  const [simName, setSimName] = useState("Alice Morgan");
  const [simResult, setSimResult] = useState("");
  const [simBusy, setSimBusy] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api("/settings/company"),
      api("/settings/integrations"),
      api("/settings/audit"),
      api("/settings/users"),
    ])
      .then(([sRes, iRes, aRes, uRes]) => {
        const setList = sRes.settings || [];
        setSettings(setList);
        setIntegrations(iRes.integrations || []);
        setAuditLogs(aRes.logs || []);
        setUsers(uRes.users || []);

        // Prepopulate form values from DB settings
        setList.forEach((s: any) => {
          if (s.key === "COMPANY_NAME" && s.value) setCompanyName(s.value);
          if (s.key === "TAX_ID" && s.value) setTaxId(s.value);
          if (s.key === "COMPANY_ADDRESS" && s.value) setAddress(s.value);
          if (s.key === "SUPPORT_PHONE" && s.value) setSupportPhone(s.value);
          if (s.key === "DEFAULT_MAILBOX" && s.value) setSupportEmail(s.value);
          if (s.key === "BILLING_MAILBOX" && s.value) setBillingEmail(s.value);
          if (s.key === "BASE_CURRENCY" && s.value) setBaseCurrency(s.value);
          if (s.key === "OPERATING_TIMEZONE" && s.value) setOperatingTimezone(s.value);
          if (s.key === "APPROVAL_THRESHOLD_AMOUNT" && s.value) setApprovalThreshold(s.value);
          if (s.key === "EMERGENCY_OVERRIDE_ENABLED") setEmergencyBypass(s.value === "true");
        });

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await api("/settings/company/bulk", {
        method: "POST",
        body: JSON.stringify({
          settings: {
            COMPANY_NAME: companyName,
            TAX_ID: taxId,
            COMPANY_ADDRESS: address,
            SUPPORT_PHONE: supportPhone,
            DEFAULT_MAILBOX: supportEmail,
            BILLING_MAILBOX: billingEmail,
            BASE_CURRENCY: baseCurrency,
            OPERATING_TIMEZONE: operatingTimezone,
            APPROVAL_THRESHOLD_AMOUNT: approvalThreshold,
            VENDOR_THRESHOLD_AMOUNT: vendorThreshold,
            EMERGENCY_OVERRIDE_ENABLED: String(emergencyBypass),
            AUTO_EMAIL_CONVERSION: String(autoEmailConversion),
            STRICT_VENDOR_COMPLIANCE: String(strictVendorCompliance),
            AUTO_RECEIPTS_ENABLED: String(autoReceipts),
            SMS_URGENT_ALERTS: String(smsUrgentAlerts),
          },
        }),
      });

      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      load();
    } catch (err: any) {
      setSaving(false);
      alert(err.message || "Failed to save settings");
    }
  }

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault();
    setInviteBusy(true);
    try {
      await api("/settings/users", {
        method: "POST",
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          department: inviteDept,
          phone: invitePhone,
        }),
      });
      setInviteBusy(false);
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePhone("");
      load();
    } catch (err: any) {
      setInviteBusy(false);
      alert(err.message || "Failed to create user");
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      await api(`/settings/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      load();
    } catch (err: any) {
      alert(err.message || "Failed to update user");
    }
  }

  // Integrations simulators
  async function handleSimulateCall() {
    setSimBusy(true);
    setSimResult("");
    try {
      const res = await api("/integrations/telephony/simulate-call", {
        method: "POST",
        body: JSON.stringify({ callerPhone: simPhone, callerName: simName }),
      });
      setSimResult(`Call Logged: ${res.callLog.callRef}. Matched Resident: ${res.matchedContact || "New Caller"}`);
      load();
    } catch (e: any) {
      setSimResult(e.message || "Simulation failed");
    } finally {
      setSimBusy(false);
    }
  }

  async function handleSyncEmails() {
    setSimBusy(true);
    setSimResult("");
    try {
      const res = await api("/integrations/email/sync", { method: "POST" });
      setSimResult(res.message);
      load();
    } catch (e: any) {
      setSimResult(e.message || "Sync failed");
    } finally {
      setSimBusy(false);
    }
  }

  async function handleSimulateStripe() {
    setSimBusy(true);
    setSimResult("");
    try {
      const res = await fetch("http://localhost:4000/api/webhooks/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: {
            object: {
              id: `cs_test_${Date.now()}`,
              client_reference_id: "INV-2026-0007",
              amount_total: 32000,
            },
          },
        }),
      });
      const d = await res.json();
      setSimResult(`Stripe Webhook Accepted! Invoice ${d.invoiceNo || "INV-2026-0007"} marked as ${d.status || "PAID"}`);
      load();
    } catch (e: any) {
      setSimResult(e.message || "Webhook delivery failed");
    } finally {
      setSimBusy(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!userQuery) return true;
    const q = userQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  const filteredLogs = auditLogs.filter((log) => {
    if (!auditQuery) return true;
    const q = auditQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q) ||
      log.detail?.toLowerCase().includes(q) ||
      log.user?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-blue-600 font-extrabold bg-blue-50 px-2.5 py-0.5 rounded-full">
              Enterprise Administration
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Production Ready
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization & Platform Settings</h1>
          <p className="text-xs text-slate-500">
            Configure legal entity profiles, automated operational thresholds, team access permissions, and connected API adapters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 size={15} /> Settings Saved Successfully
            </span>
          )}
          <button
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Saving Changes..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Simulator Notification Toast */}
      {simResult && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={16} />
            </span>
            <div>
              <p className="font-bold text-slate-200">Simulation Event Delivered</p>
              <p className="text-slate-400 text-[11px]">{simResult}</p>
            </div>
          </div>
          <button
            onClick={() => setSimResult("")}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Settings Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto px-4">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "general"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <Building2 size={15} /> General & Organization
          </button>
          <button
            onClick={() => setActiveTab("workflows")}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "workflows"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <SlidersHorizontal size={15} /> Operations & Automation
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <Shield size={15} /> Team & Permissions ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "integrations"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <Zap size={15} /> Integration Hub (5 Connected)
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "audit"
                ? "border-blue-600 text-blue-600 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <History size={15} /> Security & Audit Log
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* ========================================================================= */}
          {/* TAB 1: GENERAL & ORGANIZATION                                             */}
          {/* ========================================================================= */}
          {activeTab === "general" && (
            <div className="space-y-8">
              {/* Organization Branding Card */}
              <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30 shrink-0">
                    PO
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold tracking-tight">{companyName}</h2>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md">
                        Enterprise Tier
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Licensed for unlimited commercial properties, multi-tenant portals, and telephony automation.
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                      <span>Server Engine: MariaDB 10.4 / Prisma 6.19</span>
                      <span>•</span>
                      <span>Tenant Invoicing Active</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => alert("Company avatar upload is managed via storage engine.")}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all border border-white/10"
                  >
                    Change Logo
                  </button>
                </div>
              </div>

              {/* Form Fields Grid */}
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Legal Entity Profile</h3>
                  <p className="text-xs text-slate-500">
                    This information appears on formal tenant invoices, work orders, and compliance reports.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Company Legal Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Federal Tax ID / VAT Number</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Operating Headquarters Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Central Support Helpline (Twilio)</label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tenant Support Email Address</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Official Billing & Invoicing Mailbox</label>
                    <input
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Base Currency</label>
                    <select
                      value={baseCurrency}
                      onChange={(e) => setBaseCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    >
                      <option value="USD">USD ($) - United States Dollar</option>
                      <option value="EUR">EUR (€) - Eurozone Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="CAD">CAD ($) - Canadian Dollar</option>
                      <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Operating Timezone</label>
                    <select
                      value={operatingTimezone}
                      onChange={(e) => setOperatingTimezone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium focus:outline-none transition-all"
                    >
                      <option value="America/New_York">Eastern Time (US & Canada, UTC-5)</option>
                      <option value="America/Chicago">Central Time (US & Canada, UTC-6)</option>
                      <option value="America/Denver">Mountain Time (US & Canada, UTC-7)</option>
                      <option value="America/Los_Angeles">Pacific Time (US & Canada, UTC-8)</option>
                      <option value="Europe/London">London / GMT (UTC+0)</option>
                      <option value="Asia/Dhaka">Dhaka / Bangladesh Standard Time (UTC+6)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Save size={14} />
                    {saving ? "Saving..." : "Save General Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: OPERATIONS & AUTOMATION                                            */}
          {/* ========================================================================= */}
          {activeTab === "workflows" && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Operational Automation & Thresholds</h3>
                <p className="text-xs text-slate-500">
                  Configure limits that trigger approvals, triage automation, and compliance rules.
                </p>
              </div>

              {/* Threshold Numbers */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Work Order Approval Threshold</span>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      ${approvalThreshold}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Repairs estimated above this amount require Property Manager approval before technician dispatch.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={approvalThreshold}
                      onChange={(e) => setApprovalThreshold(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">External Vendor PO Limit</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      ${vendorThreshold}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Vendor contracts exceeding this threshold require secondary sign-off from Chief Operations Officer.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={vendorThreshold}
                      onChange={(e) => setVendorThreshold(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Modern Feature Switches */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Automated Workflow Rules & Safeguards
                </span>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {/* Switch 1 */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-0.5 max-w-xl">
                      <span className="text-xs font-bold text-slate-900 block">
                        Emergency Priority Bypass Initial Approval
                      </span>
                      <p className="text-[11px] text-slate-500">
                        When a tenant submits a water flood, gas leak, or power failure, automatically set state to APPROVED and dispatch on-call technicians immediately.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmergencyBypass(!emergencyBypass)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        emergencyBypass ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          emergencyBypass ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 2 */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-0.5 max-w-xl">
                      <span className="text-xs font-bold text-slate-900 block">
                        Automatic Tenant Inbound Email Triage
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Webhook parses support emails from verified tenants and automatically creates formal Service Request tickets with category detection.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoEmailConversion(!autoEmailConversion)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoEmailConversion ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          autoEmailConversion ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 3 */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-0.5 max-w-xl">
                      <span className="text-xs font-bold text-slate-900 block">
                        Strict Vendor Insurance & Compliance Lockout
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Prohibit dispatching any vendor whose General Liability or Workers Comp insurance document is within 0 days of expiration.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStrictVendorCompliance(!strictVendorCompliance)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        strictVendorCompliance ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          strictVendorCompliance ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 4 */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-0.5 max-w-xl">
                      <span className="text-xs font-bold text-slate-900 block">
                        Instant Stripe Payment Digital Receipt Generation
                      </span>
                      <p className="text-[11px] text-slate-500">
                        When Stripe webhook fires checkout.session.completed, immediately mark invoice PAID and generate PDF receipt for tenant portal.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoReceipts(!autoReceipts)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        autoReceipts ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          autoReceipts ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 5 */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-0.5 max-w-xl">
                      <span className="text-xs font-bold text-slate-900 block">
                        SMS & Push Alerts for Urgent Incidents (Twilio)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Send automated SMS messages to property managers and technicians when critical repairs are raised.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSmsUrgentAlerts(!smsUrgentAlerts)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        smsUrgentAlerts ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          smsUrgentAlerts ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Save Automation Rules"}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: USERS & PERMISSIONS                                                */}
          {/* ========================================================================= */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">User Directory & Role Permissions (RBAC)</h3>
                  <p className="text-xs text-slate-500">
                    Manage administrative staff, property managers, field technicians, and accounting access.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-100 focus:bg-white text-xs rounded-xl border border-transparent focus:border-blue-400 focus:outline-none w-48"
                    />
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <UserPlus size={14} /> Invite User
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Role Access</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name?.slice(0, 2).toUpperCase() || "US"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.name}</p>
                              <p className="text-[11px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">{u.department || "General Operations"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              u.role === "SUPER_ADMIN"
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : u.role === "PROPERTY_MANAGER"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : u.role === "TECHNICIAN"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : u.role === "ACCOUNTANT"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {u.role?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(u.id, u.isActive)}
                            className="flex items-center gap-1.5 cursor-pointer"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.isActive ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            />
                            <span className={`font-semibold ${u.isActive ? "text-emerald-700" : "text-slate-400"}`}>
                              {u.isActive ? "Active" : "Suspended"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => toggleUserStatus(u.id, u.isActive)}
                            className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            {u.isActive ? "Suspend" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: INTEGRATIONS HUB & SIMULATORS                                      */}
          {/* ========================================================================= */}
          {activeTab === "integrations" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Connected Service Adapters & API Gateways</h3>
                <p className="text-xs text-slate-500">
                  Real-time webhook listeners, telephony PBX streams, payment gateways, and storage engines.
                </p>
              </div>

              {/* Integrations Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {integrations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-400 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={11} /> {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Latency: <strong className="text-slate-700">{item.latency || "35ms"}</strong></span>
                      <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {item.version || "API v1"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Integration Testing Sandbox */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-5 shadow-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Zap size={16} className="text-amber-400" /> Live Integration Sandbox & Webhook Testers
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Send simulated events to test database synchronization, automated ticket creation, and billing status transitions.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
                    Webhook Port :4000 Listening
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Twilio Simulator */}
                  <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                      <PhoneCall size={14} /> Twilio Telephony Call
                    </div>
                    <p className="text-[11px] text-slate-300">Simulate incoming resident call with automated caller lookup.</p>
                    <input
                      type="text"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <button
                      onClick={handleSimulateCall}
                      disabled={simBusy}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {simBusy ? "Triggering..." : "Simulate Inbound Call"}
                    </button>
                  </div>

                  {/* Email Sync */}
                  <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Mail size={14} /> Unified Mailbox Sync
                    </div>
                    <p className="text-[11px] text-slate-300">Poll SendGrid/Gmail inbox adapter and auto-create Service Requests.</p>
                    <div className="py-2.5 text-center text-[11px] text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                      Target: support@propertyops.com
                    </div>
                    <button
                      onClick={handleSyncEmails}
                      disabled={simBusy}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {simBusy ? "Syncing..." : "Run Mailbox Sync"}
                    </button>
                  </div>

                  {/* Stripe Simulator */}
                  <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                      <CreditCard size={14} /> Stripe Webhook Settlement
                    </div>
                    <p className="text-[11px] text-slate-300">Fire checkout.session.completed webhook to reconcile invoice status to PAID.</p>
                    <div className="py-2.5 text-center text-[11px] text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                      Payload: checkout.session.completed
                    </div>
                    <button
                      onClick={handleSimulateStripe}
                      disabled={simBusy}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {simBusy ? "Sending..." : "Fire Stripe Webhook"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: AUDIT LOG EXPLORER                                                 */}
          {/* ========================================================================= */}
          {activeTab === "audit" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tamper-Resistant Activity Audit Log</h3>
                  <p className="text-xs text-slate-500">
                    Immutable cryptographically timestamped records of administrative actions, logins, and status transitions.
                  </p>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search audit trail..."
                    value={auditQuery}
                    onChange={(e) => setAuditQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-100 focus:bg-white text-xs rounded-xl border border-transparent focus:border-blue-400 focus:outline-none w-56"
                  />
                </div>
              </div>

              {/* Logs Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Operator / User</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Audit Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{log.user?.name || "System"}</span>
                          <span className="text-[10px] text-slate-400 block">{log.user?.role || "AUTOMATION"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{log.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: INVITE TEAM MEMBER                                                 */}
      {/* ========================================================================= */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-4 flex justify-center items-start"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInviteModal(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 my-8 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. david.miller@propertyops.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Role Access</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="PROPERTY_MANAGER">Property Manager</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                    <option value="STAFF">General Staff</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Department</label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Facilities">Facilities</option>
                    <option value="Finance">Finance</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteBusy}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {inviteBusy ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
