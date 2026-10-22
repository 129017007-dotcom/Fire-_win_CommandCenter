import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Incident, IncidentSeverity, IncidentStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Flame, 
  CloudRain, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  Camera,
  MapPin,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertOctagon,
  Grid,
  List
} from 'lucide-react';

export const IncidentManagementView: React.FC = () => {
  const { incidents, updateIncidentStatus, selectedIncident, setSelectedIncident, setCurrentView } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fire' | 'smoke' | 'combined'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q) ||
        inc.cameraFeedId.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Type
    if (typeFilter !== 'all' && inc.type !== typeFilter) return false;

    // Severity
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;

    // Status
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;

    return true;
  });

  const handleOpenIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    setIsModalOpen(true);
  };

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (selectedIncident) {
      updateIncidentStatus(selectedIncident.id, newStatus);
    }
  };

  const handleExportIncidentDossier = (inc: Incident) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inc, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FireTwin_${inc.id}_Dossier.json`);
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
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300">
              INCIDENT COMMAND REGISTER
            </span>
            <span className="text-xs font-mono text-slate-400">
              Triage, Optical Evidence & Containment Tracking
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            Incident Management & Triage
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-sans">
            Comprehensive audit log of detected thermal and optical fire/smoke triggers. Review high-resolution visual evidence, dispatch advisory containment actions, and update incident operational status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#0a0f18] p-1 rounded-xl border border-panel-border">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-panel-dark text-orange-400 font-bold border border-panel-border' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" /> Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                viewMode === 'cards' ? 'bg-panel-dark text-orange-400 font-bold border border-panel-border' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" /> Card Grid
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-panel-card border border-panel-border space-y-3 shadow-command-card">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Sector, Camera, or Keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#090e18] border border-panel-border rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Type:</span>
            {(['all', 'fire', 'smoke', 'combined'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase transition-all shrink-0 ${
                  typeFilter === t
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold'
                    : 'bg-[#090e18] text-slate-400 border border-panel-border hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Second row filters: Severity and Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-[#090e18] border border-panel-border rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#090e18] border border-panel-border rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="investigating">Investigating</option>
                <option value="contained">Contained</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="text-slate-400">
            Showing <strong className="text-white">{filteredIncidents.length}</strong> of {incidents.length} incidents
          </div>
        </div>
      </div>

      {/* View: Table Mode */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl bg-panel-card border border-panel-border overflow-hidden shadow-command-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0f18] text-slate-400 uppercase text-[10px] tracking-wider border-b border-panel-border">
                <tr>
                  <th className="px-4 py-3">Incident ID</th>
                  <th className="px-4 py-3">Detected Time (UTC)</th>
                  <th className="px-4 py-3">Location / Sector</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Peak Temp / Spread</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border text-slate-300">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      No incidents matching active filters.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((inc) => (
                    <tr
                      key={inc.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => handleOpenIncident(inc)}
                    >
                      <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                        {inc.id}
                        {inc.isDemo && <StatusBadge type="demo" value="DEMO" size="sm" />}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{inc.timestamp}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-white font-medium">{inc.location}</div>
                        <div className="text-[10px] text-slate-400">{inc.zone} • {inc.cameraFeedId}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge type="class" value={inc.type} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-orange-400 font-semibold">{inc.temperaturePeak ? `${inc.temperaturePeak}°C` : 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({inc.spreadRateEstimate || '0 m/min'})</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-200">
                        {(inc.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge type="severity" value={inc.severity} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge type="status" value={inc.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenIncident(inc);
                          }}
                          className="px-2.5 py-1 rounded bg-panel-dark hover:bg-orange-500/20 hover:text-orange-400 border border-panel-border text-[11px] text-slate-300 transition-colors"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View: Card Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => handleOpenIncident(inc)}
              className="group rounded-2xl bg-panel-card border border-panel-border hover:border-orange-500/50 overflow-hidden cursor-pointer transition-all shadow-command-card flex flex-col justify-between"
            >
              <div>
                {/* Card Image Preview with HUD overlay */}
                <div className="relative h-44 w-full bg-black overflow-hidden">
                  <img
                    src={inc.evidenceImageUrl}
                    alt={inc.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-transparent to-black/60" />

                  {/* Top badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-700 text-white">
                        {inc.id}
                      </span>
                      {inc.isDemo && <StatusBadge type="demo" value="DEMO" size="sm" />}
                    </div>
                    <StatusBadge type="severity" value={inc.severity} />
                  </div>

                  {/* Bottom Image HUD */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex justify-between items-end text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-slate-300 border border-slate-800">
                      {inc.cameraFeedId}
                    </span>
                    <span className="text-orange-400 font-bold bg-black/60 px-2 py-0.5 rounded border border-orange-500/30">
                      {(inc.confidence * 100).toFixed(1)}% CONF
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {inc.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 font-sans">
                    {inc.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">{inc.location}</span>
                    <StatusBadge type="status" value={inc.status} />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#0a0f18] border-t border-panel-border flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 text-[10px]">{inc.timestamp}</span>
                <span className="text-orange-400 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incident Detail Dossier Modal */}
      {selectedIncident && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`INCIDENT DOSSIER: ${selectedIncident.id}`}
          subtitle={`${selectedIncident.location} • ${selectedIncident.timestamp}`}
          icon={AlertTriangle}
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs font-mono">
            {/* Top Alert bar & Status Changer */}
            <div className="p-4 rounded-xl bg-panel-dark border border-panel-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge type="severity" value={selectedIncident.severity} size="md" />
                <StatusBadge type="class" value={selectedIncident.type} size="md" />
                <StatusBadge type="status" value={selectedIncident.status} size="md" />
                {selectedIncident.isDemo && <StatusBadge type="demo" value="DEMO INCIDENT RECORD" size="md" />}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Set Status:</span>
                {(['active', 'investigating', 'contained', 'resolved'] as IncidentStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2 py-1 rounded text-[10px] uppercase transition-all ${
                      selectedIncident.status === st
                        ? 'bg-orange-500 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Screen: Evidence Image (Left) + Telemetry & Response Log (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Evidence Snapshot */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Optical Evidence Capture ({selectedIncident.cameraFeedId})
                </div>
                <div className="relative rounded-xl overflow-hidden border border-panel-border bg-black aspect-video">
                  <img
                    src={selectedIncident.evidenceImageUrl}
                    alt={selectedIncident.title}
                    className="w-full h-full object-cover filter contrast-125"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm p-2 rounded text-[11px] text-slate-300 flex justify-between">
                    <span>Est Peak Temp: <strong className="text-orange-400">{selectedIncident.temperaturePeak || 300}°C</strong></span>
                    <span>Spread Rate: <strong className="text-cyan-400">{selectedIncident.spreadRateEstimate || '1.2 m/min'}</strong></span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedIncident.description}
                </div>
              </div>

              {/* Incident Details & Actions Log */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-orange-400" />
                  Containment Action Log & Telemetry
                </div>

                <div className="p-3.5 rounded-xl bg-panel-dark border border-panel-border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zone / Sector:</span>
                    <span className="text-white font-bold">{selectedIncident.zone} / {selectedIncident.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sensor Confidence:</span>
                    <span className="text-orange-400 font-bold">{(selectedIncident.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Detection Channel:</span>
                    <span className="text-cyan-400">{selectedIncident.cameraFeedId}</span>
                  </div>
                </div>

                {/* Actions History Checklist */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                    Executed SOP Responses:
                  </div>
                  <div className="space-y-1.5">
                    {selectedIncident.actionsTaken.map((act, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-slate-300">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-panel-border flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleExportIncidentDossier(selectedIncident)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-panel-dark border border-panel-border hover:border-slate-600 text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-orange-400" />
                <span>Export JSON Dossier</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentView('fire-spread');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-glow-fire hover:opacity-95 transition-all"
                >
                  <Flame className="w-4 h-4" />
                  <span>Launch Spread Modeling</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
