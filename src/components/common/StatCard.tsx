import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon: LucideIcon;
  variant?: 'fire' | 'alarm' | 'cyan' | 'radar' | 'amber';
  isDemo?: boolean;
  extra?: ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  trend,
  icon: Icon,
  variant = 'cyan',
  isDemo = false,
  extra,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'fire':
        return {
          border: 'border-orange-500/30 hover:border-orange-500/60',
          glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(255,85,0,0.3)]',
          iconBg: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
          accent: 'text-orange-400',
        };
      case 'alarm':
        return {
          border: 'border-red-500/30 hover:border-red-500/60',
          glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(239,68,68,0.3)]',
          iconBg: 'bg-red-500/15 text-red-400 border border-red-500/30',
          accent: 'text-red-400',
        };
      case 'radar':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]',
          iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          accent: 'text-emerald-400',
        };
      case 'amber':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)]',
          iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          accent: 'text-amber-400',
        };
      case 'cyan':
      default:
        return {
          border: 'border-cyan-500/30 hover:border-cyan-500/60',
          glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.3)]',
          iconBg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
          accent: 'text-cyan-400',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-[#0f1728]/90 backdrop-blur-md p-5 border ${styles.border} transition-all duration-300 ${styles.glow}`}
    >
      {/* Corner telemetry angle accent */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
        <div className="absolute transform rotate-45 bg-slate-800 w-12 h-2 -top-2 right-0 opacity-40"></div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              {title}
            </span>
            {isDemo && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 font-semibold">
                DEMO
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">
              {value}
            </span>
            {subValue && (
              <span className="text-xs font-mono text-slate-400">{subValue}</span>
            )}
          </div>
        </div>

        <div className={`p-3 rounded-lg ${styles.iconBg} transition-transform group-hover:scale-110 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span
            className={`font-mono font-medium flex items-center gap-1 ${
              trend.isPositive ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-slate-400 text-[11px] truncate">{trend.label}</span>
          )}
        </div>
      )}

      {extra && <div className="mt-3">{extra}</div>}
    </div>
  );
};
