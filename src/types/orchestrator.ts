export type WorkloadType = 
  | 'ML Training' 
  | 'Batch Inference' 
  | 'Data Pipeline' 
  | 'LLM Fine-Tuning'
  | 'Scientific Simulation';

export type StrategyType = 'RUN' | 'DELAY' | 'FRAGMENT';

export type SimulationStatus = 
  | 'IDLE' 
  | 'RUNNING' 
  | 'CHECKPOINT' 
  | 'WAITING' 
  | 'RESUME' 
  | 'COMPLETED' 
  | 'PAUSED';

export interface WorkloadConstraints {
  workloadType: WorkloadType;
  runtimeHours: number;
  deadlineHours: number; // e.g. 8 hours window (e.g. before 8 AM)
  budget: number; // e.g. $600
  carbonPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  checkpointCapable: boolean;
  region: string; // e.g. "IN"
  prompt?: string;
  checkpointOverheadMinutes?: number;
}

export interface ExtractedConstraints {
  workloadType: string;
  runtimeHours: number;
  deadlineHours: number;
  budget: number;
  carbonPriority: string;
  checkpointCapable: boolean;
  region: string;
  reasoning: string;
  extractedItems: {
    runtime: string;
    deadline: string;
    budget: string;
    carbonPreference: string;
    checkpointCapability: string;
    region: string;
  };
}

export interface ExecutionSegment {
  id: string;
  type: 'RUN' | 'CHECKPOINT' | 'WAIT' | 'RESUME';
  startHour: number; // relative to start time, e.g. 0 to 8
  durationHours: number;
  label: string;
  carbonIntensityAvg: number;
  estimatedCost: number;
}

export interface StrategyPlan {
  id: StrategyType;
  name: string;
  tagline: string;
  carbonGrams: number;
  carbonSavedGrams: number;
  carbonSavedPercent: number;
  costDollars: number;
  finishTimeFormatted: string;
  finishHour: number;
  isFeasible: boolean;
  feasibilityReason: string;
  isRecommended: boolean;
  segments: ExecutionSegment[];
  description: string;
}

export interface GridHourForecast {
  time: string;
  intensity: number; // gCO2/kWh
  renewableShare: number; // %
  availableGpu: boolean;
  isSpikePoint?: boolean;
}

export interface ReplanComparison {
  triggeredBy: string;
  previousStrategy: StrategyType;
  newStrategy: StrategyType;
  oldSegments: ExecutionSegment[];
  newSegments: ExecutionSegment[];
  oldCarbon: number;
  newCarbon: number;
  savedCarbonDelta: number;
  reason: string;
  timestamp: string;
}

export interface OrchestratorTaskState {
  workloadType: string;
  runtimeHours: number;
  deadlineHours: number;
  budget: number;
  carbonPriority: 'HIGH' | 'MEDIUM' | 'LOW';
  checkpointCapable: boolean;
  fragmentedStrategyEnabled: boolean;
  selectedStrategy: StrategyType;
  simStatus: SimulationStatus;
  simProgress: number; // 0 to 100
  simCurrentHour: number; // 0 to deadlineHours
  simSpeed: number;
  replanCount: number;
  isGridSpiked: boolean;
  prompt: string;
  region: string;
}

export interface ExecutedProcessRecord {
  id: string;
  name: string;
  workloadType: string;
  strategy: StrategyType;
  status: 'RUNNING' | 'CHECKPOINT' | 'WAITING' | 'RESUME' | 'COMPLETED' | 'FAILED' | 'QUEUED';
  progress: number; // 0 - 100
  runtimeHours: number;
  durationLabel: string;
  computeLoadKw: number;
  gpuNodes: string;
  carbonSavedGrams: number;
  carbonSavedPercent: number;
  carbonIntensityAvg: number;
  startTime: string;
  finishTime: string;
  currentSegmentLabel?: string;
  activeSegments?: ExecutionSegment[];
  isOrchestratorPrimary?: boolean;
}

export interface WorkloadRunRecord {
  id: string;
  name: string;
  workloadType: string;
  strategy: StrategyType;
  status: 'COMPLETED' | 'RUNNING' | 'CHECKPOINT' | 'WAITING' | 'FAILED' | 'REPLANNED';
  runtimeHours: number;
  durationLabel: string;
  computeLoadKw: number;
  gpuNodes: string;
  nodeId: string;
  carbonSavedGrams: number;
  carbonSavedPercent: number;
  carbonEmittedGrams: number;
  costDollars: number;
  budget: number;
  timestamp: string;
  relativeTime: string;
  region: string;
  checkpointsCreated: number;
  segmentsSummary: string;
  executionLogs: string[];
  replanCount?: number;
  canRetry?: boolean;
  carbonIntensityAvg?: number;
  startTime?: string;
  finishTime?: string;
}


