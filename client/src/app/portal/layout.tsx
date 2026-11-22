"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, ClipboardList, DollarSign, LogOut, Shield } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("pop_token");
    if (!t) {
      router.replace("/login");
      return;
    }
    try {
      setUser(JSON.parse(localStorage.getItem("pop_user") || "{}"));
    } catch {}
  }, [router]);

  function logout() {
    localStorage.removeItem("pop_token");
    localStorage.removeItem("pop_user");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Resident Portal Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/portal/requests" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-500/20">
              PO
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">Resident & Client Portal</span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Property Operations Platform</span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/portal/requests"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                path.startsWith("/portal/requests")
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ClipboardList size={14} /> My Requests
            </Link>
            <Link
              href="/portal/invoices"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                path.startsWith("/portal/invoices")
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <DollarSign size={14} /> Rent & Invoices
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">{user?.name || "Resident"}</p>
            <p className="text-[10px] text-slate-400">{user?.email || "tenant@example.com"}</p>
          </div>
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 bg-slate-100 rounded-lg hidden md:block"
          >
            Staff Desk →
          </Link>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto p-6 flex-1">{children}</main>
    </div>
  );
}
