import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Tv, 
  Menu, 
  X,
  Radio,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, mobileMenuOpen }) => {
  const { 
    threatLevel, 
    backendStatus, 
    backendLatency, 
    backendError,
    pingBackend, 
    settings, 
    updateSettings, 
    setCurrentView 
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualPing = async () => {
    setIsPinging(true);
    await pingBackend();
    setIsPinging(false);
  };

  const formatUtcTime = (d: Date) => {
    return d.toUTCString().replace('GMT', 'UTC');
  };

  const formatLocalTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getThreatBadge = () => {
    switch (threatLevel) {
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-950/80 border border-red-500/60 shadow-glow-alarm text-red-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider">THREAT: CRITICAL</span>
          </div>
        );
      case 'HIGH':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-orange-950/80 border border-orange-500/60 shadow-glow-fire text-orange-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider">THREAT: HIGH</span>
          </div>
        );
      case 'ELEVATED':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-950/70 border border-amber-500/50 text-amber-200">
            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            <span className="text-xs font-mono font-bold tracking-wider">THREAT: ELEVATED</span>
          </div>
        );
      case 'LOW':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            <span className="text-xs font-mono font-medium tracking-wider">THREAT: NOMINAL</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-3 bg-[#0a0f18]/95 backdrop-blur-md border-b border-panel-border">
      {/* Left: Mobile hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-panel-card border border-panel-border text-slate-300 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 shadow-glow-fire text-white">
            <Flame className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-[#0a0f18]"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
                FIRETWIN <span className="text-xs font-normal text-orange-400 font-sans px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">AI</span>
              </h1>
              <span className="hidden sm:inline-block text-xs font-mono text-slate-400">| COMMAND CENTER</span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-mono">
              Predictive Fire & Smoke Containment System • YOLO11s Dual-Class
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Threat indicator */}
      <div className="hidden lg:flex items-center gap-4">
        {getThreatBadge()}
      </div>

      {/* Right: Telemetry & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Clock */}
        <div className="hidden xl:flex flex-col text-right font-mono text-[11px] text-slate-400 bg-panel-dark/80 px-2.5 py-1 rounded border border-panel-border">
          <span className="text-slate-200 font-semibold">{formatLocalTime(currentTime)}</span>
          <span className="text-[10px] text-slate-400">{formatUtcTime(currentTime).slice(0, 16)} UTC</span>
        </div>

        {/* Backend Connection Status Pill */}
        <div className="relative">
          <button
            onClick={() => setShowStatusPopover(!showStatusPopover)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              backendStatus === 'online'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                : backendStatus === 'checking'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300 hover:border-red-400'
            }`}
            title="Click to check FastAPI Backend status"
          >
            {backendStatus === 'online' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">FASTAPI ONLINE</span>
                <span className="text-[10px] text-emerald-400/80">({backendLatency}ms)</span>
              </>
            ) : backendStatus === 'checking' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="hidden sm:inline">PINGING...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="hidden sm:inline">BACKEND OFFLINE</span>
                <span className="sm:hidden">OFFLINE</span>
              </>
            )}
          </button>

          {/* Quick Connection Popover */}
          {showStatusPopover && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-panel-card border border-panel-border shadow-2xl p-4 z-50 text-left text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-mono font-semibold text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-orange-400" /> Backend Telemetry
                </span>
                <button
                  onClick={handleManualPing}
                  disabled={isPinging}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Ping Server Now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[170px]">
                    {settings.apiBaseUrl}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-mono font-semibold ${backendStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {backendStatus.toUpperCase()}
                  </span>
                </div>
                {backendStatus === 'online' && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Round-trip Latency:</span>
                    <span className="font-mono text-emerald-400">{backendLatency} ms</span>
                  </div>
                )}
                {backendError && (
                  <div className="p-2 rounded bg-red-950/50 border border-red-500/30 text-[11px] text-red-300 font-mono">
                    {backendError}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => {
                    setCurrentView('settings');
                    setShowStatusPopover(false);
                  }}
                  className="text-orange-400 hover:text-orange-300 font-mono text-xs underline"
                >
                  Configure API & Model →
                </button>
                <button
                  onClick={() => setShowStatusPopover(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audio Alerts Toggle */}
        <button
          onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
          className={`p-2 rounded-lg border transition-colors ${
            settings.soundAlerts
              ? 'bg-panel-card border-panel-border text-orange-400 hover:text-orange-300'
              : 'bg-panel-card border-panel-border text-slate-500 hover:text-slate-400'
          }`}
          title={settings.soundAlerts ? 'Audio Alarm Enabled' : 'Audio Alarm Muted'}
          aria-label="Toggle Audio Alarm"
        >
          {settings.soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* CRT Scanline effect toggle */}
        <button
          onClick={() => updateSettings({ scanlineEffect: !settings.scanlineEffect })}
          className={`p-2 rounded-lg border transition-colors ${
            settings.scanlineEffect
              ? 'bg-panel-card border-cyan-500/50 text-cyan-400'
              : 'bg-panel-card border-panel-border text-slate-500 hover:text-slate-400'
          }`}
          title={settings.scanlineEffect ? 'Tactical CRT Scanline: ON' : 'Tactical CRT Scanline: OFF'}
          aria-label="Toggle CRT Scanline Effect"
        >
          <Tv className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
