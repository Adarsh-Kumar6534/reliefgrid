"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Package, 
  AlertTriangle, 
  ShieldAlert, 
  Cpu, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  RefreshCw,
  Activity
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { DisasterRadar } from "@/components/DisasterRadar";
import { Badge } from "@/components/Badge";
import { CreateResourceModal } from "@/components/CreateResourceModal";
import { CreateNeedModal } from "@/components/CreateNeedModal";
import { fetchApi, DashboardSummaryData, Need, Match, PaginatedResult } from "@/lib/api";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [criticalNeeds, setCriticalNeeds] = useState<Need[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isNeedModalOpen, setIsNeedModalOpen] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    const summaryRes = await fetchApi<DashboardSummaryData>("/dashboard/summary");
    if (summaryRes.success && summaryRes.data) {
      setSummary(summaryRes.data);
    }

    const needsRes = await fetchApi<PaginatedResult<Need> | Need[]>("/needs?priority=CRITICAL&status=OPEN");
    if (needsRes.success && needsRes.data) {
      const needItems = Array.isArray(needsRes.data) ? needsRes.data : (needsRes.data as any).items || [];
      setCriticalNeeds(needItems.slice(0, 3));
    }

    const matchesRes = await fetchApi<PaginatedResult<Match> | Match[]>("/matches");
    if (matchesRes.success && matchesRes.data) {
      const matchItems = Array.isArray(matchesRes.data) ? matchesRes.data : (matchesRes.data as any).items || [];
      setRecentMatches(matchItems.slice(0, 4));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            DISASTER OPERATIONS COMMAND CENTER
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
            ReliefGrid Emergency Matching Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Real-time emergency resource allocation, proximity telemetry, and automated deterministic match scoring engine.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsResourceModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Plus className="w-4 h-4" />
            + Add Resource
          </button>
          <button
            onClick={() => setIsNeedModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            <AlertTriangle className="w-4 h-4" />
            + Post Need
          </button>
          <button
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl text-xs font-mono text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-all"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Resources"
          value={summary?.active_resources ?? 0}
          unit={`/ ${summary?.total_resources ?? 0}`}
          subtitle="Available for allocation"
          icon={Package}
          accentColor="cyan"
          badgeText="READY"
        />
        <StatCard
          title="Open Needs"
          value={summary?.open_needs ?? 0}
          unit={`/ ${summary?.total_needs ?? 0}`}
          subtitle="Emergency requests"
          icon={AlertTriangle}
          accentColor="amber"
          badgeText="PENDING"
        />
        <StatCard
          title="Critical Needs"
          value={summary?.critical_needs ?? 0}
          unit="CRITICAL"
          subtitle="Immediate response"
          icon={ShieldAlert}
          accentColor="red"
          badgeText="HIGH URGENCY"
        />
        <StatCard
          title="Successful Matches"
          value={summary?.successful_matches ?? 0}
          unit="matched"
          subtitle="Resources dispatched"
          icon={CheckCircle2}
          accentColor="emerald"
          badgeText="VERIFIED"
        />
        <StatCard
          title="Active Volunteers"
          value={summary?.active_volunteers ?? 0}
          unit="personnel"
          subtitle="Available first aid"
          icon={Users}
          accentColor="purple"
          badgeText="DEPLOYED"
        />
      </div>

      {/* Main Center Content Grid: Disaster Radar + Critical Emergency Alert Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Disaster Radar */}
        <div className="lg:col-span-2">
          <DisasterRadar />
        </div>

        {/* Right 1 column: Critical Needs Emergency Panel */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                <h3 className="text-sm font-mono font-bold uppercase text-slate-100 tracking-wider">
                  Critical Emergency Alerts
                </h3>
              </div>
              <Link href="/needs" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {criticalNeeds.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-slate-400">
                No active critical emergency alerts at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {criticalNeeds.map((need) => (
                  <div
                    key={need.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-red-500/30 hover:border-red-500/60 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge label={need.priority} type="priority" size="sm" />
                      <span className="text-[10px] font-mono text-slate-400">{need.location}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{need.title}</h4>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{need.description}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                      <span>Required: {need.quantity_required} {need.unit}</span>
                      <Link
                        href={`/matching?need_id=${need.id}`}
                        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                      >
                        Match Now <Cpu className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Shelter Capacity:</span>
            <span className="font-bold text-emerald-400">{summary?.available_shelter_capacity ?? 0} Beds / Tents</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Matches Feed & Activity Trail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-mono font-bold uppercase text-slate-100 tracking-wider">
                Recent Engine Matches
              </h3>
            </div>
            <Link href="/matching" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              Matching Studio <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentMatches.length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-slate-400">
                No recent matches generated yet.
              </div>
            ) : (
              recentMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {m.match_score}% Match Score
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">• {m.distance} km</span>
                    </div>
                    <p className="text-xs text-slate-200">
                      Resource #{m.resource_id} matched to Need #{m.need_id}
                    </p>
                  </div>
                  <Badge label={m.status} type="status" size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Activity Log */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-mono font-bold uppercase text-slate-100 tracking-wider">
                Emergency Audit Activity Log
              </h3>
            </div>
            <Link href="/activity" className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1">
              View Activity <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(summary?.recent_activity || []).length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-slate-400">
                No activity logged.
              </div>
            ) : (
              summary?.recent_activity.map((act) => (
                <div key={act.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">{act.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{act.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      <CreateNeedModal
        isOpen={isNeedModalOpen}
        onClose={() => setIsNeedModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}
