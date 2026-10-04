"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Search, Plus, MapPin, Cpu, RefreshCw, Edit3 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { CreateNeedModal } from "@/components/CreateNeedModal";
import { EditNeedModal } from "@/components/EditNeedModal";
import { Pagination } from "@/components/Pagination";
import { SkeletonCard } from "@/components/Skeleton";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { fetchApi, Need, PaginatedResult } from "@/lib/api";

const priorityLevels = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function NeedsPage() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Toast State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchNeeds = async () => {
    setLoading(true);
    let url = `/needs?page=${page}&page_size=${pageSize}&`;
    if (selectedPriority !== "ALL") url += `priority=${selectedPriority}&`;
    if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery)}&`;

    const res = await fetchApi<PaginatedResult<Need>>(url);
    if (res.success && res.data) {
      setNeeds(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNeeds();
  }, [page, selectedPriority, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-red-400">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            EMERGENCY REQUIREMENTS REGISTRY
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-slate-100 tracking-tight">
            Active Emergency Needs
          </h1>
          <p className="text-xs text-slate-400">
            Real-time feed of urgent requirements posted by shelters, hospitals, and field operations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Post Requirement
        </button>
      </div>

      {/* Search & Priority Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search emergency needs, location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        {/* Priority Level Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar">
          {priorityLevels.map((prio) => (
            <button
              key={prio}
              onClick={() => {
                setSelectedPriority(prio);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                selectedPriority === prio
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 font-bold"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {prio}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchNeeds}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid of Need Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : needs.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <AlertTriangle className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="text-sm font-mono text-slate-300">No matching needs found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No active emergency requirements match your criteria.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-red-600 hover:bg-red-500"
          >
            + Post Requirement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {needs.map((need) => (
            <div
              key={need.id}
              className={`glass-panel rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                need.priority === "CRITICAL"
                  ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge label={need.priority} type="priority" size="sm" />
                  <div className="flex items-center gap-1.5">
                    <Badge label={need.status} type="status" size="sm" />
                    <button
                      onClick={() => setEditingNeed(need)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                      title="Edit Requirement"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {need.title}
                  </h3>
                  {need.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{need.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Quantity Required:</span>
                  <span className="text-sm font-extrabold text-red-400">
                    {need.quantity_required} {need.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{need.location}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    Category: {need.type}
                  </span>
                  <Link
                    href={`/matching?need_id=${need.id}`}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Run Engine
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
      />

      {/* Modals */}
      <CreateNeedModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchNeeds();
          addToast("Requirement Posted", "Emergency need submitted and matching engine executed", "success");
        }}
      />

      <EditNeedModal
        need={editingNeed}
        isOpen={!!editingNeed}
        onClose={() => setEditingNeed(null)}
        onSuccess={() => {
          fetchNeeds();
          addToast("Requirement Updated", "Emergency need details updated", "info");
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
