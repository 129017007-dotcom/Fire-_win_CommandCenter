import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewType } from '../../types';
import { 
  LayoutDashboard, 
  ScanSearch, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  History, 
  Settings, 
  Flame,
  Radio,
  Cpu,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentView, setCurrentView, incidents, backendStatus } = useApp();

  const activeIncidentsCount = incidents.filter(i => i.status === 'active').length;

  const navItems: NavItem[] = [
    {
      id: 'command-center',
      label: 'Command Center',
      icon: LayoutDashboard,
    },
    {
      id: 'ai-detection-lab',
      label: 'AI Detection Lab',
      icon: ScanSearch,
    },
    {
      id: 'incidents',
      label: 'Incident Management',
      icon: AlertTriangle,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40',
    },
    {
      id: 'fire-spread',
      label: 'Fire Spread Analysis',
      icon: Activity,
    },
    {
      id: 'containment',
      label: 'Containment Recommendations',
      icon: ShieldCheck,
    },
    {
      id: 'detection-history',
      label: 'Detection History',
      icon: History,
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: ViewType) => {
    setCurrentView(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 lg:z-20 h-screen lg:h-[calc(100vh-61px)] w-64 bg-[#0a0e17] border-r border-panel-border flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Mobile brand header (only on mobile) */}
          <div className="lg:hidden flex items-center justify-between pb-3 mb-2 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-mono font-bold text-white tracking-wider">FIRETWIN AI</span>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Operations Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500/15 to-transparent text-orange-400 font-semibold border-l-2 border-orange-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-orange-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Model Status Card */}
          <div className="p-3 rounded-xl bg-panel-dark border border-panel-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Active Model
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                YOLO11s
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Classes:</span>
                <span className="text-orange-400">Fire & Smoke</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resolution:</span>
                <span>640 x 640 px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Server:</span>
                <span className={`font-semibold ${backendStatus === 'online' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {backendStatus === 'online' ? 'FastAPI Connected' : 'Waiting for Server'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-panel-border bg-[#080b12] text-[11px] font-mono text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">SYSTEM BUILD</span>
            <span className="text-[10px] text-slate-400">v1.2.4-PROD</span>
          </div>
          <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-300/80 leading-relaxed">
            ADVISORY NOTICE: Automated containment systems are in simulation mode. Follow site SOPs.
          </div>
        </div>
      </aside>
    </>
  );
};
