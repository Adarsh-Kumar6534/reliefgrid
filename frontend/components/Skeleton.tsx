import React from "react";

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-20 h-5 bg-slate-800 rounded-full"></div>
        <div className="w-16 h-5 bg-slate-800 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="w-3/4 h-5 bg-slate-800 rounded"></div>
        <div className="w-full h-3 bg-slate-800/60 rounded"></div>
      </div>
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex justify-between">
          <div className="w-24 h-4 bg-slate-800 rounded"></div>
          <div className="w-16 h-4 bg-slate-800 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonMetrics: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="w-24 h-4 bg-slate-800 rounded"></div>
        <div className="w-8 h-8 bg-slate-800 rounded-xl"></div>
      </div>
      <div className="w-16 h-8 bg-slate-800 rounded"></div>
      <div className="w-32 h-3 bg-slate-800/60 rounded"></div>
    </div>
  );
};

export const SkeletonTable: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-panel p-4 rounded-xl border border-slate-800 animate-pulse flex items-center justify-between gap-4">
          <div className="w-1/3 h-4 bg-slate-800 rounded"></div>
          <div className="w-1/4 h-4 bg-slate-800 rounded"></div>
          <div className="w-1/6 h-4 bg-slate-800 rounded"></div>
        </div>
      ))}
    </div>
  );
};
