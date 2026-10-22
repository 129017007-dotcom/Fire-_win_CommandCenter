import React from 'react';
import { IncidentSeverity, IncidentStatus, DetectionClass } from '../../types';
import { Flame, CloudRain, AlertOctagon, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  type: 'severity' | 'status' | 'class' | 'demo';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  if (type === 'demo') {
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 tracking-wider ${sizeClasses}`}>
        DEMO
      </span>
    );
  }

  if (type === 'class') {
    const cls = value.toLowerCase() as DetectionClass;
    if (cls === 'fire') {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-orange-500/40 bg-orange-500/10 text-orange-400 ${sizeClasses}`}>
          <Flame className={isSm ? 'w-3 h-3 text-orange-500' : 'w-3.5 h-3.5 text-orange-500'} />
          FIRE
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 ${sizeClasses}`}>
        <CloudRain className={isSm ? 'w-3 h-3 text-cyan-500' : 'w-3.5 h-3.5 text-cyan-500'} />
        SMOKE
      </span>
    );
  }

  if (type === 'severity') {
    const sev = value.toLowerCase() as IncidentSeverity;
    switch (sev) {
      case 'critical':
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded border border-red-500/50 bg-red-500/20 text-red-400 animate-pulse ${sizeClasses}`}>
            <AlertOctagon className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-orange-500/40 bg-orange-500/15 text-orange-400 ${sizeClasses}`}>
            <ShieldAlert className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            HIGH
          </span>
        );
      case 'moderate':
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 ${sizeClasses}`}>
            MODERATE
          </span>
        );
      case 'low':
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 ${sizeClasses}`}>
            LOW
          </span>
        );
    }
  }

  if (type === 'status') {
    const stat = value.toLowerCase() as IncidentStatus;
    switch (stat) {
      case 'active':
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-red-500/40 bg-red-500/10 text-red-400 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            ACTIVE
          </span>
        );
      case 'investigating':
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 ${sizeClasses}`}>
            <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            INVESTIGATING
          </span>
        );
      case 'contained':
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 ${sizeClasses}`}>
            <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            CONTAINED
          </span>
        );
      case 'resolved':
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-mono font-medium rounded border border-slate-600 bg-slate-800 text-slate-300 ${sizeClasses}`}>
            <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            RESOLVED
          </span>
        );
    }
  }

  return <span>{value}</span>;
};
