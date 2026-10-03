import React from 'react';
import { 
  Leaf, 
  ChevronRight,
  Layers,
  TrendingUp,
  CheckCircle2,
  PlayCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  CarbonEfficiencyWidget,
  CarbonIntensityForecast,
  RegionalCarbonMap,
  WorkloadActivityGraph
} from '../widgets';
import { OrchestratorTaskState, WorkloadRunRecord } from '../../types/orchestrator';

interface DashboardViewProps {
  onOpenOrchestrator: () => void;
  onSimulateGridChange: () => void;
  isSpiked: boolean;
  replanCount: number;
  dataSourceMode?: 'SYNTHETIC' | 'LIVE';
  onRouteWorkload?: (regionCode: string) => void;
  orchestratorTask?: OrchestratorTaskState;
  workloadHistory?: WorkloadRunRecord[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenOrchestrator,
  onSimulateGridChange,
  isSpiked,
  replanCount,
  dataSourceMode = 'SYNTHETIC',
  onRouteWorkload,
  orchestratorTask,
  workloadHistory
}) => {
  // Derive dynamic metrics from workload history & active orchestrator state
  const totalWorkloads = 120 + (workloadHistory?.length || 5);
  const runningWorkloads = (workloadHistory?.filter((w) => w.status === 'RUNNING' || w.status === 'CHECKPOINT').length || 1) + (orchestratorTask?.simStatus === 'RUNNING' ? 1 : 0);
  const failedWorkloads = (workloadHistory?.filter((w) => w.status === 'FAILED').length || 1);
  const successRate = Math.round(((totalWorkloads - failedWorkloads) / totalWorkloads) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Greeting & Banner Row matching Pic 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#2E2E3A] tracking-tight">Good morning, Shristi</h2>
          <p className="text-sm text-[#2E2E3A]/70 mt-0.5">Here's what's happening with your workloads today.</p>
        </div>

        {/* Right Green Leaf Eco Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#DFF3E7] to-[#e8f7ee] border border-[#7FB892]/30 px-4 py-2.5 rounded-2xl shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-[#1B5E5A] flex items-center justify-center text-white shrink-0 shadow-xs">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1B5E5A] leading-tight">Cleaner execution</div>
            <div className="text-[11px] text-[#2E2E3A]/70">for a greener tomorrow</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row matching Pic 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Workloads */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs hover:border-[#7FB892]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#1B5E5A] bg-[#DFF3E7] px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> ↑ 12% <span className="text-[9px] text-[#2E2E3A]/60 font-normal">vs. 24h</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-[#2E2E3A]/60">Total Workloads</div>
            <div className="text-3xl font-extrabold text-[#2E2E3A] tracking-tight tabular-nums mt-0.5">{totalWorkloads}</div>
          </div>
        </div>

        {/* Card 2: Success Rate */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs hover:border-[#7FB892]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#1B5E5A] bg-[#DFF3E7] px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> ↑ 3% <span className="text-[9px] text-[#2E2E3A]/60 font-normal">vs. 24h</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-[#2E2E3A]/60">Success Rate</div>
            <div className="text-3xl font-extrabold text-[#2E2E3A] tracking-tight tabular-nums mt-0.5">{successRate}%</div>
          </div>
        </div>

        {/* Card 3: Running */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs hover:border-[#7FB892]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <PlayCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#1B5E5A] bg-[#DFF3E7] px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> ↑ 2% <span className="text-[9px] text-[#2E2E3A]/60 font-normal">vs. 24h</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-[#2E2E3A]/60">Running</div>
            <div className="text-3xl font-extrabold text-[#2E2E3A] tracking-tight tabular-nums mt-0.5">{runningWorkloads}</div>
          </div>
        </div>

        {/* Card 4: Failed */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs hover:border-[#F28C7B]/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#F28C7B]/20 flex items-center justify-center text-[#F28C7B]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-[#C53030] bg-[#F28C7B]/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              ↓ 1% <span className="text-[9px] text-[#2E2E3A]/60 font-normal">vs. 24h</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-[#2E2E3A]/60">Failed</div>
            <div className="text-3xl font-extrabold text-[#2E2E3A] tracking-tight tabular-nums mt-0.5">{failedWorkloads}</div>
          </div>
        </div>
      </div>

      {/* Carbon Efficiency Widget: Calculates & displays total CO2 saved by DELAY / FRAGMENT vs RUN */}
      <CarbonEfficiencyWidget
        isSpiked={isSpiked}
        dataSourceMode={dataSourceMode}
        onOpenOrchestrator={onOpenOrchestrator}
        onSimulateGridChange={onSimulateGridChange}
      />

      {/* Carbon Intensity Forecast: Live Recharts 24-hour line chart from mock API service */}
      <CarbonIntensityForecast
        isSpiked={isSpiked}
        onOpenOrchestrator={onOpenOrchestrator}
      />

      {/* Regional Carbon Map: Visual multi-region carbon ranking using Recharts to guide workload routing */}
      <RegionalCarbonMap
        isSpiked={isSpiked}
        onRouteWorkload={onRouteWorkload}
        onOpenOrchestrator={onOpenOrchestrator}
      />

      {/* Workload Activity Graph & Executed Processes Pipeline - Synced with Orchestrator */}
      <WorkloadActivityGraph
        orchestratorTask={
          orchestratorTask || {
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
            replanCount,
            isGridSpiked: isSpiked,
            prompt: 'Run my 6-hour ML training job before 8 AM, under $600, with carbon reduction preferred.',
            region: 'IN',
          }
        }
        onOpenOrchestrator={onOpenOrchestrator}
        onSimulateGridChange={onSimulateGridChange}
        isSpiked={isSpiked}
        replanCount={replanCount}
        workloadHistory={workloadHistory}
      />

      {/* Notification Strip */}
      <div 
        onClick={onOpenOrchestrator}
        className="bg-white rounded-2xl p-4 border border-[#E9E7F2] shadow-xs flex items-center justify-between hover:border-[#7FB892] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#2E2E3A]">Active Orchestrator Session</div>
            <div className="text-[11px] text-[#2E2E3A]/60">
              {orchestratorTask?.workloadType || 'ML Training'} ({orchestratorTask?.selectedStrategy || 'FRAGMENT'}) · {replanCount > 0 ? `${replanCount} adaptive replans applied` : 'Baseline schedule'} · Click to manage in Orchestrator
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#1B5E5A]">
          <span>View Orchestration</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Footer Tagline matching Pic 1 */}
      <div className="text-center pt-4 text-xs font-medium text-[#2E2E3A]/50">
        Efficient workloads. A cleaner planet. · Work smarter. Breathe cleaner.
      </div>

    </div>
  );
};
