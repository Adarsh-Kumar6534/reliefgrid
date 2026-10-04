"use client";

import React, { useState, useEffect } from "react";
import { Activity, Clock, RefreshCw, Filter } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { SkeletonTable } from "@/components/Skeleton";
import { fetchApi, ActivityLogItem, PaginatedResult } from "@/lib/api";

const eventTypes = ["ALL", "RESOURCE_CREATED", "NEED_CREATED", "MATCH_CREATED", "MATCH_ACCEPTED", "MATCH_REJECTED", "RESOURCE_UPDATED", "NEED_UPDATED"];

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("ALL");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = async () => {
    setLoading(true);
    let url = `/activity?page=${page}&page_size=${pageSize}&`;
    if (selectedType !== "ALL") url += `event_type=${selectedType}&`;

    const res = await fetchApi<PaginatedResult<ActivityLogItem>>(url);
    if (res.success && res.data) {
      setActivities(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [page, selectedType]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Activity className="w-4 h-4" />
            SYSTEM TELEMETRY & AUDIT TRAIL
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-slate-100 tracking-tight">
            Disaster Response Activity Log
          </h1>
          <p className="text-xs text-slate-400">
            Chronological audit feed of emergency requirements, engine match scores, and resource allocations.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Pills Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-mono text-slate-400 shrink-0">Filter Event:</span>
        {eventTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
              selectedType === type
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Activity Timeline Feed */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <h2 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Recorded Audit Event Log
        </h2>

        {loading ? (
          <SkeletonTable />
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400">
            No audit log records found for this event filter.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 group">
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-950 group-hover:scale-125 transition-transform"></div>

                <div className="flex-1 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-100">{act.title}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{act.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                    <span>Type: {act.event_type}</span>
                    <span>Status: <strong className="text-emerald-400">{act.status}</strong></span>
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
      </div>
    </div>
  );
}
