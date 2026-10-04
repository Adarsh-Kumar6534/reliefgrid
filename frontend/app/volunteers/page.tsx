"use client";

import React, { useState, useEffect } from "react";
import { Users, MapPin, ShieldCheck, Phone, Mail, Award, RefreshCw } from "lucide-react";
import { Badge } from "@/components/Badge";
import { fetchApi, Volunteer } from "@/lib/api";

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVolunteers = async () => {
    setLoading(true);
    const res = await fetchApi<Volunteer[]>("/volunteers");
    if (res.success && res.data) {
      setVolunteers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
            <Users className="w-4 h-4" />
            FIRST RESPONDERS & FIELD VOLUNTEERS
          </div>
          <h1 className="text-2xl font-extrabold font-mono text-slate-100 tracking-tight">
            Volunteer Network Registry
          </h1>
          <p className="text-xs text-slate-400">
            Certified paramedics, search & rescue personnel, and emergency triage teams.
          </p>
        </div>

        <button
          onClick={fetchVolunteers}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Volunteers Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs font-mono text-slate-400">Loading volunteer network...</div>
      ) : volunteers.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
          No registered volunteers at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {volunteers.map((vol) => (
            <div
              key={vol.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-purple-500/40 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold font-mono">
                    {vol.user?.name ? vol.user.name.charAt(0) : "V"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{vol.user?.name || "Field Volunteer"}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" />
                      <span>{vol.location}</span>
                    </div>
                  </div>
                </div>

                <Badge label={vol.availability_status} type="status" size="sm" />
              </div>

              {/* Skills */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-400" /> Certified Emergency Skills
                </span>
                <p className="text-xs text-slate-200 font-mono">{vol.skills}</p>
              </div>

              {/* Contact Info */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span>{vol.user?.phone || "+91-98765-01000"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate max-w-[150px]">{vol.user?.email || "vol@reliefgrid.org"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
