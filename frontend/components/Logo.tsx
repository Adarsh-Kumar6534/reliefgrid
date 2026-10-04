import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = "md", showText = true }) => {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-cyan-500/20 rounded-xl blur-md"></div>

        {/* SVG Graphic */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
        >
          {/* Grid Hex Outer Frame */}
          <polygon
            points="20,2 35,10 35,30 20,38 5,30 5,10"
            stroke="url(#cyan-grad)"
            strokeWidth="2"
            fill="rgba(15, 23, 42, 0.7)"
          />

          {/* Interconnected Grid Node Lines */}
          <line x1="20" y1="2" x2="20" y2="38" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="5" y1="10" x2="35" y2="30" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="5" y1="30" x2="35" y2="10" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Central Emergency Spark / Relief Diamond */}
          <path
            d="M20 10L25 20L20 30L15 20Z"
            fill="url(#emerald-cyan-grad)"
          />

          {/* Node Dots */}
          <circle cx="20" cy="2" r="2" fill="#00f2fe" />
          <circle cx="35" cy="10" r="2" fill="#00f2fe" />
          <circle cx="35" cy="30" r="2" fill="#00f2fe" />
          <circle cx="20" cy="38" r="2" fill="#00f2fe" />
          <circle cx="5" cy="30" r="2" fill="#00f2fe" />
          <circle cx="5" cy="10" r="2" fill="#00f2fe" />
          <circle cx="20" cy="20" r="3" fill="#ffffff" />

          {/* Gradients */}
          <defs>
            <linearGradient id="cyan-grad" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="emerald-cyan-grad" x1="15" y1="10" x2="25" y2="30">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-wider text-slate-100 uppercase ${textSizes[size]} font-mono`}>
            RELIEF<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">GRID</span>
          </span>
          <span className="text-[10px] tracking-widest text-slate-400 uppercase font-sans -mt-1 font-semibold">
            Disaster Engine
          </span>
        </div>
      )}
    </div>
  );
};
