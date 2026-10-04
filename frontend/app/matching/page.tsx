"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Cpu, CheckCircle2, XCircle, AlertTriangle, Package, RefreshCw, Zap } from "lucide-react";
import { Badge } from "@/components/Badge";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { fetchApi, Need, Match } from "@/lib/api";

function MatchingStudioContent() {
  const searchParams = useSearchParams();
  const initialNeedId = searchParams.get("need_id");

  const [needs, setNeeds] = useState<Need[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingNeeds, setLoadingNeeds] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch all open needs
  useEffect(() => {
    async function loadNeeds() {
      setLoadingNeeds(true);
      const res = await fetchApi<Need[]>("/needs?page_size=50");
      if (res.success && res.data) {
        const needItems = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
        setNeeds(needItems);
        if (initialNeedId) {
          const found = needItems.find((n: Need) => n.id === parseInt(initialNeedId));
          if (found) setSelectedNeed(found);
          else if (needItems.length > 0) setSelectedNeed(needItems[0]);
        } else if (needItems.length > 0) {
          setSelectedNeed(needItems[0]);
        }
      }
      setLoadingNeeds(false);
    }
    loadNeeds();
  }, [initialNeedId]);

  // Fetch or calculate matches when selectedNeed changes
  const runMatchingForNeed = async (needId: number) => {
    setLoadingMatches(true);
    const res = await fetchApi<Match[]>(`/matches/need/${needId}`);
    if (res.success && res.data) {
      setMatches(res.data);
    }
    setLoadingMatches(false);
  };

  useEffect(() => {
    if (selectedNeed) {
      runMatchingForNeed(selectedNeed.id);
    }
  }, [selectedNeed]);

  const handleAcceptMatch = async (matchId: number) => {
    setActionLoading(matchId);
    const res = await fetchApi(`/matches/${matchId}/accept`, { method: "POST" });
    setActionLoading(null);
    if (res.success && selectedNeed) {
      addToast(
        "Match Accepted",
        res.message || "Quantity allocated and requirement updated.",
        "success"
      );
      runMatchingForNeed(selectedNeed.id);
    }
  };

  const handleRejectMatch = async (matchId: number) => {
    setActionLoading(matchId);
    const res = await fetchApi(`/matches/${matchId}/reject`, { method: "POST" });
    setActionLoading(null);
    if (res.success && selectedNeed) {
      addToast("Match Rejected", "Candidate match marked as rejected.", "info");
      runMatchingForNeed(selectedNeed.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Cpu className="w-4 h-4 animate-pulse" />
            INTELLIGENT DISASTER ALLOCATION ENGINE
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-slate-100 tracking-tight">
            Matching Center Studio
          </h1>
          <p className="text-xs text-slate-400">
            Explainable 100-pt scoring: Category Match (40pts) + Distance Proximity (20pts) + Quantity Satisfaction (20pts) + Active Availability (10pts) + Priority Boost (10pts).
          </p>
        </div>

        {selectedNeed && (
          <button
            onClick={() => runMatchingForNeed(selectedNeed.id)}
            disabled={loadingMatches}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMatches ? "animate-spin" : ""}`} />
            Re-run Match Scoring
          </button>
        )}
      </div>

      {/* Main Studio Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Need Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-200">
                1. Select Emergency Need
              </span>
              <span className="text-[10px] font-mono text-slate-400">{needs.length} Active</span>
            </div>

            {loadingNeeds ? (
              <div className="py-8 text-center text-xs font-mono text-slate-400">Loading requirements...</div>
            ) : needs.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-slate-400">No emergency needs available.</div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {needs.map((need) => {
                  const isSelected = selectedNeed?.id === need.id;
                  return (
                    <button
                      key={need.id}
                      onClick={() => setSelectedNeed(need)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge label={need.priority} type="priority" size="sm" />
                        <span className="text-[10px] font-mono text-slate-400">{need.type}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{need.title}</h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{need.quantity_required} {need.unit}</span>
                        <span className="text-cyan-400 font-bold">{need.location}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Match Scoring Workbench Results */}
        <div className="lg:col-span-8 space-y-4">
          {selectedNeed && (
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-cyan-400" />
                  Target Need #{selectedNeed.id} • Status: {selectedNeed.status}
                </span>
                <Badge label={selectedNeed.priority} type="priority" size="sm" />
              </div>

              <h2 className="text-lg font-bold text-slate-100">{selectedNeed.title}</h2>
              <p className="text-xs text-slate-300">{selectedNeed.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Location: <strong className="text-slate-200">{selectedNeed.location}</strong></span>
                <span>Remaining Required: <strong className="text-red-400">{selectedNeed.quantity_required} {selectedNeed.unit}</strong></span>
                <span>Coordinates: <strong className="text-slate-200">{selectedNeed.latitude.toFixed(2)}°, {selectedNeed.longitude.toFixed(2)}°</strong></span>
              </div>
            </div>
          )}

          {/* Candidates Match Results Header */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-300">
              2. Evaluated Candidate Resources ({matches.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Ranked by Match Score %</span>
          </div>

          {loadingMatches ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
              Evaluating candidate resources and computing Haversine distances...
            </div>
          ) : matches.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-500" />
              <h3 className="text-sm font-mono text-slate-300">No compatible resources found</h3>
              <p className="text-xs text-slate-400">
                No active resources match the category type or quantity for this requirement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Score Meter Gauge */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <span className="text-xl font-extrabold font-mono text-cyan-400">{m.match_score}%</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-100">
                            {m.resource?.title || `Resource #${m.resource_id}`}
                          </h4>
                          <Badge label={m.status} type="status" size="sm" />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {m.resource?.location || "Supply Location"} • <strong className="text-cyan-400 font-mono">{m.distance} km away</strong> • Available: <strong className="text-slate-200 font-mono">{m.resource?.quantity} {m.resource?.unit}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {m.status === "PROPOSED" ? (
                        <>
                          <button
                            onClick={() => handleAcceptMatch(m.id)}
                            disabled={actionLoading === m.id}
                            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Accept & Allocate
                          </button>
                          <button
                            onClick={() => handleRejectMatch(m.id)}
                            disabled={actionLoading === m.id}
                            className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold text-slate-400 bg-slate-900 border border-slate-700 hover:text-red-400 hover:border-red-500/40 transition-all flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 font-semibold">
                          Status: {m.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explainability Reasoning Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Match Score Breakdown & Reasoning:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {m.reason.map((r, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}

export default function MatchingCenterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-xs text-slate-400">Loading Matching Studio...</div>}>
      <MatchingStudioContent />
    </Suspense>
  );
}
