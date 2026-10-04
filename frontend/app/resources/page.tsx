"use client";

import React, { useState, useEffect } from "react";
import { Package, Search, Plus, MapPin, RefreshCw, Edit3 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { CreateResourceModal } from "@/components/CreateResourceModal";
import { EditResourceModal } from "@/components/EditResourceModal";
import { Pagination } from "@/components/Pagination";
import { SkeletonCard } from "@/components/Skeleton";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { fetchApi, Resource, PaginatedResult } from "@/lib/api";

const resourceTypes = ["ALL", "FOOD", "WATER", "MEDICINE", "BLOOD", "SHELTER", "CLOTHING", "VOLUNTEER"];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Toast State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchResources = async () => {
    setLoading(true);
    let url = `/resources?page=${page}&page_size=${pageSize}&`;
    if (selectedType !== "ALL") url += `type=${selectedType}&`;
    if (selectedStatus !== "ALL") url += `status=${selectedStatus}&`;
    if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery)}&`;

    const res = await fetchApi<PaginatedResult<Resource>>(url);
    if (res.success && res.data) {
      setResources(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, [page, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Package className="w-4 h-4" />
            DISASTER INVENTORY & SUPPLIES
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-slate-100 tracking-tight">
            Registered Emergency Resources
          </h1>
          <p className="text-xs text-slate-400">
            Grid of available disaster supplies, medical reserves, shelter capacity, and equipment.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Register Resource
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources, location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Resource Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar">
          {resourceTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                selectedType === type
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchResources}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grid of Resource Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <Package className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="text-sm font-mono text-slate-300">No matching resources found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No active resources match your search criteria. Register a new resource or clear filters.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
          >
            + Register Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => (
            <div
              key={res.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge label={res.type} type="resourceType" size="sm" />
                  <div className="flex items-center gap-1.5">
                    <Badge label={res.availability_status} type="status" size="sm" />
                    <button
                      onClick={() => setEditingResource(res)}
                      className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
                      title="Edit Resource"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {res.title}
                  </h3>
                  {res.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{res.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Available Quantity:</span>
                  <span className="text-sm font-extrabold text-cyan-400">
                    {res.quantity} {res.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{res.location}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                  <span>Coords: {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°</span>
                  <span>ID #{res.id}</span>
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
      <CreateResourceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchResources();
          addToast("Resource Registered", "New resource supply added to grid", "success");
        }}
      />

      <EditResourceModal
        resource={editingResource}
        isOpen={!!editingResource}
        onClose={() => setEditingResource(null)}
        onSuccess={() => {
          fetchResources();
          addToast("Resource Updated", "Inventory details updated successfully", "info");
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
