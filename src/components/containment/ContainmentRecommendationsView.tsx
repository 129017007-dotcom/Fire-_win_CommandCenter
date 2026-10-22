import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Wind, 
  Flame, 
  CloudRain, 
  Power, 
  Radio, 
  Truck, 
  Drone, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Download, 
  ChevronRight,
  Info
} from 'lucide-react';

interface AdvisoryAction {
  id: string;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'ADVISORY';
  category: 'HVAC / Atmosphere' | 'Evacuation' | 'Suppression Simulation' | 'Reconnaissance';
  description: string;
  rationale: string;
  isSimulatedOnly: boolean;
  status: 'PENDING' | 'EXECUTED_SIMULATION' | 'SKIPPED';
}

export const ContainmentRecommendationsView: React.FC = () => {
  const { incidents, threatLevel, triggerAlarmSound } = useApp();

  const [actions, setActions] = useState<AdvisoryAction[]>([
    {
      id: 'ADV-01',
      title: 'Sector 4B HVAC & Smoke Damper Lockdown',
      priority: 'CRITICAL',
      category: 'HVAC / Atmosphere',
      description: 'Isolate primary supply air handling unit AHU-04 and close motorized fire dampers in ducts FD-401 through FD-408.',
      rationale: 'Suppresses fresh oxygen supply and stops toxic solvent smoke migrating to adjacent occupied offices.',
      isSimulatedOnly: true,
      status: 'PENDING',
    },
    {
      id: 'ADV-02',
      title: 'Dynamic Evacuation Route #2 Activation',
      priority: 'CRITICAL',
      category: 'Evacuation',
      description: 'Route plant personnel via West Emergency Stairwell away from Sector 4B chemical vapor plume.',
      rationale: 'Wind model (NE 24 km/h) carries combustion aerosols toward East Corridor.',
      isSimulatedOnly: true,
      status: 'PENDING',
    },
    {
      id: 'ADV-03',
      title: 'Pre-charge Water Mist Deluge Curtain (Simulated)',
      priority: 'HIGH',
      category: 'Suppression Simulation',
      description: 'Simulate high-pressure water mist curtain zone 4B-East to establish thermal boundary barrier.',
      rationale: 'Thermal flux estimated at 485°C risks flashover to adjacent hydrocarbon storage tanks.',
      isSimulatedOnly: true,
      status: 'PENDING',
    },
    {
      id: 'ADV-04',
      title: 'Autonomous Drone Aerial Thermal Scan (Simulated)',
      priority: 'HIGH',
      category: 'Reconnaissance',
      description: 'Dispatch Drone Unit DR-2 on pre-mapped perimeter patrol for overhead FLIR thermal imaging.',
      rationale: 'Verifies whether structural roof decking has exceeded critical 200°C deflection limit.',
      isSimulatedOnly: true,
      status: 'PENDING',
    },
    {
      id: 'ADV-05',
      title: 'Industrial Electrical Vault Isolation',
      priority: 'ADVISORY',
      category: 'HVAC / Atmosphere',
      description: 'Trip 480V sub-breaker MCC-4B to prevent secondary electrical flashover and arcing.',
      rationale: 'Conduit runs in ceiling plenum exposed to high radiant heat.',
      isSimulatedOnly: true,
      status: 'PENDING',
    },
  ]);

  // Drill Simulation Stepper State
  const [drillRunning, setDrillRunning] = useState<boolean>(false);
  const [drillStep, setDrillStep] = useState<number>(0);
  const [drillLogs, setDrillLogs] = useState<string[]>([]);

  const handleSimulateAction = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: 'EXECUTED_SIMULATION' } : a));
  };

  // Run full drill simulation
  const handleStartFullDrill = () => {
    setDrillRunning(true);
    setDrillStep(1);
    setDrillLogs([`[00:00] SIMULATION INITIALIZED: Threat Index ${threatLevel}`]);
    triggerAlarmSound();

    setTimeout(() => {
      setDrillStep(2);
      setDrillLogs(prev => [...prev, '[00:02] SIMULATED: Sector 4B HVAC dampers signaled closed. Vent loop sealed.']);
      handleSimulateAction('ADV-01');
    }, 1500);

    setTimeout(() => {
      setDrillStep(3);
      setDrillLogs(prev => [...prev, '[00:04] SIMULATED: Evacuation Corridor #2 signs illuminated. Audio sirens broadcast.']);
      handleSimulateAction('ADV-02');
    }, 3000);

    setTimeout(() => {
      setDrillStep(4);
      setDrillLogs(prev => [...prev, '[00:06] SIMULATED: High-pressure mist deluge curtain pre-charge valve armed.']);
      handleSimulateAction('ADV-03');
    }, 4500);

    setTimeout(() => {
      setDrillStep(5);
      setDrillLogs(prev => [...prev, '[00:08] SIMULATION DRILL COMPLETED: All advisory protocols validated.']);
      setDrillRunning(false);
    }, 6000);
  };

  const handleResetDrill = () => {
    setDrillRunning(false);
    setDrillStep(0);
    setDrillLogs([]);
    setActions(prev => prev.map(a => ({ ...a, status: 'PENDING' })));
  };

  return (
    <div className="space-y-6">
      {/* Strict Advisory Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono text-amber-200 flex items-start gap-3 shadow-command-card">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
            <span>ADVISORY SYSTEM NOTICE: SIMULATION PROTOCOL ONLY</span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/20 text-amber-300">
              NON-PHYSICAL DRILL MODE
            </span>
          </div>
          <p className="mt-1 text-amber-200/90 leading-relaxed font-sans text-xs">
            All containment recommendations and response buttons in this module are <strong>advisory simulations only</strong>. FireTwin does not activate real-world physical suppression, deluge valves, or mechanical dampers. On-site responders must verify all conditions and follow facility Standard Operating Procedures (SOPs).
          </p>
        </div>
      </div>

      {/* Main Grid: Recommended Actions (Left) + Drill Simulator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Advisory Action Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-panel-card border border-panel-border p-5 shadow-command-card flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                Automated Containment Advisories ({actions.length})
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Synthesized from active YOLO11s thermal/optical classifications and sector geometry.
              </p>
            </div>

            <button
              onClick={() => {
                const data = JSON.stringify(actions, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `FireTwin_Containment_Advisory_${Date.now()}.json`;
                a.click();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel-dark border border-panel-border text-xs font-mono text-slate-300 hover:text-white"
            >
              <Download className="w-3.5 h-3.5" /> Export Action Checklist
            </button>
          </div>

          {/* Action Cards */}
          <div className="space-y-3.5">
            {actions.map((act) => (
              <div
                key={act.id}
                className="p-5 rounded-2xl bg-panel-card border border-panel-border hover:border-slate-600 transition-all shadow-command-card flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{act.id}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          act.priority === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : act.priority === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        }`}
                      >
                        {act.priority}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {act.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        act.status === 'EXECUTED_SIMULATION'
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}
                    >
                      {act.status === 'EXECUTED_SIMULATION' ? 'SIMULATION EXECUTED' : 'ADVISORY PENDING'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold font-mono text-white mt-2.5">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                    {act.description}
                  </p>

                  <div className="mt-2.5 p-2 rounded-lg bg-[#090e18] border border-panel-border text-[11px] font-mono text-slate-400 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Rationale:</strong> {act.rationale}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] text-amber-400/80">
                    * Simulates containment command only
                  </span>

                  <button
                    onClick={() => handleSimulateAction(act.id)}
                    disabled={act.status === 'EXECUTED_SIMULATION'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      act.status === 'EXECUTED_SIMULATION'
                        ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40'
                    }`}
                  >
                    {act.status === 'EXECUTED_SIMULATION' ? 'Simulated ✓' : 'Simulate Drill Execution'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Drill Walkthrough Simulator */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-4 shadow-command-card">
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-orange-400" />
                Containment Drill Simulator
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">
                DRILL MODE
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Step through the full multi-tier emergency containment sequence as a virtual training drill.
            </p>

            {/* Drill Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Drill Sequence:</span>
                <span className="text-orange-400 font-bold">Step {drillStep} / 5</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${(drillStep / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Drill Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleStartFullDrill}
                disabled={drillRunning || drillStep === 5}
                className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  drillRunning || drillStep === 5
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-glow-fire'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{drillRunning ? 'DRILL IN PROGRESS...' : 'START CONTAINMENT DRILL'}</span>
              </button>

              <button
                onClick={handleResetDrill}
                className="p-2.5 rounded-xl bg-panel-dark border border-panel-border text-slate-400 hover:text-white"
                title="Reset Drill"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Live Drill Log Console */}
            <div className="p-3 rounded-xl bg-black border border-panel-border space-y-1.5 max-h-56 overflow-y-auto font-mono text-[11px]">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-900">
                Live Simulation Telemetry Log
              </div>
              {drillLogs.length === 0 ? (
                <div className="text-slate-600 py-3 text-center">
                  Press Start to initiate drill sequence.
                </div>
              ) : (
                drillLogs.map((log, idx) => (
                  <div key={idx} className="text-emerald-400 font-mono leading-tight">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Plant Safety Hotline / Advisory Checklist */}
          <div className="p-4 rounded-2xl bg-panel-card border border-panel-border text-xs font-mono space-y-2.5 shadow-command-card">
            <span className="text-slate-300 font-bold block uppercase border-b border-slate-800 pb-2">
              Emergency Contact Protocols (Advisory)
            </span>
            <div className="space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Facility Fire Brigade:</span>
                <span className="text-slate-200 font-bold">Ext. 911 / Ch 14</span>
              </div>
              <div className="flex justify-between">
                <span>Hazmat Spill Team:</span>
                <span className="text-slate-200 font-bold">Ext. 904 / Ch 09</span>
              </div>
              <div className="flex justify-between">
                <span>Site Safety Officer:</span>
                <span className="text-slate-200 font-bold">Channel 02</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
