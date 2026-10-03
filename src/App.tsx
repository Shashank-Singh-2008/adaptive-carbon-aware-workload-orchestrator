import React, { useState, useEffect } from 'react';
import { Header, Sidebar, NavItem } from './components/layout';
import { 
  DashboardView, 
  OrchestratorView, 
  WorkloadsView, 
  MonitoringView, 
  ResourcesView, 
  AlertsView, 
  AnalyticsView, 
  SettingsView, 
  LoginView 
} from './components/views';
import { UserProfile, DEMO_USERS, OrchestratorTaskState, WorkloadRunRecord } from './types';
import { getStoredWorkloadHistory, saveWorkloadHistory, INITIAL_WORKLOAD_HISTORY } from './utils';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'app' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/login' || window.location.hash === '#login'
        ? 'login'
        : 'app';
    }
    return 'app';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orchestrator_auth_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEMO_USERS[0];
  });

  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');
  const [isSpiked, setIsSpiked] = useState<boolean>(false);
  const [replanCount, setReplanCount] = useState<number>(0);
  const [dataSourceMode, setDataSourceMode] = useState<'SYNTHETIC' | 'LIVE'>('SYNTHETIC');
  const [targetRegion, setTargetRegion] = useState<string>('IN');

  const [orchestratorTask, setOrchestratorTask] = useState<OrchestratorTaskState>({
    workloadType: 'ML Training',
    runtimeHours: 6,
    deadlineHours: 8,
    budget: 600,
    carbonPriority: 'HIGH',
    checkpointCapable: true,
    fragmentedStrategyEnabled: true,
    selectedStrategy: 'FRAGMENT',
    simStatus: 'IDLE',
    simProgress: 0,
    simCurrentHour: 0,
    simSpeed: 1,
    replanCount: 0,
    isGridSpiked: false,
    prompt: 'Run my 6-hour ML training job before 8 AM, under $600, with carbon reduction preferred.',
    region: 'IN',
  });

  const [workloadHistory, setWorkloadHistory] = useState<WorkloadRunRecord[]>(() => {
    return getStoredWorkloadHistory();
  });

  const handleAddWorkloadRecord = (record: WorkloadRunRecord) => {
    setWorkloadHistory((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      let updated: WorkloadRunRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = record;
      } else {
        updated = [record, ...prev];
      }
      saveWorkloadHistory(updated);
      return updated;
    });
  };

  const handleClearWorkloadHistory = () => {
    saveWorkloadHistory(INITIAL_WORKLOAD_HISTORY);
    setWorkloadHistory(INITIAL_WORKLOAD_HISTORY);
  };

  const handleUpdateOrchestratorTask = (updater: Partial<OrchestratorTaskState>) => {
    setOrchestratorTask((prev) => ({
      ...prev,
      ...updater,
    }));
  };


  // Handle browser back and forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/login' || window.location.hash === '#login') {
        setCurrentPage('login');
      } else {
        setCurrentPage('app');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenLogin = () => {
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('app');
    window.history.pushState({}, '', '/');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentPage('app');
    window.history.pushState({}, '', '/');
  };

  const handleLogout = () => {
    localStorage.removeItem('orchestrator_auth_user');
    setCurrentUser(null);
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
  };

  const handleToggleSpike = () => {
    const nextState = !isSpiked;
    setIsSpiked(nextState);
    if (nextState) {
      setReplanCount((prev) => prev + 1);
    }
    setOrchestratorTask((prev) => ({
      ...prev,
      isGridSpiked: nextState,
      replanCount: nextState ? prev.replanCount + 1 : prev.replanCount,
    }));
  };

  const handleToggleDataSource = () => {
    setDataSourceMode((prev) => (prev === 'SYNTHETIC' ? 'LIVE' : 'SYNTHETIC'));
  };

  const handleRouteWorkload = (regionCode: string) => {
    setTargetRegion(regionCode);
    setOrchestratorTask((prev) => ({ ...prev, region: regionCode }));
    setActiveTab('orchestrator');
  };

  // If user navigates to login webpage, render the standalone login panel webpage
  if (currentPage === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7F5EE] text-[#2E2E3A] font-sans antialiased selection:bg-[#DFF3E7] selection:text-[#1B5E5A]">
      {/* Sidebar matching Pic 1 Forest Green #1B5E5A */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        replanCount={replanCount}
        onOpenLogin={handleOpenLogin}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Header matching Pic 1 */}
        <Header
          dataSourceMode={dataSourceMode}
          onToggleDataSource={handleToggleDataSource}
          onSimulateGridChange={handleToggleSpike}
          isSpiked={isSpiked}
          replanCount={replanCount}
          onOpenOrchestrator={() => setActiveTab('orchestrator')}
          currentUser={currentUser}
          onOpenLogin={handleOpenLogin}
          onLogout={handleLogout}
        />

        {/* View Switcher */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenOrchestrator={() => setActiveTab('orchestrator')}
              onSimulateGridChange={handleToggleSpike}
              isSpiked={isSpiked}
              replanCount={replanCount}
              dataSourceMode={dataSourceMode}
              onRouteWorkload={handleRouteWorkload}
              orchestratorTask={orchestratorTask}
              workloadHistory={workloadHistory}
            />
          )}

          {activeTab === 'orchestrator' && (
            <OrchestratorView
              initialSpiked={isSpiked}
              targetRegion={targetRegion}
              orchestratorTask={orchestratorTask}
              onUpdateOrchestratorTask={handleUpdateOrchestratorTask}
              onAddWorkloadToHistory={handleAddWorkloadRecord}
              onNavigateToWorkloads={() => setActiveTab('workloads')}
              onGridSpikeChanged={(spiked) => {
                setIsSpiked(spiked);
                if (spiked) setReplanCount((c) => c + 1);
                setOrchestratorTask((prev) => ({
                  ...prev,
                  isGridSpiked: spiked,
                  replanCount: spiked ? prev.replanCount + 1 : prev.replanCount,
                }));
              }}
            />
          )}


          {activeTab === 'workloads' && (
            <WorkloadsView
              onOpenOrchestrator={() => setActiveTab('orchestrator')}
              workloadHistory={workloadHistory}
              onAddWorkloadToHistory={handleAddWorkloadRecord}
              onClearHistory={handleClearWorkloadHistory}
              orchestratorTask={orchestratorTask}
            />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringView
              isSpiked={isSpiked}
              onToggleSpike={handleToggleSpike}
              dataSourceMode={dataSourceMode}
              onToggleDataSource={handleToggleDataSource}
            />
          )}

          {activeTab === 'resources' && <ResourcesView />}

          {activeTab === 'alerts' && (
            <AlertsView
              isSpiked={isSpiked}
              replanCount={replanCount}
              onOpenOrchestrator={() => setActiveTab('orchestrator')}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'settings' && (
            <SettingsView
              dataSourceMode={dataSourceMode}
              onToggleDataSource={handleToggleDataSource}
            />
          )}
        </main>
      </div>
    </div>
  );
}
