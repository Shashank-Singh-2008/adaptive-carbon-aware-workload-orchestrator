import { WorkloadRunRecord, OrchestratorTaskState, StrategyPlan } from '../types/orchestrator';

const STORAGE_KEY = 'orchestrator_workload_history_records';

export const INITIAL_WORKLOAD_HISTORY: WorkloadRunRecord[] = [
  {
    id: 'run-104',
    name: '6-Hour ML Training (Distributed PyTorch)',
    workloadType: 'ML Training',
    strategy: 'FRAGMENT',
    status: 'RUNNING',
    runtimeHours: 6,
    durationLabel: '3h 15m elapsed (Segment A completed, Checkpointed)',
    computeLoadKw: 2100,
    gpuNodes: '8x A100 SXM4 (640GB VRAM)',
    nodeId: 'Node-01 (GPU Cluster Alpha)',
    carbonSavedGrams: 420,
    carbonSavedPercent: 31,
    carbonEmittedGrams: 680,
    costDollars: 450,
    budget: 600,
    timestamp: 'Today, 12:00 PM',
    relativeTime: 'Active Now',
    region: 'IN',
    checkpointsCreated: 1,
    segmentsSummary: '2 segments (3h + 3h), 1 checkpoint snapshot (1.4 GB), 1h dirty peak avoided',
    replanCount: 1,
    executionLogs: [
      '12:00:00 - Initialized job on 8x A100 SXM4 nodes (Node-01)',
      '12:05:00 - Clean valley detected (140 gCO₂/kWh). Full compute throttled to 2,100 kW',
      '14:55:00 - Epoch 12 completed. Preparing checkpoint snapshot before 17:00 dirty peak',
      '15:00:00 - Checkpoint #1 snapshot successfully committed to NVMe/S3 (1.42 GB, 0s compute loss)',
      '15:15:00 - Adaptive pause triggered: Grid intensity 360 gCO₂/kWh avoided (Estimated 420g CO₂ saved)',
      '16:30:00 - Resuming Segment B in clean wind window (125 gCO₂/kWh)'
    ]
  },
  {
    id: 'run-103',
    name: 'LLaMA-3-8B-LoRA-FineTune',
    workloadType: 'LLM Fine-Tuning',
    strategy: 'FRAGMENT',
    status: 'COMPLETED',
    runtimeHours: 5,
    durationLabel: 'Completed in 5h 25m',
    computeLoadKw: 2400,
    gpuNodes: '6x A100 SXM4',
    nodeId: 'Node-02 (AI Pod Beta)',
    carbonSavedGrams: 650,
    carbonSavedPercent: 38,
    carbonEmittedGrams: 720,
    costDollars: 395,
    budget: 500,
    timestamp: 'Today, 06:15 AM',
    relativeTime: '45m ago',
    region: 'IN',
    checkpointsCreated: 2,
    segmentsSummary: '2 checkpoints captured at epoch 4 & 8, avoided morning fossil ramp',
    replanCount: 0,
    executionLogs: [
      '01:00:00 - Job queued with priority HIGH (Carbon Preferred)',
      '01:15:00 - Segment 1 running on 6x A100. Grid intensity: 130 gCO₂/kWh',
      '03:45:00 - Checkpoint #1 captured (2.1 GB)',
      '04:00:00 - Paused 45m during coal dispatch surge',
      '04:45:00 - Segment 2 restored from checkpoint. Loss converged to 0.82',
      '06:40:00 - Training completed. Checkpoint finalized. Avoided 650g CO₂'
    ]
  },
  {
    id: 'run-102',
    name: 'BERT-Embedding-Batch-Inference',
    workloadType: 'Batch Inference',
    strategy: 'DELAY',
    status: 'COMPLETED',
    runtimeHours: 2.5,
    durationLabel: 'Completed in 2h 30m',
    computeLoadKw: 1420,
    gpuNodes: '4x A100 Tensor Core',
    nodeId: 'Node-03 (Inference Pool)',
    carbonSavedGrams: 420,
    carbonSavedPercent: 35,
    carbonEmittedGrams: 310,
    costDollars: 185,
    budget: 300,
    timestamp: 'Today, 07:30 AM',
    relativeTime: '2h ago',
    region: 'IN',
    checkpointsCreated: 0,
    segmentsSummary: 'Delayed 2 hours to coincide with peak solar generation valley',
    replanCount: 0,
    executionLogs: [
      '05:30:00 - Job requested. Agent delayed start by 2h to wait for solar irradiance ramp',
      '07:30:00 - Grid intensity fell to 125 gCO₂/kWh. Execution launched',
      '09:45:00 - 12.8M embedding vectors computed and indexed',
      '10:00:00 - Job completed. 100% clean power matched'
    ]
  },
  {
    id: 'run-101',
    name: 'Genomic-Sequence-BLAST-Alignment',
    workloadType: 'Scientific Simulation',
    strategy: 'DELAY',
    status: 'COMPLETED',
    runtimeHours: 5.3,
    durationLabel: 'Completed in 5h 20m',
    computeLoadKw: 950,
    gpuNodes: '6x CPU Compute Nodes (192 Cores)',
    nodeId: 'Node-04 (HPC Cluster)',
    carbonSavedGrams: 640,
    carbonSavedPercent: 28,
    carbonEmittedGrams: 890,
    costDollars: 320,
    budget: 450,
    timestamp: 'Yesterday, 10:30 PM',
    relativeTime: '14h ago',
    region: 'EU-NORTH',
    checkpointsCreated: 0,
    segmentsSummary: 'Routed to Swedish hydro grid (42 gCO₂/kWh) during overnight wind surge',
    replanCount: 0,
    executionLogs: [
      '22:30:00 - Workload routed cross-region to EU-NORTH hydro zone',
      '22:35:00 - High throughput parallel alignment initiated',
      '03:50:00 - 450k genome sequences matched and mapped',
      '03:55:00 - Completed with 98.4% renewable hydro power'
    ]
  },
  {
    id: 'run-100',
    name: 'ELK-Log-Audit-Pipeline',
    workloadType: 'Data Pipeline',
    strategy: 'RUN',
    status: 'FAILED',
    runtimeHours: 0.8,
    durationLabel: 'Failed at t+35m (Memory limit)',
    computeLoadKw: 0,
    gpuNodes: '1 Node (High RAM)',
    nodeId: 'Node-04 (Analytics)',
    carbonSavedGrams: 0,
    carbonSavedPercent: 0,
    carbonEmittedGrams: 95,
    costDollars: 45,
    budget: 150,
    timestamp: 'Yesterday, 04:15 PM',
    relativeTime: '18h ago',
    region: 'IN',
    checkpointsCreated: 0,
    segmentsSummary: 'Worker terminated with Out-of-Memory error on shard #14. Checkpointing recommended.',
    replanCount: 0,
    executionLogs: [
      '16:15:00 - Immediate RUN launched during peak 270 gCO₂/kWh hour',
      '16:45:00 - Heap memory exceeded 64GB on shard 14',
      '16:50:00 - Process killed by OOM killer. Non-checkpointed task lost progress',
      '16:51:00 - Recommendation: Switch to FRAGMENT with state checkpoints on re-run'
    ]
  }
];

