import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Leaf, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  Server,
  Layers,
  ChevronRight,
  Database,
  Info
} from 'lucide-react';
import { 
  OrchestratorTaskState, 
  ExecutedProcessRecord, 
  StrategyType, 
  SimulationStatus, 
  ExecutionSegment,
  WorkloadRunRecord 
} from '../../types/orchestrator';
import { 
  DEFAULT_GRID_FORECAST, 
  SPIKED_GRID_FORECAST, 
  evaluateStrategies 
} from '../../utils/decisionEngine';

interface WorkloadActivityGraphProps {
  orchestratorTask: OrchestratorTaskState;
  onOpenOrchestrator: () => void;
  onSimulateGridChange: () => void;
  isSpiked: boolean;
  replanCount: number;
  workloadHistory?: WorkloadRunRecord[];
}

interface ActivityPoint {
  time: string;
  hour: number;
  computeKw: number;
  orchestratorKw: number;
  backgroundKw: number;
  utilizationPct: number;
  carbonIntensity: number;
  stageLabel: string;
  stageType: 'RUN' | 'CHECKPOINT' | 'WAIT' | 'RESUME' | 'IDLE';
  isCleanValley: boolean;
  isDirtyPeak: boolean;
}

// Custom tooltip for Workload Activity Chart
const CustomActivityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: ActivityPoint = payload[0].payload;

    return (
      <div className="bg-[#2E2E3A] text-white p-3.5 rounded-xl shadow-xl border border-white/10 text-xs space-y-2 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-white/15 pb-1.5 font-mono">
          <span className="font-bold text-[#DFF3E7]">{data.time}</span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
              data.stageType === 'RUN'
                ? 'bg-[#1B5E5A] text-[#DFF3E7]'
                : data.stageType === 'CHECKPOINT' || data.stageType === 'RESUME'
                ? 'bg-[#F6B26B] text-[#2E2E3A]'
                : data.stageType === 'WAIT'
                ? 'bg-gray-600 text-white'
                : 'bg-white/20 text-[#DFF3E7]'
            }`}
          >
            {data.stageType === 'WAIT' ? 'PAUSED (PEAK AVOIDED)' : data.stageType}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Total Compute Load:</span>
            <span className="font-bold text-base text-white tabular-nums">
              {data.computeKw.toLocaleString()} <span className="text-[10px] font-normal text-white/60">kW</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/70">Cluster Utilization:</span>
            <span className="font-semibold text-[#7FB892] tabular-nums">
              {data.utilizationPct}%
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/70">Grid Carbon:</span>
            <span
              className={`font-bold tabular-nums ${
                data.isDirtyPeak
                  ? 'text-[#F28C7B]'
                  : data.isCleanValley
                  ? 'text-[#7FB892]'
                  : 'text-white'
              }`}
            >
              {data.carbonIntensity} gCO₂/kWh
            </span>
          </div>

          <div className="text-[10px] text-white/80 pt-1 border-t border-white/10 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#7FB892] shrink-0" />
            <span className="truncate">{data.stageLabel}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const WorkloadActivityGraph: React.FC<WorkloadActivityGraphProps> = ({
  orchestratorTask,
  onOpenOrchestrator,
  onSimulateGridChange,
  isSpiked,
  replanCount,
  workloadHistory
}) => {
  const [viewMode, setViewMode] = useState<'COMBINED' | 'ORCHESTRATED_ONLY'>('COMBINED');
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<'ALL' | 'RUNNING' | 'COMPLETED' | 'CHECKPOINT'>('ALL');
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Compute active strategy plan from decision engine
  const currentForecast = isSpiked ? SPIKED_GRID_FORECAST : DEFAULT_GRID_FORECAST;
  const strategies = useMemo(() => {
    return evaluateStrategies(
      {
        workloadType: orchestratorTask.workloadType as any,
        runtimeHours: orchestratorTask.runtimeHours,
        deadlineHours: orchestratorTask.deadlineHours,
        budget: orchestratorTask.budget,
        carbonPriority: orchestratorTask.carbonPriority,
        checkpointCapable: orchestratorTask.checkpointCapable && orchestratorTask.fragmentedStrategyEnabled,
        region: orchestratorTask.region,
      },
      currentForecast
    );
  }, [
    orchestratorTask.workloadType,
    orchestratorTask.runtimeHours,
    orchestratorTask.deadlineHours,
    orchestratorTask.budget,
    orchestratorTask.carbonPriority,
    orchestratorTask.checkpointCapable,
    orchestratorTask.fragmentedStrategyEnabled,
    orchestratorTask.region,
    isSpiked
  ]);

  const activeStrategyPlan = strategies[orchestratorTask.selectedStrategy] || strategies.FRAGMENT;

  // Build the 24-hour timeline data according to Orchestrator task execution
  const chartData: ActivityPoint[] = useMemo(() => {
    const points: ActivityPoint[] = [];

    const hours = [
      '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
      '21:00', '22:00', '23:00'
    ];

    hours.forEach((timeStr) => {
      const h = parseInt(timeStr.split(':')[0], 10);

      // Baseline background cluster compute
      let bgKw = 400 + Math.sin(h / 3) * 120;
      let orchKw = 0;
      let stageLabel = 'Background Cluster ETL';
      let stageType: 'RUN' | 'CHECKPOINT' | 'WAIT' | 'RESUME' | 'IDLE' = 'IDLE';

      // Find matching grid forecast item
      const forecastItem = currentForecast.find((f) => f.time === timeStr) || {
        intensity: h >= 17 && h <= 19 ? (isSpiked ? 360 : 250) : h >= 13 && h <= 16 ? 135 : 180,
        renewableShare: 35
      };

      const carbonIntensity = forecastItem.intensity;
      const isCleanValley = carbonIntensity <= 150;
      const isDirtyPeak = carbonIntensity >= 250;

      // Map Orchestrator Task segments into hours 12:00 to 20:00 (offset 0 to 8)
      if (h >= 12 && h <= 20) {
        const offsetHour = h - 12;

        if (orchestratorTask.selectedStrategy === 'FRAGMENT') {
          // FRAGMENT Strategy
          if (offsetHour < 3) {
            orchKw = 2100;
            stageType = 'RUN';
            stageLabel = `${orchestratorTask.workloadType} · Segment A (Compute)`;
          } else if (offsetHour === 3) {
            orchKw = 650;
            stageType = 'CHECKPOINT';
            stageLabel = `${orchestratorTask.workloadType} · State Checkpoint (15m)`;
          } else if (offsetHour === 4 || (isSpiked && (offsetHour === 5 || offsetHour === 6))) {
            orchKw = 0; // Dropped to avoid dirty peak!
            stageType = 'WAIT';
            stageLabel = `Suspended: Avoiding ${carbonIntensity} gCO₂ peak`;
          } else if (offsetHour <= 7) {
            orchKw = 2100;
            stageType = 'RUN';
            stageLabel = `${orchestratorTask.workloadType} · Segment B (Warm Resume & Complete)`;
          } else {
            orchKw = 0;
            stageType = 'IDLE';
            stageLabel = 'Workload Complete · Output Verified';
          }
        } else if (orchestratorTask.selectedStrategy === 'DELAY') {
          // DELAY Strategy: Postpones start to cleaner valley
          if (offsetHour < 2) {
            orchKw = 0;
            stageType = 'WAIT';
            stageLabel = 'Postponed start: waiting for solar peak';
          } else if (offsetHour < 8) {
            orchKw = 2100;
            stageType = 'RUN';
            stageLabel = `${orchestratorTask.workloadType} · Continuous Delayed Run`;
          }
        } else {
          // RUN Strategy: Immediate execution across all hours
          if (offsetHour < 6) {
            orchKw = 2100;
            stageType = 'RUN';
            stageLabel = `${orchestratorTask.workloadType} · Immediate Execution`;
          }
        }
      }

      const totalKw = viewMode === 'COMBINED' ? Math.round(bgKw + orchKw) : Math.round(orchKw);
      const utilization = Math.min(100, Math.round((totalKw / 3000) * 100));

      points.push({
        time: timeStr,
        hour: h,
        computeKw: totalKw,
        orchestratorKw: orchKw,
        backgroundKw: Math.round(bgKw),
        utilizationPct: utilization,
        carbonIntensity,
        stageLabel,
        stageType,
        isCleanValley,
        isDirtyPeak
      });
    });

    return points;
  }, [orchestratorTask.selectedStrategy, orchestratorTask.workloadType, currentForecast, isSpiked, viewMode]);

  // Executed & Active Processes Data List
  const executedProcesses: ExecutedProcessRecord[] = useMemo(() => {
    const primaryStatus: ExecutedProcessRecord['status'] =
      orchestratorTask.simProgress >= 100
        ? 'COMPLETED'
        : orchestratorTask.simStatus === 'RUNNING'
        ? orchestratorTask.simCurrentHour >= 3 && orchestratorTask.simCurrentHour < 4
          ? 'CHECKPOINT'
          : orchestratorTask.simCurrentHour >= 4 && orchestratorTask.simCurrentHour < 5
          ? 'WAITING'
          : 'RUNNING'
        : orchestratorTask.simStatus === 'PAUSED'
        ? 'WAITING'
        : 'QUEUED';

    const primaryTask: ExecutedProcessRecord = {
      id: 'orch-task-01',
      name: `${orchestratorTask.workloadType} (${orchestratorTask.runtimeHours}h Job)`,
      workloadType: orchestratorTask.workloadType,
      strategy: orchestratorTask.selectedStrategy,
      status: primaryStatus,
      progress: Math.round(orchestratorTask.simProgress),
      runtimeHours: orchestratorTask.runtimeHours,
      durationLabel: `${orchestratorTask.simCurrentHour.toFixed(1)}h / ${orchestratorTask.deadlineHours}h`,
      computeLoadKw: primaryStatus === 'WAITING' ? 0 : 2100,
      gpuNodes: '8x A100 SXM4 (640GB VRAM)',
      carbonSavedGrams: activeStrategyPlan?.carbonSavedGrams || 420,
      carbonSavedPercent: activeStrategyPlan?.carbonSavedPercent || 31,
      carbonIntensityAvg: isSpiked ? 165 : 138,
      startTime: '12:00 PM',
      finishTime: activeStrategyPlan?.finishTimeFormatted || '08:00 PM',
      currentSegmentLabel:
        orchestratorTask.simProgress >= 100
          ? 'Completed all segments successfully'
          : orchestratorTask.selectedStrategy === 'FRAGMENT'
          ? orchestratorTask.simCurrentHour < 3
            ? 'Segment A: Active Compute (3h)'
            : orchestratorTask.simCurrentHour < 3.25
            ? 'State Checkpoint dump to NVMe (15m)'
            : orchestratorTask.simCurrentHour < 4.25
            ? 'Suspended: Avoid 360 gCO₂ dirty peak'
            : 'Segment B: Resume & final epoch'
          : 'Continuous compute stream',
      isOrchestratorPrimary: true
    };

    let historicalProcesses: ExecutedProcessRecord[] = [];

    if (workloadHistory && workloadHistory.length > 0) {
      historicalProcesses = workloadHistory.map((item) => ({
        id: item.id,
        name: item.name,
        workloadType: item.workloadType,
        strategy: item.strategy,
        status:
          item.status === 'COMPLETED'
            ? 'COMPLETED'
            : item.status === 'RUNNING'
            ? 'RUNNING'
            : item.status === 'FAILED'
            ? 'FAILED'
            : item.status === 'CHECKPOINT'
            ? 'CHECKPOINT'
            : 'WAITING',
        progress:
          item.status === 'COMPLETED'
            ? 100
            : item.status === 'RUNNING'
            ? 68
            : item.status === 'FAILED'
            ? 32
            : 20,
        runtimeHours: item.runtimeHours,
        durationLabel: item.durationLabel,
        computeLoadKw: item.computeLoadKw,
        gpuNodes: item.gpuNodes,
        carbonSavedGrams: item.carbonSavedGrams,
        carbonSavedPercent: item.carbonSavedPercent,
        carbonIntensityAvg: isSpiked ? 165 : 138,
        startTime: item.timestamp.includes('Today') ? item.timestamp.replace('Today, ', '') : '10:00 AM',
        finishTime: item.durationLabel.includes('Completed') ? '03:30 PM' : 'In Flight',
        currentSegmentLabel: item.segmentsSummary || 'Checkpoint & state synced',
        isOrchestratorPrimary: false
      }));
    } else {
      historicalProcesses = [
        {
          id: 'task-128',
          name: 'Data-Processing-ETL',
          workloadType: 'Spark Pipeline',
          strategy: 'FRAGMENT',
          status: 'RUNNING',
          progress: 74,
          runtimeHours: 4,
          durationLabel: '2h 50m elapsed',
          computeLoadKw: 680,
          gpuNodes: '3 Nodes (96 vCPU)',
          carbonSavedGrams: 280,
          carbonSavedPercent: 26,
          carbonIntensityAvg: 142,
          startTime: '10:00 AM',
          finishTime: '02:30 PM',
          currentSegmentLabel: 'Segment 2/2: Ingestion & Parquet transform'
        },
        {
          id: 'task-131',
          name: 'Embedding-Generation-Inference',
          workloadType: 'Batch Inference',
          strategy: 'DELAY',
          status: 'COMPLETED',
          progress: 100,
          runtimeHours: 2.5,
          durationLabel: '2h 30m completed',
          computeLoadKw: 1420,
          gpuNodes: '4x A100 (Clean Valley)',
          carbonSavedGrams: 420,
          carbonSavedPercent: 35,
          carbonIntensityAvg: 125,
          startTime: '07:30 AM',
          finishTime: '10:00 AM',
          currentSegmentLabel: '100% vectors computed in clean solar window'
        },
        {
          id: 'task-127',
          name: 'LLaMA-3-8B-LoRA-FineTune',
          workloadType: 'LLM Fine-Tuning',
          strategy: 'FRAGMENT',
          status: 'COMPLETED',
          progress: 100,
          runtimeHours: 5,
          durationLabel: '5h completed (2 checkpoints)',
          computeLoadKw: 2400,
          gpuNodes: '6x A100 (Distributed PyTorch)',
          carbonSavedGrams: 650,
          carbonSavedPercent: 38,
          carbonIntensityAvg: 130,
          startTime: '01:00 AM',
          finishTime: '06:45 AM',
          currentSegmentLabel: 'Checkpoint #2 restored, converged at 0.84 loss'
        },
        {
          id: 'task-129',
          name: 'ResNet-50-Evaluation-Batch',
          workloadType: 'ML Training',
          strategy: 'DELAY',
          status: 'COMPLETED',
          progress: 100,
          runtimeHours: 1.5,
          durationLabel: '1h 30m completed',
          computeLoadKw: 950,
          gpuNodes: '2x A100 GPUs',
          carbonSavedGrams: 190,
          carbonSavedPercent: 22,
          carbonIntensityAvg: 140,
          startTime: '06:00 AM',
          finishTime: '07:30 AM',
          currentSegmentLabel: 'Validation accuracy 82.4% logged'
        },
        {
          id: 'task-130',
          name: 'Log-Analysis-Audit',
          workloadType: 'Batch Analytics',
          strategy: 'RUN',
          status: 'FAILED',
          progress: 32,
          runtimeHours: 0.8,
          durationLabel: 'Failed at 35m',
          computeLoadKw: 0,
          gpuNodes: '1 Node (High RAM)',
          carbonSavedGrams: 0,
          carbonSavedPercent: 0,
          carbonIntensityAvg: 210,
          startTime: '11:15 AM',
          finishTime: '11:50 AM',
          currentSegmentLabel: 'Worker OOM (Out of Memory) at shard #14'
        }
      ];
    }

    return [primaryTask, ...historicalProcesses];
  }, [
    orchestratorTask.workloadType,
    orchestratorTask.runtimeHours,
    orchestratorTask.deadlineHours,
    orchestratorTask.selectedStrategy,
    orchestratorTask.simProgress,
    orchestratorTask.simStatus,
    orchestratorTask.simCurrentHour,
    activeStrategyPlan,
    isSpiked,
    workloadHistory
  ]);

  const filteredProcesses = useMemo(() => {
    if (selectedProcessFilter === 'ALL') return executedProcesses;
    if (selectedProcessFilter === 'RUNNING') {
      return executedProcesses.filter((p) => p.status === 'RUNNING' || p.status === 'QUEUED');
    }
    if (selectedProcessFilter === 'COMPLETED') {
      return executedProcesses.filter((p) => p.status === 'COMPLETED');
    }
    if (selectedProcessFilter === 'CHECKPOINT') {
      return executedProcesses.filter((p) => p.status === 'CHECKPOINT' || p.strategy === 'FRAGMENT');
    }
    return executedProcesses;
  }, [executedProcesses, selectedProcessFilter]);

  const handleRetry = (processName: string) => {
    setRetryMessage(`Triggering adaptive retry for ${processName} with checkpoint protection...`);
    setTimeout(() => setRetryMessage(null), 3500);
  };

  const isWaiting = orchestratorTask.selectedStrategy === 'FRAGMENT' && (
    (orchestratorTask.simCurrentHour >= 4 && orchestratorTask.simCurrentHour < 5) ||
    (isSpiked && orchestratorTask.simCurrentHour >= 5 && orchestratorTask.simCurrentHour <= 6)
  );
  const isCheckpoint = orchestratorTask.selectedStrategy === 'FRAGMENT' && (
    orchestratorTask.simCurrentHour >= 3 && orchestratorTask.simCurrentHour < 4
  );
  const isRunning = orchestratorTask.simStatus === 'RUNNING';

  const dynamicGpuPercent = isWaiting
    ? 12
    : isCheckpoint
    ? 28
    : isRunning
    ? 82
    : orchestratorTask.simProgress >= 100
    ? 42
    : 38;

  const dynamicGpuLabel = isWaiting
    ? '2 / 16 A100s'
    : isCheckpoint
    ? '4 / 16 A100s'
    : isRunning
    ? '13 / 16 A100s'
    : '6 / 16 A100s';

  return (
    <div className="space-y-6">
      {/* 3-COLUMN GRID: Workload Activity (2 Cols) + Resource Utilization (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WORKLOAD ACTIVITY CARD & LIVE RECHARTS GRAPH */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs flex flex-col justify-between">
          <div>
            {/* Card Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#E9E7F2]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1B5E5A] animate-pulse"></span>
                  <h3 className="text-base font-bold text-[#2E2E3A]">Workload Activity</h3>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DFF3E7] text-[#1B5E5A] border border-[#7FB892]/40">
                    Synced with Orchestrator ({orchestratorTask.selectedStrategy})
                  </span>
                </div>
                <p className="text-xs text-[#2E2E3A]/60 mt-1">
                  Compute throughput dynamically modulated by clean solar/wind valleys and checkpoint pauses
                </p>
              </div>


          {/* Controls: View Mode & Launch Orchestrator */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2]">
              <button
                onClick={() => setViewMode('COMBINED')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'COMBINED'
                    ? 'bg-white text-[#1B5E5A] shadow-xs'
                    : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                Cluster + Orchestrator
              </button>
              <button
                onClick={() => setViewMode('ORCHESTRATED_ONLY')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'ORCHESTRATED_ONLY'
                    ? 'bg-white text-[#1B5E5A] shadow-xs'
                    : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                Orchestrated Task Only
              </button>
            </div>

            <button
              onClick={onOpenOrchestrator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all shadow-xs cursor-pointer"
            >
              <span>Orchestrator Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Status Pill Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
            <span className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Orchestrated Task</span>
            <div className="text-xs font-extrabold text-[#1B5E5A] truncate mt-0.5">
              {orchestratorTask.workloadType} ({orchestratorTask.runtimeHours}h)
            </div>
            <div className="text-[10px] text-[#2E2E3A]/60">Budget: ${orchestratorTask.budget} cap</div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
            <span className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Active Strategy</span>
            <div className="text-xs font-extrabold text-[#2E2E3A] flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  orchestratorTask.selectedStrategy === 'FRAGMENT'
                    ? 'bg-[#1B5E5A]'
                    : orchestratorTask.selectedStrategy === 'DELAY'
                    ? 'bg-[#F6B26B]'
                    : 'bg-[#2E2E3A]'
                }`}
              ></span>
              <span>{orchestratorTask.selectedStrategy}</span>
            </div>
            <div className="text-[10px] text-[#1B5E5A] font-semibold">
              -{activeStrategyPlan?.carbonSavedPercent || 31}% CO₂ Avoidance
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
            <span className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Simulator State</span>
            <div className="text-xs font-extrabold text-[#2E2E3A] mt-0.5 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  orchestratorTask.simStatus === 'RUNNING'
                    ? 'bg-[#7FB892] animate-pulse'
                    : orchestratorTask.simProgress >= 100
                    ? 'bg-[#1B5E5A]'
                    : 'bg-[#F6B26B]'
                }`}
              ></span>
              <span>
                {orchestratorTask.simProgress >= 100
                  ? 'Completed (100%)'
                  : orchestratorTask.simStatus === 'RUNNING'
                  ? `Running (${Math.round(orchestratorTask.simProgress)}%)`
                  : 'Ready / Scheduled'}
              </span>
            </div>
            <div className="text-[10px] text-[#2E2E3A]/60">
              Hour {orchestratorTask.simCurrentHour}h of {orchestratorTask.deadlineHours}h window
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
            <span className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Grid Condition</span>
            <div className="text-xs font-extrabold text-[#2E2E3A] mt-0.5 flex items-center gap-1.5">
              <Zap
                className={`w-3.5 h-3.5 ${
                  isSpiked ? 'text-[#F28C7B]' : 'text-[#7FB892]'
                }`}
              />
              <span className={isSpiked ? 'text-[#F28C7B]' : 'text-[#1B5E5A]'}>
                {isSpiked ? 'Spike Active (360 gCO₂)' : 'Normal Solar Cycle'}
              </span>
            </div>
            <div className="text-[10px] text-[#2E2E3A]/60">
              {replanCount > 0 ? `${replanCount} adaptive replans done` : 'Baseline schedule'}
            </div>
          </div>
        </div>

        {/* Dynamic Recharts Multi-Wave Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="workloadComputeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B5E5A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7FB892" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E7F2" />

              <XAxis 
                dataKey="time" 
                tick={{ fill: '#2E2E3A', opacity: 0.6, fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#E9E7F2' }}
                tickLine={false}
              />

              <YAxis 
                yAxisId="compute"
                tick={{ fill: '#2E2E3A', opacity: 0.6, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                unit="kW"
                domain={[0, 3200]}
              />

              <YAxis 
                yAxisId="carbon"
                orientation="right"
                tick={{ fill: '#F28C7B', opacity: 0.7, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                unit="g"
                domain={[0, 400]}
                hide={true}
              />

              <Tooltip content={<CustomActivityTooltip />} />

              {/* Shaded Line for Dirty Peak */}
              <ReferenceLine 
                x="17:00" 
                stroke="#F28C7B" 
                strokeDasharray="4 4" 
                label={{ 
                  value: isSpiked ? 'Spike 360g' : 'Peak Dirty Hour', 
                  fill: '#F28C7B', 
                  fontSize: 10, 
                  position: 'top' 
                }} 
              />

              {/* Primary Compute Throughput Area Wave */}
              <Area
                yAxisId="compute"
                type="monotone"
                dataKey="computeKw"
                stroke="#1B5E5A"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#workloadComputeGrad)"
                name="Compute Throughput"
              />

              {/* Secondary Grid Carbon Intensity Line */}
              <Line
                yAxisId="carbon"
                type="monotone"
                dataKey="carbonIntensity"
                stroke="#F28C7B"
                strokeWidth={1.8}
                strokeDasharray="4 3"
                dot={false}
                name="Grid Carbon Intensity"
              />

              {/* Highlight Dot for Maximum Compute in Clean Valley */}
              <ReferenceDot
                yAxisId="compute"
                x="14:00"
                y={chartData.find((d) => d.time === '14:00')?.computeKw || 2400}
                r={5}
                fill="#1B5E5A"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Interactive Timeline Indicators */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#2E2E3A]/70 pt-3 border-t border-[#E9E7F2] mt-2 gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#1B5E5A]"></span>
              <span className="font-semibold text-[#2E2E3A]">Compute Throughput (kW)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#F28C7B] border-t border-dashed border-[#F28C7B]"></span>
              <span>Grid Carbon (gCO₂/kWh)</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#1B5E5A] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#7FB892]" />
              <span>Clean Valley: 13:00 - 16:00 (135 gCO₂)</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#C53030]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F28C7B]" />
              <span>Dirty Peak: 17:00 - 19:00 ({isSpiked ? '360' : '270'} gCO₂)</span>
            </span>
          </div>

          <div className="text-[11px] font-medium text-[#2E2E3A]/50">
            {orchestratorTask.selectedStrategy === 'FRAGMENT'
              ? 'Strategy 3 active: Automatic checkpoint dump & pause across dirty peak'
              : orchestratorTask.selectedStrategy === 'DELAY'
              ? 'Strategy 2 active: Postponed continuous run in clean valley'
              : 'Strategy 1 active: Immediate baseline run'}
          </div>
        </div>
      </div>
    </div>

      {/* Right: Resource Utilization Radial Gauges (1 Col) */}
      <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#2E2E3A]">Resource Utilization</h3>
          <p className="text-xs text-[#2E2E3A]/60">Real-time compute cluster efficiency</p>
        </div>

        {/* 3 Circular Progress Gauges */}
        <div className="grid grid-cols-3 gap-2 my-auto py-4">
          {/* CPU Gauge (72%) */}
          <div className="flex flex-col items-center">
            <div className="relative w-18 h-18">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="36" cy="36" r="30" stroke="#E9E7F2" strokeWidth="5" fill="transparent" />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  stroke="#1B5E5A"
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={2 * Math.PI * 30 * (1 - 0.72)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-sm text-[#2E2E3A] tabular-nums">
                72%
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2E2E3A] mt-2">CPU</span>
            <span className="text-[10px] text-[#2E2E3A]/50">36 / 48 Cores</span>
          </div>

          {/* RAM Gauge (61%) */}
          <div className="flex flex-col items-center">
            <div className="relative w-18 h-18">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="36" cy="36" r="30" stroke="#E9E7F2" strokeWidth="5" fill="transparent" />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  stroke="#7FB892"
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={2 * Math.PI * 30 * (1 - 0.61)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-sm text-[#2E2E3A] tabular-nums">
                61%
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2E2E3A] mt-2">RAM</span>
            <span className="text-[10px] text-[#2E2E3A]/50">156 / 256 GB</span>
          </div>

          {/* GPU Gauge (Dynamic based on Orchestrator state) */}
          <div className="flex flex-col items-center">
            <div className="relative w-18 h-18">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="36" cy="36" r="30" stroke="#E9E7F2" strokeWidth="5" fill="transparent" />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  stroke={dynamicGpuPercent > 50 ? '#1B5E5A' : '#F6B26B'}
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 30}
                  strokeDashoffset={2 * Math.PI * 30 * (1 - dynamicGpuPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-sm text-[#2E2E3A] tabular-nums">
                {dynamicGpuPercent}%
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2E2E3A] mt-2">GPU</span>
            <span className="text-[10px] text-[#2E2E3A]/50">{dynamicGpuLabel}</span>
          </div>
        </div>

        <div className="text-[11px] text-[#2E2E3A]/60 bg-[#DFF3E7]/50 rounded-xl p-2.5 flex items-center gap-2">
          <Leaf className="w-3.5 h-3.5 text-[#1B5E5A] shrink-0" />
          <span>
            {isWaiting
              ? 'GPU cluster paused to avoid 360 gCO₂ dirty grid peak.'
              : isCheckpoint
              ? 'Checkpointed state dump to NVMe in progress.'
              : isRunning
              ? 'Accelerated compute active during clean solar window.'
              : 'GPU capacity dynamically throttled during peak dirty hours to minimize grid carbon.'}
          </span>
        </div>
      </div>
    </div>

      {/* EXECUTED PROCESSES & WORKLOAD EXECUTION DATA PANEL */}
      <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#1B5E5A]" />
              <h3 className="text-base font-bold text-[#2E2E3A]">Executed Processes & Task Pipeline</h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F5EE] text-[#2E2E3A]/70 border border-[#E9E7F2]">
                {executedProcesses.length} Managed Tasks
              </span>
            </div>
            <p className="text-xs text-[#2E2E3A]/60 mt-0.5">
              Live status, runtime segments, GPU cluster allocations, and verified carbon savings
            </p>
          </div>

          {/* Filter Segmented Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F7F5EE] rounded-xl border border-[#E9E7F2]">
            <button
              onClick={() => setSelectedProcessFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedProcessFilter === 'ALL'
                  ? 'bg-white text-[#1B5E5A] shadow-xs'
                  : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
              }`}
            >
              All ({executedProcesses.length})
            </button>
            <button
              onClick={() => setSelectedProcessFilter('RUNNING')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedProcessFilter === 'RUNNING'
                  ? 'bg-white text-[#1B5E5A] shadow-xs'
                  : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
              }`}
            >
              Active / Running
            </button>
            <button
              onClick={() => setSelectedProcessFilter('COMPLETED')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedProcessFilter === 'COMPLETED'
                  ? 'bg-white text-[#1B5E5A] shadow-xs'
                  : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
              }`}
            >
              Completed ({executedProcesses.filter((p) => p.status === 'COMPLETED').length})
            </button>
            <button
              onClick={() => setSelectedProcessFilter('CHECKPOINT')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedProcessFilter === 'CHECKPOINT'
                  ? 'bg-white text-[#1B5E5A] shadow-xs'
                  : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
              }`}
            >
              Checkpointed (Strategy 3)
            </button>
          </div>
        </div>

        {/* Toast / Notification when retry is pressed */}
        {retryMessage && (
          <div className="bg-[#DFF3E7] border border-[#7FB892] text-[#1B5E5A] p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{retryMessage}</span>
          </div>
        )}

        {/* PRIMARY ORCHESTRATED WORKLOAD HIGHLIGHT CARD */}
        {executedProcesses.find((p) => p.isOrchestratorPrimary) && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#DFF3E7]/40 via-white to-[#F7F5EE] border-2 border-[#1B5E5A]/30 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#1B5E5A] text-white">
                    Orchestrator Target Task
                  </span>
                  <span className="text-xs font-mono text-[#2E2E3A]/60">ID: orch-task-01</span>
                  <span className="text-xs font-semibold text-[#1B5E5A] bg-[#DFF3E7] px-2.5 py-0.5 rounded-full border border-[#7FB892]/30">
                    Strategy: {orchestratorTask.selectedStrategy}
                  </span>
                </div>

                <div className="text-base font-extrabold text-[#2E2E3A] flex items-center gap-2">
                  <span>{orchestratorTask.workloadType} (Continuous {orchestratorTask.runtimeHours}h Workload)</span>
                  <span className="text-xs font-normal text-[#2E2E3A]/60">· 8x A100 SXM4</span>
                </div>

                <div className="text-xs text-[#2E2E3A]/80 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#1B5E5A]" />
                  <span>Execution Window: 12:00 PM – {activeStrategyPlan?.finishTimeFormatted || '08:00 PM'}</span>
                  <span>·</span>
                  <span className="font-semibold text-[#1B5E5A]">
                    Phase: {executedProcesses[0].currentSegmentLabel}
                  </span>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right">
                <div className="space-y-1 min-w-[140px]">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-[#2E2E3A]/70">Progress</span>
                    <span className="text-[#1B5E5A] tabular-nums">
                      {Math.round(orchestratorTask.simProgress)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1B5E5A] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, orchestratorTask.simProgress)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#2E2E3A]/60">
                    Saved ~{activeStrategyPlan?.carbonSavedGrams || 420}g CO₂ (-{activeStrategyPlan?.carbonSavedPercent || 31}%)
                  </div>
                </div>

                <button
                  onClick={onOpenOrchestrator}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Open Live Orchestrator</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Segments Step Bar for Fragmented / Delayed Strategy */}
            {orchestratorTask.selectedStrategy === 'FRAGMENT' && (
              <div className="mt-4 pt-3 border-t border-[#E9E7F2] grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white border border-[#E9E7F2] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1B5E5A] shrink-0" />
                  <div>
                    <div className="font-bold text-[#2E2E3A]">Seg A: Compute (3h)</div>
                    <div className="text-[10px] text-[#2E2E3A]/60">Clean Valley · Initial Run</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#E9E7F2] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#F6B26B] shrink-0" />
                  <div>
                    <div className="font-bold text-[#2E2E3A]">Checkpoint Snapshot</div>
                    <div className="text-[10px] text-[#2E2E3A]/60">Saved 1.4 GB to NVMe</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#E9E7F2] flex items-center gap-2">
                  <Pause className="w-4 h-4 text-[#C53030] shrink-0" />
                  <div>
                    <div className="font-bold text-[#2E2E3A]">Dirty Peak Avoidance</div>
                    <div className="text-[10px] text-[#2E2E3A]/60">Paused · Saved emissions</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#E9E7F2] flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#1B5E5A] shrink-0 fill-current" />
                  <div>
                    <div className="font-bold text-[#2E2E3A]">Seg B: Resume & Finish</div>
                    <div className="text-[10px] text-[#2E2E3A]/60">Scheduled in Clean Window</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETAILED EXECUTED PROCESSES TABLE */}
        <div className="overflow-x-auto rounded-xl border border-[#E9E7F2]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5EE] border-b border-[#E9E7F2] text-[#2E2E3A]/70 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Task & ID</th>
                <th className="py-3 px-3">Strategy</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Compute / Nodes</th>
                <th className="py-3 px-3">Execution Progress</th>
                <th className="py-3 px-3">Carbon Avoided</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E7F2]">
              {filteredProcesses.map((proc) => {
                const isRunning = proc.status === 'RUNNING';
                const isCompleted = proc.status === 'COMPLETED';
                const isFailed = proc.status === 'FAILED';

                return (
                  <tr 
                    key={proc.id} 
                    className="hover:bg-[#F7F5EE]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2E2E3A] flex items-center gap-2">
                        <span>{proc.name}</span>
                        {proc.isOrchestratorPrimary && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#1B5E5A] text-white">
                            Active Target
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#2E2E3A]/60 font-mono mt-0.5">
                        {proc.id} · {proc.workloadType}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          proc.strategy === 'FRAGMENT'
                            ? 'bg-[#DFF3E7] text-[#1B5E5A]'
                            : proc.strategy === 'DELAY'
                            ? 'bg-[#F6B26B]/20 text-[#B45309]'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {proc.strategy}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
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
                        />
                        <span
                          className={`font-semibold ${
                            isRunning
                              ? 'text-[#1B5E5A]'
                              : isCompleted
                              ? 'text-[#2E2E3A]'
                              : isFailed
                              ? 'text-[#C53030]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {proc.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5 truncate max-w-[150px]">
                        {proc.durationLabel}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-[#2E2E3A]">{proc.gpuNodes}</div>
                      <div className="text-[10px] text-[#2E2E3A]/50">
                        {proc.computeLoadKw > 0 ? `${proc.computeLoadKw} kW draw` : '0 kW (Suspended)'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{proc.progress}%</span>
                          <span className="text-[#2E2E3A]/50">{proc.runtimeHours}h</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFailed ? 'bg-[#F28C7B]' : isCompleted ? 'bg-[#1B5E5A]' : 'bg-[#7FB892]'
                            }`}
                            style={{ width: `${proc.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-[#1B5E5A] flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-[#7FB892]" />
                        <span>{proc.carbonSavedGrams > 0 ? `-${proc.carbonSavedGrams}g` : '0g'}</span>
                      </div>
                      <div className="text-[10px] text-[#2E2E3A]/50">
                        {proc.carbonSavedPercent > 0 ? `${proc.carbonSavedPercent}% vs Baseline` : 'Baseline'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {isFailed ? (
                        <button
                          onClick={() => handleRetry(proc.name)}
                          className="px-2.5 py-1 rounded-lg bg-[#F28C7B]/20 text-[#C53030] text-[11px] font-bold hover:bg-[#F28C7B]/30 cursor-pointer transition-colors"
                        >
                          Retry Task
                        </button>
                      ) : proc.isOrchestratorPrimary ? (
                        <button
                          onClick={onOpenOrchestrator}
                          className="px-2.5 py-1 rounded-lg bg-[#1B5E5A] text-white text-[11px] font-bold hover:bg-[#144744] cursor-pointer transition-colors"
                        >
                          Inspect →
                        </button>
                      ) : (
                        <button
                          onClick={onOpenOrchestrator}
                          className="text-[#1B5E5A] font-semibold text-[11px] hover:underline cursor-pointer"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
