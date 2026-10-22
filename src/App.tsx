import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { CommandCenterView } from './components/dashboard/CommandCenterView';
import { AIDetectionLabView } from './components/detection/AIDetectionLabView';
import { IncidentManagementView } from './components/incidents/IncidentManagementView';
import { FireSpreadAnalysisView } from './components/spread/FireSpreadAnalysisView';
import { ContainmentRecommendationsView } from './components/containment/ContainmentRecommendationsView';
import { DetectionHistoryView } from './components/history/DetectionHistoryView';
import { SystemSettingsView } from './components/settings/SystemSettingsView';

const DashboardContent: React.FC = () => {
  const { currentView, settings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (currentView) {
      case 'command-center':
        return <CommandCenterView />;
      case 'ai-detection-lab':
        return <AIDetectionLabView />;
      case 'incidents':
        return <IncidentManagementView />;
      case 'fire-spread':
        return <FireSpreadAnalysisView />;
      case 'containment':
        return <ContainmentRecommendationsView />;
      case 'detection-history':
        return <DetectionHistoryView />;
      case 'settings':
        return <SystemSettingsView />;
      default:
        return <CommandCenterView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col font-sans relative selection:bg-orange-500 selection:text-white">
      {/* Background Tactical Grid Pattern */}
      <div className="fixed inset-0 bg-tactical-grid pointer-events-none opacity-40 z-0" />

      {/* Optional CRT Scanlines Effect */}
      {settings.scanlineEffect && (
        <div className="fixed inset-0 scanline-overlay z-50 pointer-events-none" />
      )}

      {/* Top Command Center Header */}
      <Header
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Body with Sidebar and Main Viewport */}
      <div className="flex-1 flex relative z-10">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
};

export default App;