export function getStoredWorkloadHistory(): WorkloadRunRecord[] {
  if (typeof window === 'undefined') return INITIAL_WORKLOAD_HISTORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading workload history:', e);
  }
  return INITIAL_WORKLOAD_HISTORY;
}

export function saveWorkloadHistory(records: WorkloadRunRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving workload history:', e);
  }
}

export function createRecordFromOrchestratorTask(
  task: OrchestratorTaskState,
  plan?: StrategyPlan
): WorkloadRunRecord {
  const isCompleted = task.simProgress >= 100;
  const isRunning = task.simStatus === 'RUNNING';
  const isWaiting = task.simStatus === 'WAITING' || (task.selectedStrategy === 'FRAGMENT' && task.simCurrentHour >= 4 && task.simCurrentHour < 5);
  const isCheckpoint = task.selectedStrategy === 'FRAGMENT' && task.simCurrentHour >= 3 && task.simCurrentHour < 4;

  const status: WorkloadRunRecord['status'] = isCompleted
    ? 'COMPLETED'
    : task.replanCount > 0
    ? 'REPLANNED'
    : isCheckpoint
    ? 'CHECKPOINT'
    : isWaiting
    ? 'WAITING'
    : isRunning
    ? 'RUNNING'
    : 'WAITING';

  const carbonSaved = plan?.carbonSavedGrams || (task.selectedStrategy === 'FRAGMENT' ? 420 : task.selectedStrategy === 'DELAY' ? 320 : 0);
  const carbonPct = plan?.carbonSavedPercent || (task.selectedStrategy === 'FRAGMENT' ? 31 : task.selectedStrategy === 'DELAY' ? 24 : 0);
  const cost = plan?.costDollars || Math.round(task.runtimeHours * 75);

  return {
    id: `run-${Date.now().toString().slice(-4)}`,
    name: `${task.workloadType} (${task.runtimeHours}h Task)`,
    workloadType: task.workloadType,
    strategy: task.selectedStrategy,
    status,
    runtimeHours: task.runtimeHours,
    durationLabel: isCompleted
      ? `Completed in ${task.runtimeHours}h`
      : `${task.simCurrentHour.toFixed(1)}h / ${task.deadlineHours}h elapsed (${Math.round(task.simProgress)}%)`,
    computeLoadKw: status === 'WAITING' ? 0 : 2100,
    gpuNodes: '8x A100 SXM4 (640GB VRAM)',
    nodeId: 'Node-01 (GPU Cluster Alpha)',
    carbonSavedGrams: carbonSaved,
    carbonSavedPercent: carbonPct,
    carbonEmittedGrams: Math.round((task.runtimeHours * 3.2 * 140)),
    costDollars: cost,
    budget: task.budget,
    timestamp: 'Just now',
    relativeTime: isCompleted ? 'Just finished' : 'Active Task',
    region: task.region || 'IN',
    checkpointsCreated: task.checkpointCapable && task.selectedStrategy === 'FRAGMENT' ? 1 : 0,
    segmentsSummary:
      task.selectedStrategy === 'FRAGMENT'
        ? 'Adaptive fragmentation across clean solar valley with dirty peak avoidance'
        : task.selectedStrategy === 'DELAY'
        ? 'Postponed continuous execution to clean window'
        : 'Immediate baseline compute dispatch',
    replanCount: task.replanCount,
    executionLogs: [
      `[Task Started] ${task.workloadType} launched with Strategy: ${task.selectedStrategy}`,
      `[Constraints] Runtime: ${task.runtimeHours}h | Deadline: ${task.deadlineHours}h | Budget: $${task.budget}`,
      task.checkpointCapable
        ? '[Checkpoints] Enabled: State snapshots capture every epoch transition'
        : '[Checkpoints] Disabled for this workload type',
      task.isGridSpiked
        ? '⚠️ [Grid Condition] Dynamic grid surge detected (360 gCO₂/kWh) - Adaptive Re-plan active'
        : '✓ [Grid Condition] Normal solar dispatch curve active (140 gCO₂/kWh)',
      isCompleted
        ? `✓ [Finished] All segments converged successfully. Total CO₂ saved: ${carbonSaved}g (-${carbonPct}%)`
        : `[In Progress] Currently at simulated hour ${task.simCurrentHour}h (${Math.round(task.simProgress)}%)`
    ]
  };
}
