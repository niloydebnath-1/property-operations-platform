"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Wrench,
  ShieldCheck,
  DollarSign,
  Download,
  FileText,
  Building2,
  Users,
  CheckCircle2,
  Printer,
  X,
  Eye,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"kpi" | "workOrders" | "finance" | "portfolio" | "vendors">("kpi");
  const [loading, setLoading] = useState(true);

  // Invoice Printable Modal
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [printableLoading, setPrintableLoading] = useState(false);
  const [printableData, setPrintableData] = useState<any>(null);

  // Tab-Specific Report Document Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Filters for Work Orders tab
  const [woStatusFilter, setWoStatusFilter] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  // Keyboard shortcut to close modals with Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeAllModals();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function closeAllModals() {
    setSelectedInvoice(null);
    setPrintableData(null);
    setShowReportModal(false);
  }

  function loadReports() {
    setLoading(true);
    Promise.all([api("/reports/summary"), api("/reports/detailed")])
      .then(([summary, detailed]) => {
        setSummaryData(summary);
        setDetailedData(detailed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function openInvoicePrintModal(invoiceId: string) {
    setPrintableLoading(true);
    setSelectedInvoice(invoiceId);
    try {
      const data = await api(`/reports/invoices/${invoiceId}/printable`);
      setPrintableData(data);
      setPrintableLoading(false);
    } catch {
      setPrintableLoading(false);
    }
  }

  // =========================================================================
  // 1. GENERATE AUTHENTIC REAL .PDF INVOICE (No .html!)
  // =========================================================================
  function downloadPdfInvoice() {
    if (!printableData) return;
    const inv = printableData.invoice;
    const comp = printableData.company;

    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue
    doc.setFont("helvetica", "bold");
    doc.text("PropertyOps", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont("helvetica", "normal");
    doc.text(comp?.name || "PropertyOps Enterprise Operations Platform", 14, 26);
    doc.text(comp?.address || "742 Evergreen Terrace, Suite 500, New York, NY", 14, 31);
    doc.text(`${comp?.phone || "+1 (800) 555-PROP"}   |   ${comp?.email || "billing@propertyops.com"}`, 14, 36);

    // Right Header (Invoice meta)
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 196, 20, { align: "right" });

    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text(inv.invoiceNo, 196, 27, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Status: ${inv.status}`, 196, 33, { align: "right" });
    doc.text(`Issue Date: ${new Date(inv.createdAt).toLocaleDateString()}`, 196, 38, { align: "right" });
    doc.text(`Due Date: ${new Date(inv.dueDate).toLocaleDateString()}`, 196, 43, { align: "right" });

    // Line Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);

    // Billed To Section
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(148, 163, 184);
    doc.text("BILLED TO / CUSTOMER:", 14, 55);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(inv.contact?.name || inv.vendor?.legalName || "Client Account", 14, 62);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(inv.property?.name || "Portfolio Wide Management", 14, 68);
    if (inv.contact?.email || inv.vendor?.email) {
      doc.text(inv.contact?.email || inv.vendor?.email || "", 14, 73);
    }

    // Line items table
    const tableData = (inv.lines || []).map((l: any) => [
      l.description,
      String(l.quantity),
      `$${Number(l.unitPrice).toFixed(2)}`,
      `$${Number(l.amount).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Item Description & Services", "Qty", "Unit Price", "Total Amount"]],
      body:
        tableData.length > 0
          ? tableData
          : [["Property Maintenance & Operations", "1", `$${Number(inv.total).toFixed(2)}`, `$${Number(inv.total).toFixed(2)}`]],
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: "center", cellWidth: 20 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", cellWidth: 35 },
      },
      theme: "grid",
    });

    // Summary calculations
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal:", 140, finalY);
    doc.text(`$${Number(inv.subtotal || inv.total).toFixed(2)}`, 196, finalY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Total Amount:", 140, finalY + 6);
    doc.text(`$${Number(inv.total).toFixed(2)}`, 196, finalY + 6, { align: "right" });

    const paidAmount = Number(inv.total) - Number(inv.balanceDue);
    doc.setTextColor(22, 163, 74); // Green
    doc.text("Payments Applied:", 140, finalY + 12);
    doc.text(`-$${paidAmount.toFixed(2)}`, 196, finalY + 12, { align: "right" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      Number(inv.balanceDue) > 0 ? 180 : 22,
      Number(inv.balanceDue) > 0 ? 83 : 163,
      Number(inv.balanceDue) > 0 ? 9 : 74
    );
    doc.text("Balance Due:", 140, finalY + 19);
    doc.text(`$${Number(inv.balanceDue).toFixed(2)}`, 196, finalY + 19, { align: "right" });

    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("Electronically generated by PropertyOps Platform. Official verification: billing@propertyops.com", 105, 280, {
      align: "center",
    });

    // Download real .pdf
    doc.save(`Invoice_${inv.invoiceNo}.pdf`);
  }

  // =========================================================================
  // 2. GENERATE AUTHENTIC REAL .PDF REPORT MATCHING ACTIVE TAB
  // =========================================================================
  function downloadPdfActiveReport() {
    const doc = new jsPDF();
    const metrics = summaryData?.metrics || {};
    const dateStr = new Date().toISOString().slice(0, 10);

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("PropertyOps", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("PropertyOps Enterprise Operations Platform", 14, 26);
    doc.text(
      activeTab === "workOrders"
        ? "Maintenance Operations & Field Work Orders Audit"
        : activeTab === "finance"
        ? "Financial Invoicing & Revenue Settlement Statement"
        : activeTab === "portfolio"
        ? "Property Portfolio Occupancy & Asset Yield Statement"
        : activeTab === "vendors"
        ? "Vendor Performance & Compliance Certification Audit"
        : "Executive Business Intelligence & Operations Report",
      14,
      31
    );

    // Right Header
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 196, 20, { align: "right" });
    doc.text(`Auditor: System Administrator`, 196, 26, { align: "right" });
    doc.text(`Status: AUDITED & CERTIFIED`, 196, 31, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 196, 36);

    let fileName = `PropertyOps_Executive_Report_${dateStr}.pdf`;

    if (activeTab === "workOrders") {
      fileName = `PropertyOps_WorkOrders_Report_${dateStr}.pdf`;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("MAINTENANCE WORK ORDERS & DISPATCH LOG", 14, 44);

      const rows = (filteredWorkOrders || []).map((w: any) => [
        w.reference,
        w.title?.slice(0, 30) || "",
        w.property?.name || "Portfolio",
        w.priority,
        w.status,
        `$${Number(w.actualCost || w.estimatedCost || 0).toFixed(2)}`,
        new Date(w.createdAt).toLocaleDateString(),
      ]);

      autoTable(doc, {
        startY: 48,
        head: [["Ref", "Task Scope", "Property", "Priority", "Status", "Cost", "Date"]],
        body: rows.length > 0 ? rows : [["N/A", "No records", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        theme: "grid",
      });
    } else if (activeTab === "finance") {
      fileName = `PropertyOps_Financial_Report_${dateStr}.pdf`;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("FINANCIAL INVOICING & REVENUE SETTLEMENT REGISTER", 14, 44);

      const rows = (invoicesList || []).map((inv: any) => [
        inv.invoiceNo,
        inv.partyType,
        inv.contact?.name || inv.vendor?.legalName || "Client",
        inv.property?.name || "Portfolio",
        `$${Number(inv.total).toFixed(2)}`,
        `$${Number(inv.balanceDue).toFixed(2)}`,
        inv.status,
      ]);

      autoTable(doc, {
        startY: 48,
        head: [["Invoice No", "Party", "Billed To", "Property", "Total", "Balance", "Status"]],
        body: rows.length > 0 ? rows : [["N/A", "No records", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [5, 150, 105], textColor: 255 },
        theme: "grid",
      });
    } else if (activeTab === "portfolio") {
      fileName = `PropertyOps_Portfolio_Report_${dateStr}.pdf`;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("PROPERTY PORTFOLIO OCCUPANCY & UNIT BREAKDOWN", 14, 44);

      const rows = (propertiesList || []).map((p: any) => {
        const totalU = p.units?.length || 0;
        const occU = p.units?.filter((u: any) => u.status === "OCCUPIED").length || 0;
        const rate = totalU > 0 ? `${Math.round((occU / totalU) * 100)}%` : "0%";
        return [p.propertyCode, p.name, `${p.city || ""}, ${p.state || ""}`, String(totalU), String(occU), rate, String(p._count?.workOrders || 0)];
      });

      autoTable(doc, {
        startY: 48,
        head: [["Code", "Property Name", "Location", "Total Units", "Occupied", "Occupancy %", "Active WOs"]],
        body: rows.length > 0 ? rows : [["N/A", "No records", "-", "-", "-", "-", "-"]],
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        theme: "grid",
      });
    } else if (activeTab === "vendors") {
      fileName = `PropertyOps_Vendors_Report_${dateStr}.pdf`;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("VENDOR COMPLIANCE & PERFORMANCE AUDIT", 14, 44);

      const rows = (vendorsList || []).map((v: any) => [
        v.legalName,
        v.category,
        v.complianceStatus,
        `${v.complianceDocs?.length || 0} files`,
        String(v._count?.workOrders || 0),
        v.phone || v.email || "N/A",
      ]);

      autoTable(doc, {
        startY: 48,
        head: [["Vendor / Contractor", "Category", "Compliance", "Docs Verified", "Jobs Done", "Contact"]],
        body: rows.length > 0 ? rows : [["N/A", "No records", "-", "-", "-", "-"]],
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        theme: "grid",
      });
    } else {
      // Default Executive Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("EXECUTIVE PORTFOLIO & REVENUE HIGHLIGHTS", 14, 44);

      const kpiData = [
        ["Total Portfolio Occupancy Rate", `${metrics.occupancyRate || "0%"} (${metrics.occupiedUnits || 0} of ${metrics.totalUnits || 0} units occupied)`],
        ["Open Maintenance Work Orders", `${metrics.openWorkOrders || 0} tickets (${metrics.emergencyWorkOrders || 0} emergency SLA tickets)`],
        ["Total Revenue Collected (YTD)", `$${Number(metrics.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
        ["Outstanding Receivables Balance", `$${Number(metrics.outstandingReceivables || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
      ];

      autoTable(doc, {
        startY: 48,
        head: [["Operational KPI Metric", "Current Portfolio Status"]],
        body: kpiData,
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 }, 1: { cellWidth: 90 } },
        theme: "striped",
      });
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("PropertyOps Enterprise Platform - Official Executive Statement", 105, 285, { align: "center" });

    // Download real .pdf
    doc.save(fileName);
  }

  const metrics = summaryData?.metrics || {};
  const workOrdersList = detailedData?.workOrders || [];
  const invoicesList = detailedData?.invoices || [];
  const propertiesList = detailedData?.properties || [];
  const vendorsList = detailedData?.vendors || [];

  const filteredWorkOrders = woStatusFilter
    ? workOrdersList.filter((w: any) => w.status === woStatusFilter)
    : workOrdersList;

  // Active Tab Title and Document Code
  const activeReportMeta = {
    kpi: { title: "EXECUTIVE BUSINESS INTELLIGENCE & OPERATIONS REPORT", code: "REP-KPI-001" },
    workOrders: { title: "MAINTENANCE OPERATIONS & WORK ORDERS AUDIT STATEMENT", code: "REP-WO-002" },
    finance: { title: "FINANCIAL INVOICING & REVENUE SETTLEMENT REPORT", code: "REP-FIN-003" },
    portfolio: { title: "PROPERTY PORTFOLIO OCCUPANCY & ASSET YIELD REPORT", code: "REP-PROP-004" },
    vendors: { title: "VENDOR PERFORMANCE & COMPLIANCE CERTIFICATION AUDIT", code: "REP-VEND-005" },
  }[activeTab];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">Business Intelligence</span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Operational & Financial Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time multi-domain analytics, work order velocity, property occupancy, and downloadable PDF statements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Open Clean Report Document & Export PDF"
          >
            <Printer size={14} /> Print / Export PDF Report
          </button>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto px-4">
          <button
            onClick={() => setActiveTab("kpi")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "kpi"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={14} /> Executive KPI Overview
          </button>
          <button
            onClick={() => setActiveTab("workOrders")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "workOrders"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench size={14} /> Maintenance & Work Orders ({workOrdersList.length})
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "finance"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <DollarSign size={14} /> Financial Invoicing & Revenue ({invoicesList.length})
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "portfolio"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={14} /> Portfolio & Occupancy Yields ({propertiesList.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "vendors"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck size={14} /> Vendor Performance & Compliance ({vendorsList.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: EXECUTIVE KPI OVERVIEW */}
          {activeTab === "kpi" && (
            <div className="space-y-6">
              {/* Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Portfolio Occupancy</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{metrics.occupancyRate || "0%"}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {metrics.occupiedUnits || 0} of {metrics.totalUnits || 0} units occupied
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Open Work Orders</span>
                  <p className="text-2xl font-black text-blue-600 mt-1">{metrics.openWorkOrders || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {metrics.emergencyWorkOrders || 0} emergency SLA tickets
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Revenue Collected</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    ${Number(metrics.totalRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">YTD cleared settlements</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Open Receivables</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    ${Number(metrics.outstandingReceivables || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pending collection statements</p>
                </div>
              </div>

              {/* Breakdown Grids */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Work Orders by Priority Level</h2>
                  <div className="space-y-3">
                    {summaryData?.woByPriority?.map((p: any) => (
                      <div key={p.priority} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{p.priority}</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {p._count.id} tickets
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Work Orders by Lifecycle State</h2>
                  <div className="space-y-3">
                    {summaryData?.woByStatus?.map((s: any) => (
                      <div key={s.status} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{s.status}</span>
                        <span className="font-bold text-slate-900 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                          {s._count.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MAINTENANCE & WORK ORDERS REPORT */}
          {activeTab === "workOrders" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">Detailed Maintenance Execution & Cost Log</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
                  <select
                    value={woStatusFilter}
                    onChange={(e) => setWoStatusFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">All States</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              {!filteredWorkOrders.length ? (
                <div className="py-12 text-center text-xs text-slate-400">No work orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold">
                        <th className="py-3 px-3">Reference</th>
                        <th className="py-3 px-3">Job Title & Category</th>
                        <th className="py-3 px-3">Property / Unit</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Assignee</th>
                        <th className="py-3 px-3">Estimated</th>
                        <th className="py-3 px-3">Actual Cost</th>
                        <th className="py-3 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWorkOrders.map((wo: any) => (
                        <tr key={wo.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 font-bold text-blue-600">
                            <Link href={`/work-orders/${wo.id}`} className="hover:underline">
                              {wo.reference}
                            </Link>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-800 line-clamp-1">{wo.title}</p>
                            <span className="text-[10px] text-slate-400">{wo.category}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {wo.property?.name} {wo.unit ? `· ${wo.unit.unitCode}` : ""}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
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
                          <td className="py-3 px-3">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                wo.status === "CLOSED"
                                  ? "bg-slate-200 text-slate-800"
                                  : wo.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {wo.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {wo.assignedUser?.name || wo.assignedVendor?.legalName || "Unassigned"}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            ${Number(wo.estimatedCost || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ${Number(wo.actualCost || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(wo.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINANCIAL INVOICING & REVENUE */}
          {activeTab === "finance" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Official Invoicing Register & Statements</span>
                <span className="text-[11px] text-slate-400">Click &quot;PDF Invoice&quot; on any entry to view and download real PDF file.</span>
              </div>

              {!invoicesList.length ? (
                <div className="py-12 text-center text-xs text-slate-400">No invoices generated yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold">
                        <th className="py-3 px-3">Invoice No</th>
                        <th className="py-3 px-3">Party Type</th>
                        <th className="py-3 px-3">Billed To</th>
                        <th className="py-3 px-3">Property</th>
                        <th className="py-3 px-3">Total Billed</th>
                        <th className="py-3 px-3">Balance Due</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">PDF Invoice Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoicesList.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{inv.invoiceNo}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {inv.partyType}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-800 font-medium">
                            {inv.contact?.name || inv.vendor?.legalName || "General Client"}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{inv.property?.name || "Portfolio"}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ${Number(inv.total).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-bold text-amber-600">
                            ${Number(inv.balanceDue).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
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
                            <button
                              onClick={() => openInvoicePrintModal(inv.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              <FileText size={12} /> View / PDF Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PORTFOLIO & OCCUPANCY YIELDS */}
          {activeTab === "portfolio" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Property Portfolio Occupancy & Asset Distribution</span>
              {!propertiesList.length ? (
                <div className="py-12 text-center text-xs text-slate-400">No properties recorded.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {propertiesList.map((prop: any) => {
                    const totalU = prop.units?.length || 0;
                    const occupiedU = prop.units?.filter((u: any) => u.status === "OCCUPIED").length || 0;
                    const rate = totalU > 0 ? Math.round((occupiedU / totalU) * 100) : 0;
                    return (
                      <div key={prop.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{prop.name}</h3>
                            <p className="text-[11px] text-slate-400">{prop.address}, {prop.city}</p>
                          </div>
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            {prop.propertyCode}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Units</span>
                            <p className="font-bold text-slate-800 text-sm">{totalU}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Occupancy Rate</span>
                            <p className="font-bold text-emerald-600 text-sm">{rate}%</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Jobs</span>
                            <p className="font-bold text-slate-800 text-sm">{prop._count?.workOrders || 0}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VENDOR COMPLIANCE */}
          {activeTab === "vendors" && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700">Vendor Directory & Insurance Compliance Status</span>
              {!vendorsList.length ? (
                <div className="py-12 text-center text-xs text-slate-400">No vendors registered.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-semibold">
                        <th className="py-3 px-3">Vendor / Contractor</th>
                        <th className="py-3 px-3">Trade Category</th>
                        <th className="py-3 px-3">Compliance Status</th>
                        <th className="py-3 px-3">Verified Documents</th>
                        <th className="py-3 px-3">Assigned Work Orders</th>
                        <th className="py-3 px-3">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorsList.map((v: any) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{v.legalName}</td>
                          <td className="py-3 px-3 text-slate-600">{v.category}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                v.complianceStatus === "COMPLIANT"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {v.complianceStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {v.complianceDocs?.length || 0} files on record
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {v._count?.workOrders || 0} jobs
                          </td>
                          <td className="py-3 px-3 text-slate-500">{v.phone || v.email || "N/A"}</td>
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

      {/* ========================================================================= */}
      {/* 1. PRINTABLE PDF INVOICE MODAL                                            */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 md:p-10 flex justify-center items-start"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAllModals();
          }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-4 border border-slate-200 print-clean-document">
            {/* Sticky Modal Actions Bar (ALWAYS VISIBLE AT TOP, NEVER CUT OFF) */}
            <div className="sticky -top-6 -mt-6 sm:-top-8 sm:-mt-8 bg-white/95 backdrop-blur-xs pt-6 sm:pt-8 pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 z-30 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Tax Invoice Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Printer size={13} /> Print Report
                </button>
                <button
                  onClick={downloadPdfInvoice}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download size={13} /> Download PDF (.pdf)
                </button>
                <button
                  onClick={closeAllModals}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>

            {printableLoading || !printableData ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading invoice document...</div>
            ) : (
              <div className="space-y-6 text-slate-800">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-blue-600 tracking-tight">PropertyOps</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{printableData.company?.name}</p>
                    <p className="text-[11px] text-slate-400">{printableData.company?.address}</p>
                    <p className="text-[11px] text-slate-400">
                      {printableData.company?.phone} · {printableData.company?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900 tracking-tight block">INVOICE</span>
                    <span className="text-xs font-mono font-bold text-slate-600 mt-0.5 block">
                      {printableData.invoice?.invoiceNo}
                    </span>
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        printableData.invoice?.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {printableData.invoice?.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Billed To</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {printableData.invoice?.contact?.name || printableData.invoice?.vendor?.legalName || "General Client"}
                    </p>
                    <p className="text-slate-500 mt-0.5">{printableData.invoice?.property?.name || "Portfolio"}</p>
                    <p className="text-slate-400">
                      {printableData.invoice?.contact?.email || printableData.invoice?.vendor?.email || ""}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div>
                      <span className="text-slate-400">Issue Date: </span>
                      <strong className="text-slate-700">{new Date(printableData.invoice?.createdAt).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Due Date: </span>
                      <strong className="text-slate-700">{new Date(printableData.invoice?.dueDate).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Account Type: </span>
                      <strong className="text-slate-700">{printableData.invoice?.partyType}</strong>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {printableData.invoice?.lines?.map((line: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-800">{line.description}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{line.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-600">${Number(line.unitPrice).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">${Number(line.amount).toFixed(2)}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="py-3 px-3 text-slate-400 text-center">
                            Maintenance Services
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span>${Number(printableData.invoice?.subtotal || printableData.invoice?.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Amount:</span>
                      <span>${Number(printableData.invoice?.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Paid to Date:</span>
                      <span>
                        -$
                        {(
                          Number(printableData.invoice?.total) - Number(printableData.invoice?.balanceDue)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-800 text-slate-900">
                      <span>Balance Due:</span>
                      <span className={Number(printableData.invoice?.balanceDue) > 0 ? "text-amber-600" : "text-emerald-600"}>
                        ${Number(printableData.invoice?.balanceDue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
                  Electronically generated and verified by PropertyOps Platform. Official inquiries: billing@propertyops.com
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB-SPECIFIC FORMAL REPORT DOCUMENT MODAL (Same format as Invoice!)   */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 md:p-10 flex justify-center items-start"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAllModals();
          }}
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-4 border border-slate-200 print-clean-document">
            {/* Sticky Actions Bar (ALWAYS VISIBLE AT TOP, NEVER CUT OFF) */}
            <div className="sticky -top-6 -mt-6 sm:-top-8 sm:-mt-8 bg-white/95 backdrop-blur-xs pt-6 sm:pt-8 pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 z-30 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Report Document
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Printer size={13} /> Print Report
                </button>
                <button
                  onClick={downloadPdfActiveReport}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download size={13} /> Download PDF (.pdf)
                </button>
                <button
                  onClick={closeAllModals}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>

            {/* Clean Formal Letterhead Document Format */}
            <div className="space-y-6 text-slate-800">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-blue-600 tracking-tight">PropertyOps</h2>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">PropertyOps Enterprise Management LLC</p>
                  <p className="text-[11px] text-slate-400">742 Evergreen Terrace, Suite 500, New York, NY 10001</p>
                  <p className="text-[11px] text-slate-400">+1 (800) 555-PROP · reports@propertyops.com</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900 tracking-tight block">
                    {activeTab === "workOrders"
                      ? "MAINTENANCE REPORT"
                      : activeTab === "finance"
                      ? "FINANCIAL REPORT"
                      : activeTab === "portfolio"
                      ? "PORTFOLIO REPORT"
                      : activeTab === "vendors"
                      ? "VENDOR AUDIT"
                      : "EXECUTIVE REPORT"}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-600 mt-0.5 block">
                    {activeReportMeta?.code}
                  </span>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    AUDITED & CERTIFIED
                  </span>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Document Title</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{activeReportMeta?.title}</p>
                  <p className="text-slate-500 mt-0.5">Category: {activeTab.toUpperCase()} Operations</p>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-400">Statement Date: </span>
                    <strong className="text-slate-700">{new Date().toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Audited By: </span>
                    <strong className="text-slate-700">System Administrator</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Platform Status: </span>
                    <strong className="text-emerald-700">Live Production Data</strong>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TAB-SPECIFIC CONTENT: WORK ORDERS REPORT                     */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "workOrders" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Maintenance & Field Work Orders Execution Log
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Scope / Task</th>
                          <th className="py-2.5 px-3">Property</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Cost</th>
                          <th className="py-2.5 px-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredWorkOrders.map((wo: any) => (
                          <tr key={wo.id}>
                            <td className="py-2 px-3 font-bold text-blue-600">{wo.reference}</td>
                            <td className="py-2 px-3 text-slate-800 line-clamp-1">{wo.title}</td>
                            <td className="py-2 px-3 text-slate-600">{wo.property?.name}</td>
                            <td className="py-2 px-3 font-semibold">{wo.priority}</td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                                {wo.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              ${Number(wo.actualCost || wo.estimatedCost || 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-400">
                              {new Date(wo.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB-SPECIFIC CONTENT: FINANCIAL INVOICING REPORT              */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "finance" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Financial Invoicing & Revenue Statements
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Invoice No</th>
                          <th className="py-2.5 px-3">Party</th>
                          <th className="py-2.5 px-3">Billed To</th>
                          <th className="py-2.5 px-3">Property</th>
                          <th className="py-2.5 px-3 text-right">Total Billed</th>
                          <th className="py-2.5 px-3 text-right">Balance Due</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoicesList.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-2 px-3 font-bold text-slate-900">{inv.invoiceNo}</td>
                            <td className="py-2 px-3 text-slate-600">{inv.partyType}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {inv.contact?.name || inv.vendor?.legalName || "General Client"}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{inv.property?.name || "Portfolio"}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              ${Number(inv.total).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-amber-600">
                              ${Number(inv.balanceDue).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600">{inv.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB-SPECIFIC CONTENT: PORTFOLIO OCCUPANCY REPORT              */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "portfolio" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Property Portfolio Occupancy & Asset Yields
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Code</th>
                          <th className="py-2.5 px-3">Property Name</th>
                          <th className="py-2.5 px-3">Location</th>
                          <th className="py-2.5 px-3 text-center">Total Units</th>
                          <th className="py-2.5 px-3 text-center">Occupied</th>
                          <th className="py-2.5 px-3 text-right">Occupancy %</th>
                          <th className="py-2.5 px-3 text-right">Active Jobs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {propertiesList.map((p: any) => {
                          const totalU = p.units?.length || 0;
                          const occU = p.units?.filter((u: any) => u.status === "OCCUPIED").length || 0;
                          const rate = totalU > 0 ? `${Math.round((occU / totalU) * 100)}%` : "0%";
                          return (
                            <tr key={p.id}>
                              <td className="py-2 px-3 font-bold text-blue-600">{p.propertyCode}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{p.name}</td>
                              <td className="py-2 px-3 text-slate-600">{p.address}, {p.city}</td>
                              <td className="py-2 px-3 text-center text-slate-700">{totalU}</td>
                              <td className="py-2 px-3 text-center text-slate-700">{occU}</td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-600">{rate}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-800">
                                {p._count?.workOrders || 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB-SPECIFIC CONTENT: VENDOR COMPLIANCE REPORT                */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "vendors" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Vendor Performance & Compliance Status Audit
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Vendor / Contractor</th>
                          <th className="py-2.5 px-3">Trade Category</th>
                          <th className="py-2.5 px-3">Compliance Status</th>
                          <th className="py-2.5 px-3">Verified Files</th>
                          <th className="py-2.5 px-3 text-right">Completed Jobs</th>
                          <th className="py-2.5 px-3 text-right">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vendorsList.map((v: any) => (
                          <tr key={v.id}>
                            <td className="py-2 px-3 font-bold text-slate-900">{v.legalName}</td>
                            <td className="py-2 px-3 text-slate-600">{v.category}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  v.complianceStatus === "COMPLIANT"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {v.complianceStatus}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{v.complianceDocs?.length || 0} files</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800">{v._count?.workOrders || 0}</td>
                            <td className="py-2 px-3 text-right text-slate-500">{v.phone || v.email || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB-SPECIFIC CONTENT: EXECUTIVE KPI OVERVIEW                  */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "kpi" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Portfolio Performance Indicators & Cross-Module Summary
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="py-2.5 px-3">Performance Dimension</th>
                          <th className="py-2.5 px-3 text-right">Audited Value</th>
                          <th className="py-2.5 px-3 text-right">Benchmark Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-800">Portfolio Occupancy Rate</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{metrics.occupancyRate || "0%"}</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                            {metrics.occupiedUnits || 0}/{metrics.totalUnits || 0} Units Occupied
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-800">Active Maintenance Work Orders</td>
                          <td className="py-2 px-3 text-right font-bold text-blue-600">{metrics.openWorkOrders || 0} Open</td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {metrics.emergencyWorkOrders || 0} Emergency Priority
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-800">Total Cleared Revenue (YTD)</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600">
                            ${Number(metrics.totalRevenue || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">Settled Deposits</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium text-slate-800">Outstanding Receivables Balance</td>
                          <td className="py-2 px-3 text-right font-bold text-amber-600">
                            ${Number(metrics.outstandingReceivables || 0).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">Collection Queue</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Official Seal / Sign-off Footer */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-800">PropertyOps Compliance & Audit Bureau</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    This document constitutes an official certified statement. Verification: reports@propertyops.com
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-36 border-b border-slate-300 pb-1 mb-1 text-center font-serif italic text-slate-600">
                    System Admin
                  </div>
                  <span className="text-[10px] text-slate-400">Authorized Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
