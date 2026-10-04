import React from "react";

interface BadgeProps {
  label: string;
  type?: "priority" | "status" | "resourceType" | "generic";
  variant?: string;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ label, type = "generic", variant, size = "md" }) => {
  const value = (variant || label || "").toUpperCase();

  let colorClasses = "bg-slate-800 text-slate-300 border-slate-700";

  if (type === "priority") {
    switch (value) {
      case "CRITICAL":
        colorClasses = "bg-red-500/15 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
        break;
      case "HIGH":
        colorClasses = "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
        break;
      case "MEDIUM":
        colorClasses = "bg-blue-500/15 text-blue-400 border-blue-500/40";
        break;
      case "LOW":
        colorClasses = "bg-slate-800 text-slate-400 border-slate-700";
        break;
    }
  } else if (type === "status") {
    switch (value) {
      case "AVAILABLE":
      case "OPEN":
      case "ACCEPTED":
      case "COMPLETED":
        colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
        break;
      case "PARTIALLY_MATCHED":
      case "PROPOSED":
      case "RESERVED":
        colorClasses = "bg-cyan-500/15 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
        break;
      case "MATCHED":
      case "BUSY":
        colorClasses = "bg-purple-500/15 text-purple-400 border-purple-500/40";
        break;
      case "EXHAUSTED":
      case "CLOSED":
      case "REJECTED":
      case "OFFLINE":
        colorClasses = "bg-slate-800 text-slate-400 border-slate-700";
        break;
    }
  } else if (type === "resourceType") {
    switch (value) {
      case "FOOD":
        colorClasses = "bg-amber-500/15 text-amber-400 border-amber-500/30";
        break;
      case "WATER":
        colorClasses = "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
        break;
      case "MEDICINE":
        colorClasses = "bg-red-500/15 text-red-400 border-red-500/30";
        break;
      case "BLOOD":
        colorClasses = "bg-rose-500/20 text-rose-300 border-rose-500/40";
        break;
      case "SHELTER":
        colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
        break;
      case "VOLUNTEER":
        colorClasses = "bg-purple-500/15 text-purple-400 border-purple-500/30";
        break;
      default:
        colorClasses = "bg-slate-800 text-slate-300 border-slate-700";
    }
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded-full border ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
};
