"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  Cpu, 
  Users, 
  Building2, 
  Activity, 
  Server,
  Radio,
  Search
} from "lucide-react";
import { fetchApi } from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Resources", href: "/resources", icon: Package },
  { name: "Needs", href: "/needs", icon: AlertTriangle },
  { name: "Matching Center", href: "/matching", icon: Cpu },
  { name: "Volunteers", href: "/volunteers", icon: Users },
  { name: "Shelters & Orgs", href: "/shelters", icon: Building2 },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "System Status", href: "/status", icon: Server },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    async function checkHealth() {
      const res = await fetchApi<{ status: string }>("/health");
      setApiConnected(res.success || false);
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Logo size="md" />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                      isActive
                        ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Global Search & Live Indicators */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs font-mono transition-all"
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search Grid...</span>
              </button>

              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      apiConnected ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      apiConnected ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  ></span>
                </span>
                <span className="text-slate-300">
                  {apiConnected === null ? "API..." : apiConnected ? "API ONLINE" : "OFFLINE DEMO"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>GRID LIVE</span>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-900 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
