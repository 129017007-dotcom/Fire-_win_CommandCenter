import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DetectionResult } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { 
  History, 
  Trash2, 
  Download, 
  Eye, 
  Flame, 
  CloudRain, 
  Cpu, 
  FileQuestion, 
  Sparkles, 
  ExternalLink,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';

export const DetectionHistoryView: React.FC = () => {
  const { 
    detectionHistory, 
    clearDetectionHistory, 
    setCurrentView, 
    showDemoRecordsInHistory, 
    setShowDemoRecordsInHistory 
  } = useApp();

  const [inspectingRecord, setInspectingRecord] = useState<DetectionResult | null>(null);
  const [filterClass, setFilterClass] = useState<'all' | 'fire' | 'smoke'>('all');

  // Benchmark demo history sample if user toggles on
  const demoHistorySamples: DetectionResult[] = [
    {
      id: 'benchmark-hist-01',
      timestamp: '2026-10-21 21:12:00 UTC',
      fileName: 'solvents_bay_cam04_frame.jpg',
      fileType: 'image',
      fileSize: 524288,
      mediaUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80',
      isDemo: true,
      inferenceTimeMs: 14.2,
      modelUsed: 'YOLO11s-FireSmoke-Benchmark (DEMO)',
      boxes: [
        { id: 'b1', class: 'fire', confidence: 0.94, x: 0.28, y: 0.42, width: 0.22, height: 0.35, areaPixels: 45200 },
        { id: 'b2', class: 'smoke', confidence: 0.91, x: 0.24, y: 0.12, width: 0.54, height: 0.44, areaPixels: 138000 }
      ],
      counts: { fire: 1, smoke: 1, total: 2 },
      highestConfidence: 0.94,
    },
    {
      id: 'benchmark-hist-02',
      timestamp: '2026-10-21 18:40:15 UTC',
      fileName: 'timber_smolder_cam02_frame.jpg',
      fileType: 'image',
      fileSize: 412000,
      mediaUrl: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=600&q=80',
      isDemo: true,
      inferenceTimeMs: 12.8,
      modelUsed: 'YOLO11s-FireSmoke-Benchmark (DEMO)',
      boxes: [
        { id: 'b3', class: 'smoke', confidence: 0.89, x: 0.15, y: 0.18, width: 0.68, height: 0.52, areaPixels: 185000 }
      ],
      counts: { fire: 0, smoke: 1, total: 1 },
      highestConfidence: 0.89,
    }
  ];

  const displayedRecords = [
    ...detectionHistory,
    ...(showDemoRecordsInHistory ? demoHistorySamples : [])
  ].filter(record => {
    if (filterClass === 'fire') return record.counts.fire > 0;
    if (filterClass === 'smoke') return record.counts.smoke > 0;
    return true;
  });

  const realRecordsCount = detectionHistory.filter(r => !r.isDemo).length;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(displayedRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FireTwin_Detection_History_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-panel-card border border-panel-border p-5 lg:p-6 shadow-command-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              AUDIT TRAIL & LOGS
            </span>
            <span className="text-xs font-mono text-slate-400">
              Inference Session Telemetry Record
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            Detection History & Inference Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-sans">
            Review previous frame detections, confidence scores, bounding box coordinates, and inference latency.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {displayedRecords.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel-dark border border-panel-border hover:border-slate-600 text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={clearDetectionHistory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel-dark border border-panel-border hover:border-red-500/50 text-xs font-mono text-slate-400 hover:text-red-400 transition-colors"
                title="Clear Session History"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Control Strip & Demo Toggle */}
      <div className="p-4 rounded-2xl bg-panel-card border border-panel-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filter Detections:</span>
          {(['all', 'fire', 'smoke'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterClass(c)}
              className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                filterClass === c
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold'
                  : 'bg-[#090e18] text-slate-400 border border-panel-border hover:text-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Demo Record Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDemoRecordsInHistory}
            onChange={(e) => setShowDemoRecordsInHistory(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-0"
          />
          <span className="text-slate-300">
            Show Pre-computed Benchmark Records (Explicitly labelled <span className="text-amber-400 font-bold">DEMO</span>)
          </span>
        </label>
      </div>

      {/* Main Records Display or Empty State */}
      {displayedRecords.length === 0 ? (
        <div className="rounded-2xl bg-panel-card border border-panel-border p-12 text-center shadow-command-card flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-panel-border flex items-center justify-center text-slate-600">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono text-white">
              No Real Detection Records Logged
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-sans leading-relaxed">
              No real-time YOLO11s detection inferences have been executed during this session yet. To record telemetry, upload an image or video in the AI Detection Lab with your connected FastAPI backend.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setCurrentView('ai-detection-lab')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-mono text-xs font-bold hover:shadow-glow-fire transition-all"
            >
              <span>Launch AI Detection Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDemoRecordsInHistory(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-panel-dark border border-panel-border hover:border-amber-500/50 text-amber-300 font-mono text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Load Benchmark Demo Records</span>
            </button>
          </div>
        </div>
      ) : (
        /* History Records Table */
        <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0f18] text-slate-400 uppercase text-[10px] tracking-wider border-b border-panel-border">
                <tr>
                  <th className="px-4 py-3">Record ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Filename / Type</th>
                  <th className="px-4 py-3">Fire Detected</th>
                  <th className="px-4 py-3">Smoke Detected</th>
                  <th className="px-4 py-3">Peak Confidence</th>
                  <th className="px-4 py-3">Inference Latency</th>
                  <th className="px-4 py-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border text-slate-300">
                {displayedRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setInspectingRecord(rec)}
                  >
                    <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                      {rec.id}
                      {rec.isDemo && <StatusBadge type="demo" value="DEMO" size="sm" />}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{rec.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="text-white truncate max-w-xs">{rec.fileName}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{rec.fileType} • {(rec.fileSize / 1024).toFixed(0)} KB</div>
                    </td>
                    <td className="px-4 py-3">
                      {rec.counts.fire > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-orange-400">
                          <Flame className="w-3.5 h-3.5" /> {rec.counts.fire} fire instance{rec.counts.fire > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rec.counts.smoke > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-cyan-400">
                          <CloudRain className="w-3.5 h-3.5" /> {rec.counts.smoke} plume{rec.counts.smoke > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-200">
                      {(rec.highestConfidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">
                      {rec.inferenceTimeMs} ms
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingRecord(rec);
                        }}
                        className="px-2.5 py-1 rounded bg-panel-dark hover:bg-orange-500/20 hover:text-orange-400 border border-panel-border text-[11px] text-slate-300 transition-colors"
                      >
                        Inspect Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {inspectingRecord && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingRecord(null)}
          title={`INSPECTION RECORD: ${inspectingRecord.id}`}
          subtitle={`${inspectingRecord.fileName} • ${inspectingRecord.timestamp}`}
          icon={History}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs font-mono">
            {inspectingRecord.isDemo && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300">
                Notice: This record is a benchmark pre-computed sample explicitly labelled DEMO.
              </div>
            )}

            {/* Media preview */}
            <div className="relative rounded-xl overflow-hidden bg-black max-h-[300px] flex items-center justify-center border border-panel-border">
              <img
                src={inspectingRecord.mediaUrl}
                alt={inspectingRecord.fileName}
                className="max-h-[300px] object-contain"
              />
            </div>

            {/* Telemetry info */}
            <div className="p-3.5 rounded-xl bg-panel-dark border border-panel-border space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Model Used:</span>
                <span className="text-white font-bold">{inspectingRecord.modelUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inference Latency:</span>
                <span className="text-emerald-400 font-bold">{inspectingRecord.inferenceTimeMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class Detections:</span>
                <span className="text-slate-200">Fire: {inspectingRecord.counts.fire} | Smoke: {inspectingRecord.counts.smoke}</span>
              </div>
              {inspectingRecord.preliminarySeverity && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Preliminary Severity:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    inspectingRecord.preliminarySeverity.level === 'critical'
                      ? 'bg-red-950/80 text-red-300 border border-red-500/50'
                      : inspectingRecord.preliminarySeverity.level === 'high'
                      ? 'bg-orange-950/80 text-orange-300 border border-orange-500/50'
                      : inspectingRecord.preliminarySeverity.level === 'moderate'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                      : inspectingRecord.preliminarySeverity.level === 'low'
                      ? 'bg-sky-950/80 text-sky-300 border border-sky-500/50'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {inspectingRecord.preliminarySeverity.level} ({inspectingRecord.preliminarySeverity.score}/100)
                  </span>
                </div>
              )}
            </div>

            {/* Bounding boxes list */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                Detected Objects ({inspectingRecord.boxes.length}):
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {inspectingRecord.boxes.map((box) => (
                  <div key={box.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-2">
                      <StatusBadge type="class" value={box.class} />
                      <span className="text-white font-bold">{box.id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>Conf: <strong className="text-slate-200">{(box.confidence * 100).toFixed(1)}%</strong></span>
                      <span>Area: {box.areaPixels ? `${box.areaPixels.toLocaleString()} px` : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
