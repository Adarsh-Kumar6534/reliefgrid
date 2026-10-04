"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, X, Package, AlertTriangle, Cpu, Users, ArrowRight } from "lucide-react";
import { fetchApi, GlobalSearchResult } from "@/lib/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetchApi<GlobalSearchResult>(`/search?q=${encodeURIComponent(query)}`);
      if (res.success && res.data) {
        setResults(res.data);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-5 shadow-2xl relative space-y-4">
        {/* Search Header */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search resources, needs, locations, or volunteers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button onClick={onClose} className="absolute right-3 text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-slate-400">Searching disaster grid database...</div>
          ) : !results && query.trim() ? (
            <div className="py-8 text-center text-xs font-mono text-slate-400">No results found for &quot;{query}&quot;</div>
          ) : !results ? (
            <div className="py-6 text-center text-xs font-mono text-slate-400">
              Type to search across resources, needs, shelters, and first responders.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Matched Resources */}
              {results.resources.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-cyan-400" /> Resources ({results.resources.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.resources.map((res) => (
                      <Link
                        key={res.id}
                        href="/resources"
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between text-xs font-mono block transition-all"
                      >
                        <span className="font-bold text-slate-200">{res.title}</span>
                        <span className="text-cyan-400">{res.quantity} {res.unit} • {res.location}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Needs */}
              {results.needs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Emergency Needs ({results.needs.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.needs.map((need) => (
                      <Link
                        key={need.id}
                        href={`/matching?need_id=${need.id}`}
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-red-500/40 flex items-center justify-between text-xs font-mono block transition-all"
                      >
                        <span className="font-bold text-slate-200">{need.title}</span>
                        <span className="text-red-400 font-bold">{need.priority} • {need.location}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
