import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: "cyan" | "emerald" | "amber" | "red" | "purple";
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  accentColor = "cyan",
  badgeText,
}) => {
  const accentStyles = {
    cyan: {
      border: "border-cyan-500/20 hover:border-cyan-500/40",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    },
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    },
    amber: {
      border: "border-amber-500/20 hover:border-amber-500/40",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    },
    red: {
      border: "border-red-500/20 hover:border-red-500/40",
      bg: "bg-red-500/10",
      text: "text-red-400",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    },
    purple: {
      border: "border-purple-500/20 hover:border-purple-500/40",
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    },
  };

  const style = accentStyles[accentColor];

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border ${style.border} transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 ${style.glow}`}
    >
      {/* Top Subtle Neon Edge Line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${style.bg} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${style.bg} ${style.text} border border-white/5`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400 font-medium">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-400 text-[11px] font-sans">{subtitle}</span>}
        {badgeText && (
          <span className={`ml-auto font-mono text-[10px] px-2 py-0.5 rounded-full ${style.bg} ${style.text} font-semibold border border-white/5`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
