"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Home,
  Users,
  UserCheck,
  ClipboardList,
  Wrench,
  Cog,
  Truck,
  PhoneCall,
  DollarSign,
  FolderArchive,
  BarChart3,
  SlidersHorizontal,
  Bell,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";

const NAV_SECTIONS = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Master Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    group: "Property Portfolio",
    items: [
      { label: "Properties", href: "/properties", icon: Building2 },
      { label: "Units & Occupancy", href: "/units", icon: Home },
    ],
  },
  {
    group: "People & Clients",
    items: [
      { label: "Clients & Tenants", href: "/contacts", icon: Users },
      { label: "Staff & Teams", href: "/people", icon: UserCheck },
    ],
  },
  {
    group: "Service Operations",
    items: [
      { label: "Service Requests", href: "/service-requests", icon: ClipboardList },
      { label: "Work Orders", href: "/work-orders", icon: Wrench },
      { label: "Maintenance & Assets", href: "/maintenance", icon: Cog },
    ],
  },
  {
    group: "External Resources",
    items: [
      { label: "Vendors & Contractors", href: "/vendors", icon: Truck },
    ],
  },
  {
    group: "Communications",
    items: [
      { label: "Call & Email Desk", href: "/communications", icon: PhoneCall },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Invoices & Payments", href: "/finance", icon: DollarSign },
    ],
  },
  {
    group: "Content & Insights",
    items: [
      { label: "Document Library", href: "/documents", icon: FolderArchive },
      { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Settings & Audit", href: "/settings", icon: SlidersHorizontal },
    ],
  },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("pop_token");
    if (!t) {
      router.replace("/login");
      return;
    }
    try {
      setUser(JSON.parse(localStorage.getItem("pop_user") || "{}"));
    } catch {}

    // Load notifications
    api("/notifications")
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => {});
  }, [router]);

  function logout() {
    localStorage.removeItem("pop_token");
    localStorage.removeItem("pop_user");
    router.replace("/login");
  }

  async function markAllNotificationsRead() {
    try {
      await api("/notifications/read-all", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* Sidebar */}
      <aside
        className={`fixed z-30 inset-y-0 left-0 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-200 flex flex-col print:hidden ${
          open ? "w-64" : "w-20"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              PO
            </div>
            {open && (
              <div>
                <span className="font-bold text-white text-base tracking-tight leading-none block">
                  PropertyOps
                </span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase block mt-0.5">
                  Enterprise Platform
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="p-3 overflow-y-auto flex-1 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
          {NAV_SECTIONS.map((section) => (
            <div key={section.group}>
              {open && (
                <div className="px-3 mb-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  {section.group}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = path === item.href || (item.href !== "/dashboard" && path.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
                      } ${!open ? "justify-center px-0" : ""}`}
                      title={!open ? item.label : undefined}
                    >
                      <Icon size={18} className={active ? "text-white" : "text-slate-400"} />
                      {open && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User preview & footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            {open && (
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || "Admin User"}</p>
                <p className="text-[10px] text-blue-400 font-medium truncate flex items-center gap-1 mt-0.5">
                  <Shield size={10} />
                  {user?.role?.replace("_", " ") || "STAFF"}
                </p>
              </div>
            )}
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-200 ${open ? "ml-64" : "ml-20"} print:ml-0 print:w-full print:p-0 flex flex-col min-h-screen`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs print:hidden">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Global search properties, work orders, contacts..."
                className="w-72 lg:w-96 pl-9 pr-4 py-1.5 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs rounded-xl border border-transparent focus:border-blue-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-xs font-bold text-slate-800">Operational Alerts</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Check size={12} /> Mark read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                            !n.isRead ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            {/* User Dropdown Preview */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || "System Admin"}</p>
                <p className="text-[10px] text-slate-500 font-medium">{user?.email || "admin@example.com"}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name?.slice(0, 2).toUpperCase() || "AD"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="p-6 lg:p-8 max-w-[1600px] w-full mx-auto flex-1">{children}</main>
      </div>
    </div>
  );
}
