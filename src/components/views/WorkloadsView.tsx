import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause,
  Cpu, 
  RotateCcw, 
  Leaf, 
  Server, 
  Database,
  Sparkles,
  Download,
  Trash2,
  ShieldCheck,
  X,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  BarChart2,
  Terminal,
  Activity
} from 'lucide-react';
import { WorkloadRunRecord, OrchestratorTaskState, StrategyType } from '../../types/orchestrator';
import { INITIAL_WORKLOAD_HISTORY } from '../../utils/workloadHistory';

interface WorkloadsViewProps {
  onOpenOrchestrator: () => void;
  workloadHistory?: WorkloadRunRecord[];
  onAddWorkloadToHistory?: (record: WorkloadRunRecord) => void;
  onClearHistory?: () => void;
  orchestratorTask?: OrchestratorTaskState;
}

export const WorkloadsView: React.FC<WorkloadsViewProps> = ({ 
  onOpenOrchestrator,
  workloadHistory = INITIAL_WORKLOAD_HISTORY,
  onClearHistory,
  orchestratorTask
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Running' | 'Pending' | 'Failed' | 'Completed'>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [selectedRunForDetails, setSelectedRunForDetails] = useState<WorkloadRunRecord | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // If orchestratorTask exists and has progressed, construct a dynamic active record
  const effectiveHistory = useMemo(() => {
    let list = [...workloadHistory];

    if (orchestratorTask && (orchestratorTask.simProgress > 0 || orchestratorTask.simStatus === 'RUNNING')) {
      const activeId = 'run-orch-active';
      const existingIdx = list.findIndex((r) => r.id === activeId || r.name.includes(orchestratorTask.workloadType));

      const isCompleted = orchestratorTask.simProgress >= 100;
      const isRunning = orchestratorTask.simStatus === 'RUNNING';

      const liveRecord: WorkloadRunRecord = {
        id: activeId,
        name: `${orchestratorTask.workloadType} (Recent Orchestration)`,
        workloadType: orchestratorTask.workloadType,
        strategy: orchestratorTask.selectedStrategy,
        status: isCompleted ? 'COMPLETED' : isRunning ? 'RUNNING' : 'WAITING',
        runtimeHours: orchestratorTask.runtimeHours,
        durationLabel: isCompleted
          ? `Completed in ${orchestratorTask.runtimeHours}h`
          : `${orchestratorTask.simCurrentHour.toFixed(1)}h / ${orchestratorTask.deadlineHours}h (${Math.round(orchestratorTask.simProgress)}%)`,
        computeLoadKw: 2100,
        gpuNodes: '8x A100 SXM4 (640GB VRAM)',
        nodeId: 'Node-01 (GPU Cluster Alpha)',
        carbonSavedGrams: orchestratorTask.selectedStrategy === 'FRAGMENT' ? 420 : 320,
        carbonSavedPercent: orchestratorTask.selectedStrategy === 'FRAGMENT' ? 31 : 24,
        carbonEmittedGrams: 680,
        costDollars: Math.round(orchestratorTask.runtimeHours * 75),
        budget: orchestratorTask.budget,
        timestamp: 'Just now (Active Task)',
        relativeTime: isCompleted ? 'Just finished' : 'Active Task',
        region: orchestratorTask.region || 'IN',
        checkpointsCreated: orchestratorTask.checkpointCapable && orchestratorTask.selectedStrategy === 'FRAGMENT' ? 1 : 0,
        segmentsSummary:
          orchestratorTask.selectedStrategy === 'FRAGMENT'
            ? 'Segment A (3h) → Checkpoint Dump → Peak Pause → Segment B (3h)'
            : 'Continuous scheduled compute stream',
        replanCount: orchestratorTask.replanCount,
        executionLogs: [
          `[Task Started] ${orchestratorTask.workloadType} initialized with Strategy ${orchestratorTask.selectedStrategy}`,
          `[Allocation] 8x A100 SXM4 nodes assigned on Node-01`,
          orchestratorTask.isGridSpiked
            ? `⚠️ [Grid Event] Carbon spike detected (360 gCO₂/kWh). Adaptive re-plan executed.`
            : `✓ [Grid Normal] Clean solar valley execution (140 gCO₂/kWh)`,
          orchestratorTask.simProgress >= 100
            ? `✓ [Finished] Workload converged. Saved 420g CO₂ (-31%)`
            : `[Execution] Progress: ${Math.round(orchestratorTask.simProgress)}% at hour ${orchestratorTask.simCurrentHour}h`
        ]
      };

      if (existingIdx >= 0) {
        list[existingIdx] = liveRecord;
      } else {
        list.unshift(liveRecord);
      }
    }

    return list;
  }, [workloadHistory, orchestratorTask]);

  // Aggregate KPI metrics
  const totalRuns = effectiveHistory.length;
  const completedRuns = effectiveHistory.filter((r) => r.status === 'COMPLETED').length;
  const activeRuns = effectiveHistory.filter((r) => r.status === 'RUNNING' || r.status === 'CHECKPOINT').length;
  const totalCarbonAvoidedKg = (effectiveHistory.reduce((acc, r) => acc + (r.carbonSavedGrams || 0), 0) / 1000).toFixed(2);
  const totalCheckpoints = effectiveHistory.reduce((acc, r) => acc + (r.checkpointsCreated || 0), 0);

  // Filtered list
  const filtered = useMemo(() => {
    return effectiveHistory.filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.workloadType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.nodeId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Running' && (w.status === 'RUNNING' || w.status === 'CHECKPOINT')) ||
        (statusFilter === 'Completed' && w.status === 'COMPLETED') ||
        (statusFilter === 'Failed' && w.status === 'FAILED') ||
        (statusFilter === 'Pending' && w.status === 'WAITING');

      const matchesStrategy =
        strategyFilter === 'ALL' || w.strategy === strategyFilter;

      return matchesSearch && matchesStatus && matchesStrategy;
    });
  }, [effectiveHistory, searchQuery, statusFilter, strategyFilter]);

  const handleExportHistory = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(effectiveHistory, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `workload_execution_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setNotificationMessage('Exported workload execution history audit log successfully!');
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  const handleRetryTask = (taskName: string) => {
    setNotificationMessage(`Workload "${taskName}" queued for adaptive re-run with checkpoint protection.`);
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Workload Execution History & Trace Logs</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#2E2E3A] tracking-tight">Workload History & Performance</h2>
          <p className="text-xs text-[#2E2E3A]/70 mt-0.5">
            Audit logs of recently executed tasks, checkpoint snapshots, energy consumption, and verified carbon reductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportHistory}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#E9E7F2] text-[#2E2E3A] hover:bg-[#F7F5EE] text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#1B5E5A]" />
            <span>Export Audit Log</span>
          </button>

          <button
            onClick={onOpenOrchestrator}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all shadow-sm cursor-pointer"
          >
            <span>Submit New Workload</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks Recorded */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E2E3A]/60">Total Tasks Recorded</span>
            <div className="w-8 h-8 rounded-xl bg-[#F7F5EE] flex items-center justify-center text-[#1B5E5A]">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2E2E3A] mt-2 tracking-tight">
            {totalRuns} Runs
          </div>
          <div className="text-[11px] text-[#1B5E5A] font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#7FB892]" />
            <span>{completedRuns} completed successfully</span>
          </div>
        </div>

        {/* Total Carbon Avoided */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E2E3A]/60">Carbon Emissions Avoided</span>
            <div className="w-8 h-8 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1B5E5A] mt-2 tracking-tight">
            {totalCarbonAvoidedKg} kg CO₂
          </div>
          <div className="text-[11px] text-[#2E2E3A]/60 mt-1">
            Avg. -31.4% reduction vs baseline
          </div>
        </div>

        {/* Active & Running Tasks */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E2E3A]/60">Active / In-Flight Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2E2E3A] mt-2 tracking-tight flex items-center gap-2">
            <span>{activeRuns} Active</span>
            {activeRuns > 0 && <span className="w-2.5 h-2.5 rounded-full bg-[#7FB892] animate-pulse"></span>}
          </div>
          <div className="text-[11px] text-[#2E2E3A]/60 mt-1">
            Synced with Live Orchestrator
          </div>
        </div>

        {/* State Checkpoints Created */}
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E2E3A]/60">Checkpoints Created</span>
            <div className="w-8 h-8 rounded-xl bg-[#F6B26B]/20 flex items-center justify-center text-[#B45309]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2E2E3A] mt-2 tracking-tight">
            {totalCheckpoints} Snapshots
          </div>
          <div className="text-[11px] text-[#2E2E3A]/60 mt-1">
            Zero compute state lost
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMessage && (
        <div className="bg-[#DFF3E7] border border-[#7FB892] text-[#1B5E5A] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#1B5E5A]" />
            <span>{notificationMessage}</span>
          </div>
          <button onClick={() => setNotificationMessage(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E9E7F2] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2E2E3A]/40" />
          <input
            type="text"
            placeholder="Search recent workloads by name, task ID, or cluster node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F5EE] rounded-xl text-xs font-medium text-[#2E2E3A] border border-[#E9E7F2] focus:outline-none focus:ring-2 focus:ring-[#7FB892]/40"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2]">
            {(['ALL', 'Running', 'Pending', 'Failed', 'Completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === filter ? 'bg-white text-[#1B5E5A] shadow-xs' : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Strategy Dropdown / Buttons */}
          <div className="flex items-center gap-1 bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2]">
            {['ALL', 'FRAGMENT', 'DELAY', 'RUN'].map((strat) => (
              <button
                key={strat}
                onClick={() => setStrategyFilter(strat)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  strategyFilter === strat ? 'bg-white text-[#1B5E5A] shadow-xs' : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                {strat === 'ALL' ? 'All Strategies' : strat}
              </button>
            ))}
          </div>

          {onClearHistory && (
            <button
              onClick={onClearHistory}
              title="Reset history to demo defaults"
              className="p-2 rounded-xl border border-[#E9E7F2] text-[#2E2E3A]/50 hover:text-[#C53030] hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Workload History Table */}
      <div className="bg-white rounded-2xl border border-[#E9E7F2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E9E7F2] bg-[#F7F5EE]/60 text-[11px] font-bold text-[#2E2E3A]/60 uppercase tracking-wider">
                <th className="py-3.5 px-6">Workload & Task ID</th>
                <th className="py-3.5 px-5">Executed At</th>
                <th className="py-3.5 px-5">Strategy</th>
                <th className="py-3.5 px-5">Execution Status</th>
                <th className="py-3.5 px-5">Cluster Node & Power</th>
                <th className="py-3.5 px-5">Carbon Avoided</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E7F2] text-xs">
              {filtered.map((w) => {
                const isRunning = w.status === 'RUNNING';
                const isCompleted = w.status === 'COMPLETED';
                const isFailed = w.status === 'FAILED';
                const isCheckpoint = w.status === 'CHECKPOINT';

                return (
                  <tr key={w.id} className="hover:bg-[#F7F5EE]/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#2E2E3A] flex items-center gap-2">
                        <span>{w.name}</span>
                        {w.id.includes('active') && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#1B5E5A] text-white">
                            Current Task
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#2E2E3A]/50 font-mono mt-0.5">
                        {w.id} · {w.workloadType} ({w.runtimeHours}h)
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-semibold text-[#2E2E3A] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#2E2E3A]/50" />
                        <span>{w.relativeTime}</span>
                      </div>
                      <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5">{w.timestamp}</div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.strategy === 'FRAGMENT'
                            ? 'bg-[#DFF3E7] text-[#1B5E5A]'
                            : w.strategy === 'DELAY'
                            ? 'bg-[#F6B26B]/20 text-[#B45309]'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {w.strategy}
                      </span>
                      {w.checkpointsCreated > 0 && (
                        <div className="text-[10px] text-[#1B5E5A] font-semibold mt-1">
                          {w.checkpointsCreated} {w.checkpointsCreated === 1 ? 'checkpoint' : 'checkpoints'}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isRunning
                              ? 'bg-[#7FB892] animate-pulse'
                              : isCompleted
                              ? 'bg-[#1B5E5A]'
                              : isFailed
                              ? 'bg-[#F28C7B]'
                              : 'bg-[#F6B26B]'
                          }`}
                        ></span>
                        <span
                          className={`font-bold ${
                            isRunning
                              ? 'text-[#1B5E5A]'
                              : isCompleted
                              ? 'text-[#2E2E3A]'
                              : isFailed
                              ? 'text-[#C53030]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5 max-w-[170px] truncate">
                        {w.durationLabel}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-semibold text-[#2E2E3A]">{w.nodeId}</div>
                      <div className="text-[11px] text-[#2E2E3A]/60">
                        {w.gpuNodes} · {w.computeLoadKw > 0 ? `${w.computeLoadKw} kW` : 'Suspended'}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-[#1B5E5A] flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5 text-[#7FB892]" />
                        <span>{w.carbonSavedGrams > 0 ? `-${w.carbonSavedGrams}g CO₂` : '0g (Baseline)'}</span>
                      </div>
                      <div className="text-[10px] text-[#2E2E3A]/50">
                        {w.carbonSavedPercent > 0 ? `-${w.carbonSavedPercent}% emissions` : 'Standard dispatch'}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {w.canRetry || isFailed ? (
                          <button
                            onClick={() => handleRetryTask(w.name)}
                            className="px-3 py-1 bg-[#F28C7B]/20 text-[#C53030] text-xs font-bold rounded-lg hover:bg-[#F28C7B]/30 cursor-pointer transition-colors"
                          >
                            Retry
                          </button>
                        ) : null}

                        <button
                          onClick={() => setSelectedRunForDetails(w)}
                          className="px-3 py-1 bg-[#F7F5EE] border border-[#E9E7F2] text-[#2E2E3A] text-xs font-bold rounded-lg hover:bg-[#DFF3E7] hover:text-[#1B5E5A] hover:border-[#7FB892] transition-colors cursor-pointer"
                        >
                          Details
                        </button>

                        <button
                          onClick={onOpenOrchestrator}
                          className="px-3 py-1 bg-[#1B5E5A] text-white text-xs font-bold rounded-lg hover:bg-[#144744] transition-colors cursor-pointer"
                        >
                          Orchestrator →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-xs text-[#2E2E3A]/60 space-y-2">
            <Search className="w-8 h-8 text-[#2E2E3A]/30 mx-auto" />
            <div className="font-bold text-sm text-[#2E2E3A]">No matching workloads found</div>
            <div>Try adjusting your search query or filter criteria.</div>
          </div>
        )}
      </div>

      {/* DETAILED WORKLOAD RUN DRAWER / MODAL */}
      {selectedRunForDetails && (
        <div className="fixed inset-0 z-50 bg-[#2E2E3A]/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E9E7F2]">
            <div className="p-6 space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-[#E9E7F2] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#1B5E5A] text-white">
                      Task Audit Run
                    </span>
                    <span className="text-xs font-mono text-[#2E2E3A]/50">ID: {selectedRunForDetails.id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#2E2E3A] mt-1">{selectedRunForDetails.name}</h3>
                  <div className="text-xs text-[#2E2E3A]/60 mt-0.5">
                    Executed at {selectedRunForDetails.timestamp} · Region: {selectedRunForDetails.region}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRunForDetails(null)}
                  className="p-1.5 rounded-xl hover:bg-[#F7F5EE] text-[#2E2E3A]/60 hover:text-[#2E2E3A] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Strategy Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                  <span className="text-[10px] font-bold text-[#2E2E3A]/50 uppercase">Strategy</span>
                  <div className="text-sm font-extrabold text-[#1B5E5A] mt-0.5">{selectedRunForDetails.strategy}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                  <span className="text-[10px] font-bold text-[#2E2E3A]/50 uppercase">Status</span>
                  <div className="text-sm font-extrabold text-[#2E2E3A] mt-0.5">{selectedRunForDetails.status}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                  <span className="text-[10px] font-bold text-[#2E2E3A]/50 uppercase">Carbon Avoided</span>
                  <div className="text-sm font-extrabold text-[#1B5E5A] mt-0.5">
                    {selectedRunForDetails.carbonSavedGrams}g (-{selectedRunForDetails.carbonSavedPercent}%)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                  <span className="text-[10px] font-bold text-[#2E2E3A]/50 uppercase">Cost / Budget</span>
                  <div className="text-sm font-extrabold text-[#2E2E3A] mt-0.5">
                    ${selectedRunForDetails.costDollars} / ${selectedRunForDetails.budget}
                  </div>
                </div>
              </div>

              {/* Segments Strategy Overview */}
              <div className="p-4 rounded-xl bg-[#DFF3E7]/40 border border-[#7FB892]/40 text-xs text-[#2E2E3A] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#1B5E5A]">
                  <Sparkles className="w-4 h-4 text-[#7FB892]" />
                  <span>Execution Plan Summary</span>
                </div>
                <p className="leading-relaxed">{selectedRunForDetails.segmentsSummary}</p>
                <div className="text-[11px] text-[#1B5E5A] font-semibold pt-1">
                  Node Allocation: {selectedRunForDetails.nodeId} ({selectedRunForDetails.gpuNodes})
                </div>
              </div>

              {/* Execution Logs Trace */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2E2E3A]">
                  <Terminal className="w-4 h-4 text-[#1B5E5A]" />
                  <span>Execution Event Trace</span>
                </div>

                <div className="bg-[#2E2E3A] text-[#DFF3E7] p-4 rounded-xl font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
                  {selectedRunForDetails.executionLogs && selectedRunForDetails.executionLogs.length > 0 ? (
                    selectedRunForDetails.executionLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        {log}
                      </div>
                    ))
                  ) : (
                    <div>No detailed log traces available for this run.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-[#E9E7F2] bg-[#F7F5EE] flex justify-between items-center">
              <button
                onClick={() => setSelectedRunForDetails(null)}
                className="px-4 py-2 border border-[#E9E7F2] bg-white rounded-xl text-xs font-bold text-[#2E2E3A]/70 hover:bg-[#F7F5EE] cursor-pointer"
              >
                Close Drawer
              </button>

              <button
                onClick={() => {
                  setSelectedRunForDetails(null);
                  onOpenOrchestrator();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all shadow-sm cursor-pointer"
              >
                <span>Re-run in Orchestrator</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
