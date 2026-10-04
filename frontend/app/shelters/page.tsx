"use client";

import React, { useState, useEffect } from "react";
import { Building2, Home, Cross, MapPin, Users, Activity, Shield } from "lucide-react";
import { Badge } from "@/components/Badge";
import { fetchApi, Resource, User } from "@/lib/api";

export default function SheltersPage() {
  const [shelterResources, setShelterResources] = useState<Resource[]>([]);
  const [medicalResources, setMedicalResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchApi<Resource[]>("/resources");
      if (res.success && res.data) {
        setShelterResources(res.data.filter((r) => r.type === "SHELTER"));
        setMedicalResources(res.data.filter((r) => r.type === "MEDICINE" || r.type === "BLOOD"));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Building2 className="w-4 h-4" />
          INFRASTRUCTURE & MEDICAL CENTERS
        </div>
        <h1 className="text-2xl font-extrabold font-mono text-slate-100 tracking-tight">
          Shelters & Hospital Operations
        </h1>
        <p className="text-xs text-slate-400">
          Capacity monitoring for emergency shelters, relief camps, and trauma centers.
        </p>
      </div>

      {/* Grid: Shelters & Relief Camps */}
      <div className="space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
          <Home className="w-4 h-4 text-cyan-400" />
          Active Emergency Shelters & Relief Camps
        </h2>

        {loading ? (
          <div className="text-center py-8 text-xs font-mono text-slate-400">Loading shelter capacity...</div>
        ) : shelterResources.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
            No active shelter facilities registered.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {shelterResources.map((shelter) => (
              <div
                key={shelter.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{shelter.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{shelter.location}</span>
                    </div>
                  </div>
                  <Badge label={shelter.availability_status} type="status" size="sm" />
                </div>

                {/* Capacity Occupancy Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Shelter Capacity Available:</span>
                    <span className="text-cyan-400 font-bold">{shelter.quantity} {shelter.unit}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full w-3/4"></div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{shelter.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Medical & Trauma Reserves */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-sm font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
          <Cross className="w-4 h-4 text-rose-400" />
          Hospital Trauma Reserves & Blood Banks
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {medicalResources.map((med) => (
            <div
              key={med.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-rose-500/40 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <Badge label={med.type} type="resourceType" size="sm" />
                <Badge label={med.availability_status} type="status" size="sm" />
              </div>
              <h3 className="text-base font-bold text-slate-100">{med.title}</h3>
              <p className="text-xs text-slate-400">{med.description}</p>
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
                <span className="text-slate-400">Location: {med.location}</span>
                <span className="text-rose-400 font-extrabold">{med.quantity} {med.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
