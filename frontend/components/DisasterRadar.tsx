"use client";

import React, { useState } from "react";
import { Navigation, Radio, ShieldAlert, Zap, MapPin } from "lucide-react";

interface NodePoint {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
  type: "SHELTER" | "HOSPITAL" | "NEED" | "DONOR";
  details: string;
}

const initialNodes: NodePoint[] = [
  { id: "1", name: "Ludhiana Relief Hub", x: 35, y: 40, type: "SHELTER", details: "Active Shelter • 300 Ration Packets • 15 Rescue Team" },
  { id: "2", name: "Chandigarh Medical Center", x: 75, y: 30, type: "HOSPITAL", details: "Apex Hospital • 50 Units O-Neg Blood Reserve" },
  { id: "3", name: "Amritsar Trauma Center", x: 20, y: 25, type: "NEED", details: "CRITICAL: Urgent 20 Units Blood Required" },
  { id: "4", name: "Jalandhar Warehouse", x: 45, y: 20, type: "DONOR", details: "Donor Supply • 150 Medical Trauma Kits" },
  { id: "5", name: "Patiala Supply Depot", x: 65, y: 70, type: "DONOR", details: "Supply Depot • 5000L Drinking Water" },
  { id: "6", name: "Delhi Relief Logistics", x: 80, y: 85, type: "SHELTER", details: "Regional Command • 500 Emergency Blankets" },
];

export const DisasterRadar: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NodePoint | null>(initialNodes[0]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case "CRITICAL":
      case "NEED":
        return "bg-red-500 text-red-400 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.8)]";
      case "HOSPITAL":
        return "bg-rose-500 text-rose-400 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.8)]";
      case "SHELTER":
        return "bg-cyan-500 text-cyan-400 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.8)]";
      default:
        return "bg-emerald-500 text-emerald-400 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.8)]";
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
      {/* Visualizer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold uppercase text-slate-100 tracking-wider">
              Disaster Operations Grid Visualizer
            </h3>
            <p className="text-xs text-slate-400">
              Live Geographic Proximity Telemetry & Resource Grid Nodes (Punjab / North Region)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
            <Radio className="w-3 h-3 animate-ping" />
            TELEMETRY ACTIVE
          </span>
        </div>
      </div>

      {/* Radar Map Canvas Container */}
      <div className="relative w-full h-[320px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>

        {/* Concentric Radar Rings */}
        <div className="absolute w-[280px] h-[280px] rounded-full border border-cyan-500/20"></div>
        <div className="absolute w-[200px] h-[200px] rounded-full border border-cyan-500/15"></div>
        <div className="absolute w-[120px] h-[120px] rounded-full border border-cyan-500/10"></div>
        <div className="absolute w-[40px] h-[40px] rounded-full border border-cyan-500/30 bg-cyan-500/5"></div>

        {/* Radar Sweeping Beam */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[300px] h-[300px] rounded-full relative animate-radar-sweep">
            <div className="absolute top-1/2 left-1/2 w-[150px] h-[150px] origin-top-left bg-gradient-to-br from-cyan-500/20 via-cyan-500/5 to-transparent rounded-tl-full pointer-events-none"></div>
          </div>
        </div>

        {/* Inter-node Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {initialNodes.map((node, i) => {
            if (i === 0) return null;
            const parent = initialNodes[0]; // Connect all to central Ludhiana Hub
            return (
              <line
                key={`line-${node.id}`}
                x1={`${parent.x}%`}
                y1={`${parent.y}%`}
                x2={`${node.x}%`}
                y2={`${node.y}%`}
                stroke={node.type === "NEED" ? "rgba(239, 68, 68, 0.4)" : "rgba(6, 182, 212, 0.3)"}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {/* Node Points */}
        {initialNodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                isSelected ? "scale-125 z-20" : "hover:scale-110 z-10"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {/* Ping ring */}
                <span className={`animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-60 ${node.type === "NEED" ? "bg-red-400" : "bg-cyan-400"}`}></span>
                
                {/* Node dot */}
                <div className={`w-4 h-4 rounded-full border-2 ${getNodeColor(node.type)} flex items-center justify-center`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>

              {/* Node Label Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-5 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-200 shadow-md">
                {node.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Bar */}
      {selectedNode && (
        <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">{selectedNode.name}:</span>
            <span className="text-slate-300">{selectedNode.details}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] uppercase">
            {selectedNode.type}
          </span>
        </div>
      )}
    </div>
  );
};
