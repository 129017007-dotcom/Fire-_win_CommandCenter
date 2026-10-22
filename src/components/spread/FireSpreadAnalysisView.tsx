import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BuildingDigitalTwinView } from '../digitaltwin/BuildingDigitalTwinView';
import { 
  Wind, 
  Compass, 
  Thermometer, 
  Droplets, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight,
  Info,
  Maximize2,
  Building2,
  Activity
} from 'lucide-react';

export const FireSpreadAnalysisView: React.FC = () => {
  const { setCurrentView } = useApp();
  const [activeSpreadTab, setActiveSpreadTab] = useState<'digital-twin' | 'perimeter-cellular'>('digital-twin');

  // Environmental Controls
  const [windSpeed, setWindSpeed] = useState<number>(24); // km/h
  const [windDirection, setWindDirection] = useState<'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'>('NE');
  const [ambientTemp, setAmbientTemp] = useState<number>(34); // °C
  const [humidity, setHumidity] = useState<number>(28); // %
  const [fuelType, setFuelType] = useState<'chemical' | 'timber' | 'warehouse' | 'brush'>('chemical');

  // Simulation Time Step: 0 to 60 minutes
  const [timeStepMinutes, setTimeStepMinutes] = useState<number>(15);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-play interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeStepMinutes((prev) => {
          if (prev >= 60) {
            setIsPlaying(false);
            return 60;
          }
          return prev + 5;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Direction angle calculation (in radians)
  const getWindAngleRad = () => {
    switch (windDirection) {
      case 'N': return -Math.PI / 2;
      case 'NE': return -Math.PI / 4;
      case 'E': return 0;
      case 'SE': return Math.PI / 4;
      case 'S': return Math.PI / 2;
      case 'SW': return (3 * Math.PI) / 4;
      case 'W': return Math.PI;
      case 'NW': return -(3 * Math.PI) / 4;
    }
  };

  // Draw 2D Cellular Thermal Spread Simulation onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw Tactical Grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Facility Sector Boundaries
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Sector Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('SECTOR 4A - VAPOR SCRUBBERS', 70, 80);
    ctx.fillText('SECTOR 4B - SOLVENT STORAGE (IGNITION SOURCE)', 70, height - 70);
    ctx.fillText('SECTOR 4C - PIPELINE RACK', width - 230, 80);

    // Ignition Origin Point (Sector 4B)
    const originX = width * 0.38;
    const originY = height * 0.58;

    // Physics parameters for simulation model
    const windAngle = getWindAngleRad();
    const windMultiplier = 1 + (windSpeed / 50);
    const humidityDampener = Math.max(0.4, (100 - humidity) / 100);
    const fuelMultiplier = fuelType === 'chemical' ? 1.6 : fuelType === 'timber' ? 1.2 : fuelType === 'brush' ? 1.4 : 0.9;

    // Base radius scales with time
    const baseRadius = (timeStepMinutes * 3.2) * humidityDampener * fuelMultiplier;

    // Thermal spread gradient
    if (timeStepMinutes > 0) {
      const gradient = ctx.createRadialGradient(
        originX + Math.cos(windAngle) * baseRadius * 0.4 * windMultiplier,
        originY + Math.sin(windAngle) * baseRadius * 0.4 * windMultiplier,
        baseRadius * 0.1,
        originX + Math.cos(windAngle) * baseRadius * 0.3,
        originY + Math.sin(windAngle) * baseRadius * 0.3,
        baseRadius * windMultiplier * 1.3
      );

      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)'); // Core white flash
      gradient.addColorStop(0.15, 'rgba(255, 85, 0, 0.85)'); // Flame orange
      gradient.addColorStop(0.45, 'rgba(239, 68, 68, 0.65)'); // Thermal red
      gradient.addColorStop(0.75, 'rgba(100, 116, 139, 0.45)'); // Heavy smoke plume
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)'); // Falloff

      // Draw oval flame ellipse warped by wind direction
      ctx.save();
      ctx.translate(originX, originY);
      ctx.rotate(windAngle);
      ctx.scale(1 + (windSpeed / 40), 1); // stretch along wind axis

      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Flame front contour line
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Ignition Origin Marker
    ctx.beginPath();
    ctx.arc(originX, originY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff5500';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.fillStyle = '#ff5500';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('IGNITION T0', originX + 12, originY + 4);

    // Draw Wind Vector Indicator in Top Right
    const compassX = width - 80;
    const compassY = 80;
    const arrowLen = 30;

    ctx.beginPath();
    ctx.arc(compassX, compassY, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Arrow pointing with wind
    ctx.beginPath();
    ctx.moveTo(
      compassX - Math.cos(windAngle) * (arrowLen * 0.7),
      compassY - Math.sin(windAngle) * (arrowLen * 0.7)
    );
    ctx.lineTo(
      compassX + Math.cos(windAngle) * arrowLen,
      compassY + Math.sin(windAngle) * arrowLen
    );
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${windDirection} ${windSpeed} km/h`, compassX, compassY + 46);
    ctx.textAlign = 'left';

  }, [timeStepMinutes, windSpeed, windDirection, ambientTemp, humidity, fuelType]);

  // Derived simulation metrics
  const estVelocity = (
    (1.2 + (windSpeed * 0.05) + (ambientTemp * 0.02) - (humidity * 0.01)) *
    (fuelType === 'chemical' ? 1.5 : 1.0)
  ).toFixed(2);

  const estAreaRisk = Math.round(
    Math.PI * Math.pow(timeStepMinutes * parseFloat(estVelocity), 1.6)
  );

  const timeToBoundary = Math.max(
    4,
    Math.round(85 / (parseFloat(estVelocity) || 1))
  );

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tab Selector */}
      <div className="p-1.5 rounded-2xl bg-panel-card border border-panel-border flex items-center justify-between gap-2 shadow-command-card max-w-xl">
        <button
          onClick={() => setActiveSpreadTab('digital-twin')}
          className={`flex-1 py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSpreadTab === 'digital-twin'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-glow-fire'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Building Digital Twin (6 Zones)</span>
        </button>

        <button
          onClick={() => setActiveSpreadTab('perimeter-cellular')}
          className={`flex-1 py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSpreadTab === 'perimeter-cellular'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-glow-fire'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Tactical Perimeter Cellular</span>
        </button>
      </div>

      {activeSpreadTab === 'digital-twin' ? (
        <BuildingDigitalTwinView />
      ) : (
        <>
          {/* Explicit Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono text-amber-200 flex items-start gap-3 shadow-command-card">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
            <span>SIMULATION NOTICE: TACTICAL PROPAGATION MODELING ONLY</span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/20 text-amber-300">
              UNVALIDATED SIMULATION
            </span>
          </div>
          <p className="mt-1 text-amber-200/90 leading-relaxed font-sans text-xs">
            Spread models displayed in this view are cellular physics approximations for spatial containment planning and are <strong>not certified predictive forecasts</strong>. Real fire dynamics depend heavily on unmeasured building microclimates, ventilation drafts, and fuel loading.
          </p>
        </div>
      </div>

      {/* Main Simulation Viewport & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2D Simulation Canvas & Time Stepper */}
        <div className="lg:col-span-8 rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card flex flex-col">
          {/* Canvas Header */}
          <div className="px-5 py-3 border-b border-panel-border flex flex-wrap items-center justify-between gap-3 bg-[#0a0f18]/90">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                SIMULATED THERMAL PROPAGATION MODEL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950/60 border border-orange-500/30 text-orange-400">
                T + {timeStepMinutes} MIN
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                  isPlaying
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-glow-fire'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY SPREAD'}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setTimeStepMinutes(0);
                }}
                className="p-1.5 rounded-lg bg-panel-dark border border-panel-border hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Reset Simulation to T0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Display */}
          <div className="relative bg-black flex items-center justify-center p-2 min-h-[380px] overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={440}
              className="w-full h-auto max-h-[460px] object-contain rounded-lg shadow-inner"
            />

            {/* Bottom Floating Timeline Scrubber */}
            <div className="absolute bottom-4 left-6 right-6 bg-[#0a0f18]/90 backdrop-blur-md p-3 rounded-xl border border-panel-border shadow-2xl flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-300 shrink-0">
                Time Horizon:
              </span>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={timeStepMinutes}
                onChange={(e) => setTimeStepMinutes(parseInt(e.target.value))}
                className="w-full accent-orange-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                {[0, 15, 30, 45, 60].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeStepMinutes(t)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                      timeStepMinutes === t
                        ? 'bg-orange-500 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    +{t}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Environmental Controls & Dynamic Spread Telemetry */}
        <div className="lg:col-span-4 space-y-5">
          {/* Environmental Parameter Knobs */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-4 shadow-command-card">
            <div className="flex items-center justify-between pb-3 border-b border-panel-border">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                Atmospheric & Fuel Modifiers
              </span>
              <span className="text-[10px] font-mono text-slate-400">SIMULATION INPUTS</span>
            </div>

            {/* Wind Speed */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-300">Wind Velocity:</span>
                <span className="text-cyan-400 font-bold">{windSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="2"
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseInt(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Wind Direction Selector */}
            <div>
              <div className="text-xs font-mono text-slate-300 mb-1.5">
                Wind Propagation Vector:
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                {(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setWindDirection(dir)}
                    className={`py-1.5 rounded-lg border text-center font-bold transition-all ${
                      windDirection === dir
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-glow-cyan'
                        : 'bg-[#090e18] border-panel-border text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel Classification */}
            <div>
              <div className="text-xs font-mono text-slate-300 mb-1.5">
                Combustion Substrate / Fuel:
              </div>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full bg-[#090e18] border border-panel-border rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="chemical">Volatile Solvents (High Flame Velocity)</option>
                <option value="timber">Dry Pine Pallets (Heavy Embers)</option>
                <option value="warehouse">Cardboard / Plastic Wrap (Moderate)</option>
                <option value="brush">Perimeter Brush & Vegetation (Rapid Flank)</option>
              </select>
            </div>

            {/* Ambient Temp & Humidity */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Ambient Temp: <strong className="text-orange-400">{ambientTemp}°C</strong>
                </span>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(parseInt(e.target.value))}
                  className="w-full accent-orange-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Rel Humidity: <strong className="text-cyan-400">{humidity}%</strong>
                </span>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={humidity}
                  onChange={(e) => setHumidity(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Derived Model Output Cards */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border space-y-3 shadow-command-card text-xs font-mono">
            <span className="text-xs font-mono font-bold text-white uppercase block pb-2 border-b border-panel-border">
              Derived Spread Telemetry (SIMULATED)
            </span>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Front Advance Velocity:</span>
              <span className="text-orange-400 font-bold text-sm">{estVelocity} m/min</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Projected Hazard Area:</span>
              <span className="text-slate-200 font-bold">{estAreaRisk.toLocaleString()} m²</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Est Time to Sector Breach:</span>
              <span className={`font-bold ${timeToBoundary < 15 ? 'text-red-400 font-bold' : 'text-amber-400'}`}>
                ~{timeToBoundary} minutes
              </span>
            </div>

            <button
              onClick={() => setCurrentView('containment')}
              className="w-full mt-3 py-2.5 rounded-xl bg-panel-dark hover:bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>View Containment Recommendations</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
