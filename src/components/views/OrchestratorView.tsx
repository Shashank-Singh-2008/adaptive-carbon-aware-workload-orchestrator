import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Globe, 
  Leaf, 
  Sliders, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  AlertTriangle, 
  Check, 
  Code, 
  BarChart2, 
  RefreshCw,
  FastForward,
  ShieldCheck,
  ChevronRight,
  Info,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { 
  WorkloadConstraints, 
  ExtractedConstraints, 
  StrategyPlan, 
  StrategyType, 
  ExecutionSegment, 
  SimulationStatus, 
  GridHourForecast,
  OrchestratorTaskState,
  WorkloadRunRecord
} from '../../types/orchestrator';
import { 
  DEFAULT_GRID_FORECAST, 
  SPIKED_GRID_FORECAST, 
  evaluateStrategies, 
  computeAdaptiveReplan 
} from '../../utils/decisionEngine';
import { createRecordFromOrchestratorTask } from '../../utils/workloadHistory';

interface OrchestratorViewProps {
  onGridSpikeChanged?: (isSpiked: boolean) => void;
  initialSpiked?: boolean;
  targetRegion?: string;
  orchestratorTask?: OrchestratorTaskState;
  onUpdateOrchestratorTask?: (updater: Partial<OrchestratorTaskState>) => void;
  onAddWorkloadToHistory?: (record: WorkloadRunRecord) => void;
  onNavigateToWorkloads?: () => void;
}

export const OrchestratorView: React.FC<OrchestratorViewProps> = ({
  onGridSpikeChanged,
  initialSpiked = false,
  targetRegion = 'IN',
  orchestratorTask,
  onUpdateOrchestratorTask,
  onAddWorkloadToHistory,
  onNavigateToWorkloads,
}) => {
  // 5 Step Screens matching PDF section 11 & 14:
  // 1: Setup, 2: Agent Analysis, 3: Strategy Comparison, 4: Live Orchestration, 5: Re-planning & Results
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [prompt, setPrompt] = useState<string>(
    orchestratorTask?.prompt || 'Run my 6-hour ML training job before 8 AM, under $600, with carbon reduction preferred.'
  );
  const [workloadType, setWorkloadType] = useState<string>(orchestratorTask?.workloadType || 'ML Training');
  const [runtimeHours, setRuntimeHours] = useState<number>(orchestratorTask?.runtimeHours ?? 6);
  const [deadlineHours, setDeadlineHours] = useState<number>(orchestratorTask?.deadlineHours ?? 8);
  const [budget, setBudget] = useState<number>(orchestratorTask?.budget ?? 600);
  const [region, setRegion] = useState<string>(orchestratorTask?.region || targetRegion);
  const [carbonPriority, setCarbonPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>(orchestratorTask?.carbonPriority || 'HIGH');
  const [checkpointCapable, setCheckpointCapable] = useState<boolean>(orchestratorTask?.checkpointCapable ?? true);
  const [fragmentedStrategyEnabled, setFragmentedStrategyEnabled] = useState<boolean>(orchestratorTask?.fragmentedStrategyEnabled ?? true);

  // Toggle Handlers
  const handleToggleCheckpoint = (enabled: boolean) => {
    setCheckpointCapable(enabled);
    if (!enabled) {
      setFragmentedStrategyEnabled(false);
      if (selectedStrategy === 'FRAGMENT') {
        setSelectedStrategy('DELAY');
      }
    } else {
      setFragmentedStrategyEnabled(true);
    }
  };

  const handleToggleFragmentedStrategy = (enabled: boolean) => {
    if (!checkpointCapable) return;
    setFragmentedStrategyEnabled(enabled);
    if (!enabled && selectedStrategy === 'FRAGMENT') {
      setSelectedStrategy(strategies?.DELAY.isFeasible ? 'DELAY' : 'RUN');
    }
  };

  // Agent extraction state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedConstraints | null>(null);
  const [showJson, setShowJson] = useState<boolean>(false);

  // Decision Engine & Strategies
  const [strategies, setStrategies] = useState<Record<StrategyType, StrategyPlan> | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>(orchestratorTask?.selectedStrategy || 'FRAGMENT');

  // Live Simulator state
  const [simStatus, setSimStatus] = useState<SimulationStatus>(orchestratorTask?.simStatus || 'IDLE');
  const [simProgress, setSimProgress] = useState<number>(orchestratorTask?.simProgress ?? 0); // 0 to 100%
  const [simCurrentHour, setSimCurrentHour] = useState<number>(orchestratorTask?.simCurrentHour ?? 0); // 0 to 8
  const [simSpeed, setSimSpeed] = useState<number>(orchestratorTask?.simSpeed ?? 1); // 1x, 2x, 5x
  const [replanCount, setReplanCount] = useState<number>(orchestratorTask?.replanCount ?? 0);
  const [isGridSpiked, setIsGridSpiked] = useState<boolean>(orchestratorTask?.isGridSpiked ?? initialSpiked);
  const [replanEvent, setReplanEvent] = useState<any>(null);
  const [simulatingChange, setSimulatingChange] = useState<boolean>(false);
  const [replanNotification, setReplanNotification] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Sync external changes
  useEffect(() => {
    setIsGridSpiked(initialSpiked);
  }, [initialSpiked]);

  useEffect(() => {
    if (targetRegion) setRegion(targetRegion);
  }, [targetRegion]);

  // Sync state back to parent
  useEffect(() => {
    if (onUpdateOrchestratorTask) {
      onUpdateOrchestratorTask({
        prompt,
        workloadType,
        runtimeHours,
        deadlineHours,
        budget,
        region,
        carbonPriority,
        checkpointCapable,
        fragmentedStrategyEnabled,
        selectedStrategy,
        simStatus,
        simProgress,
        simCurrentHour,
        simSpeed,
        replanCount,
        isGridSpiked,
      });
    }
  }, [
    prompt,
    workloadType,
    runtimeHours,
    deadlineHours,
    budget,
    region,
    carbonPriority,
    checkpointCapable,
    fragmentedStrategyEnabled,
    selectedStrategy,
    simStatus,
    simProgress,
    simCurrentHour,
    simSpeed,
    replanCount,
    isGridSpiked,
    onUpdateOrchestratorTask
  ]);


  // Re-evaluate strategies whenever any constraint or parameter changes
  useEffect(() => {
    const currentForecast = isGridSpiked ? SPIKED_GRID_FORECAST : DEFAULT_GRID_FORECAST;
    const isFragmentAllowed = checkpointCapable && fragmentedStrategyEnabled;
    const computed = evaluateStrategies(
      {
        workloadType: workloadType as any,
        runtimeHours,
        deadlineHours,
        budget,
        carbonPriority,
        checkpointCapable: isFragmentAllowed,
        region,
      },
      currentForecast
    );
    setStrategies(computed);

    // If currently selected strategy is infeasible or fragment is disabled, switch to feasible candidate
    if (selectedStrategy === 'FRAGMENT' && !isFragmentAllowed) {
      setSelectedStrategy(computed.DELAY.isFeasible ? 'DELAY' : 'RUN');
    } else {
      const currentPlan = computed[selectedStrategy];
      if (!currentPlan || !currentPlan.isFeasible) {
        const rec = (Object.keys(computed) as StrategyType[]).find(
          (k) => computed[k].isRecommended && computed[k].isFeasible && (k !== 'FRAGMENT' || isFragmentAllowed)
        );
        if (rec) {
          setSelectedStrategy(rec);
        } else {
          setSelectedStrategy(computed.DELAY.isFeasible ? 'DELAY' : 'RUN');
        }
      }
    }
  }, [runtimeHours, deadlineHours, budget, checkpointCapable, fragmentedStrategyEnabled, isGridSpiked, region, carbonPriority, workloadType]);

  // Handle Preset Clicks
  const handleSelectPreset = (presetText: string) => {
    setPrompt(presetText);
  };

  // Step 1 -> Step 2: Trigger AI Agent Parsing
  const handleRunAgentExtraction = async () => {
    setIsParsing(true);
    try {
      const res = await fetch('/api/agent/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setExtractedData(data);
      if (data.runtimeHours) setRuntimeHours(data.runtimeHours);
      if (data.deadlineHours) setDeadlineHours(data.deadlineHours);
      if (data.budget) setBudget(data.budget);
      if (data.carbonPriority) setCarbonPriority(data.carbonPriority);
      if (data.checkpointCapable !== undefined) {
        setCheckpointCapable(data.checkpointCapable);
        if (!data.checkpointCapable) {
          setFragmentedStrategyEnabled(false);
        }
      }
      if (data.region) setRegion(data.region);
      if (data.workloadType) setWorkloadType(data.workloadType);
      
      setCurrentStep(2);
    } catch (e) {
      console.error(e);
      // Fallback
      setCurrentStep(2);
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2 -> Step 3: Compute Strategies
  const handleProceedToStrategies = () => {
    const currentForecast = isGridSpiked ? SPIKED_GRID_FORECAST : DEFAULT_GRID_FORECAST;
    const isFragmentAllowed = checkpointCapable && fragmentedStrategyEnabled;
    const computed = evaluateStrategies(
      {
        workloadType: workloadType as any,
        runtimeHours,
        deadlineHours,
        budget,
        carbonPriority,
        checkpointCapable: isFragmentAllowed,
        region,
      },
      currentForecast
    );
    setStrategies(computed);
    if (!isFragmentAllowed) {
      setSelectedStrategy(computed.DELAY.isFeasible ? 'DELAY' : 'RUN');
    } else {
      setSelectedStrategy(computed.FRAGMENT.isFeasible ? 'FRAGMENT' : (computed.DELAY.isFeasible ? 'DELAY' : 'RUN'));
    }
    setCurrentStep(3);
  };

  // Step 3 -> Step 4: Launch Simulation
  const handleLaunchSimulation = () => {
    if (selectedStrategy === 'FRAGMENT' && (!checkpointCapable || !fragmentedStrategyEnabled)) {
      setSelectedStrategy(strategies?.DELAY.isFeasible ? 'DELAY' : 'RUN');
      return;
    }
    setSimProgress(0);
    setSimCurrentHour(0);
    setSimStatus('RUNNING');
    setCurrentStep(4);
  };

  // Simulation Loop
  useEffect(() => {
    if (simStatus === 'RUNNING' && currentStep === 4) {
      timerRef.current = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timerRef.current);
            setSimStatus('COMPLETED');
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#1B5E5A', '#7FB892', '#DFF3E7', '#F6B26B']
            });

            if (onAddWorkloadToHistory) {
              const completedRecord = createRecordFromOrchestratorTask(
                {
                  prompt,
                  workloadType,
                  runtimeHours,
                  deadlineHours,
                  budget,
                  region,
                  carbonPriority,
                  checkpointCapable,
                  fragmentedStrategyEnabled,
                  selectedStrategy,
                  simStatus: 'COMPLETED',
                  simProgress: 100,
                  simCurrentHour: deadlineHours,
                  simSpeed,
                  replanCount,
                  isGridSpiked,
                },
                activePlan || undefined
              );
              onAddWorkloadToHistory(completedRecord);
            }

            return 100;
          }
          const next = prev + 1.2 * simSpeed;
          setSimCurrentHour(parseFloat(((next / 100) * deadlineHours).toFixed(2)));
          return next > 100 ? 100 : next;
        });
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simStatus, simSpeed, currentStep, deadlineHours]);

  // Determine active segment based on progress
  const activePlan = strategies ? strategies[selectedStrategy] : null;
  const currentSegment = activePlan
    ? activePlan.segments.find((seg) => {
        const segEnd = seg.startHour + seg.durationHours;
        return simCurrentHour >= seg.startHour && simCurrentHour <= segEnd;
      }) || activePlan.segments[activePlan.segments.length - 1]
    : null;

  // The Key Demo Control: "SIMULATE GRID CHANGE"
  const handleSimulateGridChange = async () => {
    if (simulatingChange) return;
    setSimulatingChange(true);
    setReplanNotification('⚠️ Grid condition change detected at 17:00! Monitoring service triggering re-evaluation...');

    // 1. Condition Changed: Grid spikes at 17:00
    setIsGridSpiked(true);
    if (onGridSpikeChanged) onGridSpikeChanged(true);

    setTimeout(() => {
      // 2. Monitoring detects threshold (>15%)
      setReplanNotification('🔍 Carbon forecast surge +71.4% (210 → 360 gCO₂/kWh) exceeds 15% threshold!');

      setTimeout(() => {
        // 3. Decision Engine computes new plan
        if (activePlan) {
          const replanResult = computeAdaptiveReplan(activePlan, simCurrentHour);
          setReplanEvent(replanResult);

          // Update strategy with adapted plan
          setStrategies((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              FRAGMENT: replanResult.newPlan,
            };
          });

          setReplanCount((c) => c + 1);
          setReplanNotification('✅ Re-planning Complete: Checkpoint extended to skip 360 gCO₂ spike. Transitioning to Screen 5...');

          setTimeout(() => {
            setSimulatingChange(false);
            setReplanNotification(null);
            setCurrentStep(5);
          }, 1400);
        }
      }, 1000);
    }, 1000);
  };

  const handleResetDemo = () => {
    setIsGridSpiked(false);
    if (onGridSpikeChanged) onGridSpikeChanged(false);
    setSimProgress(0);
    setSimCurrentHour(0);
    setSimStatus('IDLE');
    setReplanCount(0);
    setReplanEvent(null);
    setCurrentStep(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* 5-Step Stepper Header matching PDF specification */}
      <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E7F2] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B5E5A]"></span>
              <h2 className="text-xl font-extrabold text-[#2E2E3A] tracking-tight">
                Adaptive Workload Orchestrator
              </h2>
            </div>
            <p className="text-xs text-[#2E2E3A]/60 mt-0.5">
              Understand → Decide → Schedule → Execute → Monitor → Adapt
            </p>
          </div>

          <div className="flex items-center gap-3">
            {replanCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] border border-[#7FB892]">
                <RefreshCw className="w-3 h-3" /> Re-plans Executed: {replanCount}
              </span>
            )}
            <button
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E9E7F2] text-xs font-semibold text-[#2E2E3A]/70 hover:bg-[#F7F5EE] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Workflow</span>
            </button>
          </div>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { num: 1, label: 'Workload Setup' },
            { num: 2, label: 'Agent Analysis' },
            { num: 3, label: 'Strategy Comparison' },
            { num: 4, label: 'Live Orchestration' },
            { num: 5, label: 'Adaptive Re-planning' },
          ].map((s) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num as any)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1B5E5A] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-[#DFF3E7] text-[#1B5E5A] hover:bg-[#cdeed9]'
                    : 'bg-[#F7F5EE] text-[#2E2E3A]/50 hover:text-[#2E2E3A]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-white text-[#1B5E5A]'
                      : isCompleted
                      ? 'bg-[#1B5E5A] text-white'
                      : 'bg-[#E9E7F2] text-[#2E2E3A]/60'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Screen {s.num}</div>
                  <div className="text-xs font-bold truncate">{s.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Re-plan Alert Banner */}
      {replanNotification && (
        <div className="bg-[#1B5E5A] text-white p-4 rounded-2xl shadow-lg border border-[#7FB892] flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#F6B26B]" />
            </div>
            <span className="text-xs font-semibold">{replanNotification}</span>
          </div>
          <div className="text-[11px] font-mono bg-white/20 px-2 py-1 rounded">Re-plan in flight...</div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 1: WORKLOAD SETUP */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Screen 1: Natural-Language & Parameter Input</span>
            </div>
            <h3 className="text-xl font-bold text-[#2E2E3A]">Submit Workload & Scheduling Constraints</h3>
            <p className="text-xs text-[#2E2E3A]/70 mt-1">
              Provide natural language instructions or configure structured limits. The AI Agent will extract constraints for the deterministic decision engine.
            </p>
          </div>

          {/* Natural Language Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2E2E3A] flex items-center gap-2">
              <span>Natural-Language Workload Intent</span>
              <span className="text-[10px] text-[#2E2E3A]/50 font-normal">(Parsed by Gemini LLM)</span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                className="w-full p-4 pr-32 bg-[#F7F5EE] border border-[#E9E7F2] rounded-xl text-xs font-medium text-[#2E2E3A] focus:outline-none focus:ring-2 focus:ring-[#7FB892] focus:bg-white transition-all shadow-inner"
                placeholder="e.g. Run my 6-hour ML training job before 8 AM, under $600, with carbon reduction preferred."
              />
              <button
                onClick={handleRunAgentExtraction}
                disabled={isParsing}
                className="absolute right-3 bottom-3 flex items-center gap-2 px-4 py-2 bg-[#1B5E5A] text-white text-xs font-bold rounded-lg hover:bg-[#144744] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#7FB892]" />
                    <span>Analyze with Agent</span>
                  </>
                )}
              </button>
            </div>

            {/* Presets Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-[#2E2E3A]/50">Demo Presets:</span>
              <button
                onClick={() => handleSelectPreset('Run my 6-hour ML training job before 8 AM, under $600, with carbon reduction preferred.')}
                className="text-[11px] bg-[#F7F5EE] hover:bg-[#DFF3E7] hover:text-[#1B5E5A] px-2.5 py-1 rounded-md border border-[#E9E7F2] text-[#2E2E3A]/80 transition-colors cursor-pointer"
              >
                Benchmark: 6h ML Training, &lt;8 AM, $600 (India)
              </button>
              <button
                onClick={() => handleSelectPreset('Schedule a 4-hour batch inference task under $300 before 6 PM in India region.')}
                className="text-[11px] bg-[#F7F5EE] hover:bg-[#DFF3E7] hover:text-[#1B5E5A] px-2.5 py-1 rounded-md border border-[#E9E7F2] text-[#2E2E3A]/80 transition-colors cursor-pointer"
              >
                Inference: 4h Task, $300 Budget
              </button>
              <button
                onClick={() => handleSelectPreset('Execute an 8-hour checkpointable LLM fine-tuning job overnight with a hard budget of $550.')}
                className="text-[11px] bg-[#F7F5EE] hover:bg-[#DFF3E7] hover:text-[#1B5E5A] px-2.5 py-1 rounded-md border border-[#E9E7F2] text-[#2E2E3A]/80 transition-colors cursor-pointer"
              >
                LLM Fine-Tune: 8h Overnight
              </button>
            </div>
          </div>

          <div className="h-px bg-[#E9E7F2]" />

          {/* Structured Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-bold text-[#2E2E3A] block mb-1.5">Workload Type</label>
              <select
                value={workloadType}
                onChange={(e) => setWorkloadType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E9E7F2] rounded-xl text-xs font-semibold text-[#2E2E3A] focus:outline-none focus:ring-2 focus:ring-[#7FB892]"
              >
                <option value="ML Training">ML Training (PyTorch / TensorFlow)</option>
                <option value="Batch Inference">Batch Inference</option>
                <option value="Data Pipeline">Data Pipeline / ETL</option>
                <option value="LLM Fine-Tuning">LLM Fine-Tuning</option>
                <option value="Scientific Simulation">Scientific Simulation</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#2E2E3A]">Compute Runtime</label>
                <span className="text-xs font-bold text-[#1B5E5A] tabular-nums">{runtimeHours} Hours</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={runtimeHours}
                onChange={(e) => setRuntimeHours(parseInt(e.target.value))}
                className="w-full accent-[#1B5E5A]"
              />
              <div className="flex justify-between text-[10px] text-[#2E2E3A]/40 mt-1">
                <span>2h</span>
                <span>6h (Benchmark)</span>
                <span>12h</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#2E2E3A]">Target Deadline Window</label>
                <span className="text-xs font-bold text-[#1B5E5A] tabular-nums">Within {deadlineHours}h</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                step="1"
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(parseInt(e.target.value))}
                className="w-full accent-[#1B5E5A]"
              />
              <div className="flex justify-between text-[10px] text-[#2E2E3A]/40 mt-1">
                <span>4h</span>
                <span>8h (Before 8 AM)</span>
                <span>16h</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2E2E3A] block mb-1.5">Hard Budget Cap</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2E2E3A]/40">$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-[#E9E7F2] rounded-xl text-xs font-bold text-[#2E2E3A] focus:outline-none focus:ring-2 focus:ring-[#7FB892]"
                />
              </div>
              <span className="text-[10px] text-[#2E2E3A]/50 mt-1 block">Simulated GPU @ $75/hour</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2E2E3A] block mb-1.5">Grid Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E9E7F2] rounded-xl text-xs font-semibold text-[#2E2E3A] focus:outline-none focus:ring-2 focus:ring-[#7FB892]"
              >
                <option value="EU-NORTH">Europe North (Stockholm - 42 gCO₂)</option>
                <option value="US-WEST">US West (Oregon Hydro - 88 gCO₂)</option>
                <option value="EU-WEST">Europe West (Frankfurt - 115 gCO₂)</option>
                <option value="IN">India (IN Grid - Dynamic Solar/Wind)</option>
                <option value="ASIA-EAST">Asia East (Tokyo - 215 gCO₂)</option>
                <option value="US-EAST">US East (PJM / Virginia - 265 gCO₂)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2E2E3A] block mb-1.5">Carbon Optimization Priority</label>
              <div className="grid grid-cols-3 gap-1 bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2]">
                {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCarbonPriority(p)}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                      carbonPriority === p ? 'bg-[#1B5E5A] text-white shadow-xs' : 'text-[#2E2E3A]/60'
                    }`}
                  >
                    {p === 'HIGH' ? 'Greener' : p === 'MEDIUM' ? 'Balanced' : 'Cheapest'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Strategy & Checkpoint Configuration Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#2E2E3A]/70 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#1B5E5A]" />
                <span>Strategy & Checkpoint Configuration</span>
              </label>
              <span className="text-[11px] font-semibold text-[#2E2E3A]/50">
                Screen 1 Controls
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Checkpoint Capabilities */}
              <div
                className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                  checkpointCapable
                    ? 'bg-[#DFF3E7]/30 border-[#7FB892]/50 shadow-xs'
                    : 'bg-[#F7F5EE] border-[#E9E7F2]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          checkpointCapable ? 'bg-[#1B5E5A] text-white' : 'bg-[#E9E7F2] text-[#2E2E3A]/60'
                        }`}
                      >
                        {checkpointCapable ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <ShieldAlert className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2E2E3A]">Checkpoint Capabilities</div>
                        <div className="text-[10px] text-[#2E2E3A]/60">State snapshotting & pause support</div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCheckpoint(!checkpointCapable)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        checkpointCapable ? 'bg-[#1B5E5A]' : 'bg-[#D1D5DB]'
                      }`}
                      aria-label="Toggle Checkpoint Capabilities"
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          checkpointCapable ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#2E2E3A]/70 leading-relaxed mt-2">
                    Allows state suspension with 15m save/restore overhead. Turning this off automatically turns off
                    the Fragmented Strategy switch and restricts Deterministic Strategy Evaluation to continuous execution.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E9E7F2] flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-[#2E2E3A]/60">Checkpoint Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      checkpointCapable
                        ? 'bg-[#DFF3E7] text-[#1B5E5A]'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {checkpointCapable ? 'Enabled (Checkpointable)' : 'Disabled (Continuous Only)'}
                  </span>
                </div>
              </div>

              {/* Option 2: Fragmented Strategy Switch */}
              <div
                className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                  !checkpointCapable
                    ? 'bg-gray-100/70 border-gray-200 opacity-60'
                    : fragmentedStrategyEnabled
                    ? 'bg-[#DFF3E7]/30 border-[#7FB892]/50 shadow-xs'
                    : 'bg-[#F7F5EE] border-[#E9E7F2]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          checkpointCapable && fragmentedStrategyEnabled
                            ? 'bg-[#1B5E5A] text-white'
                            : 'bg-[#E9E7F2] text-[#2E2E3A]/60'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2E2E3A]">Fragmented Strategy Switch</div>
                        <div className="text-[10px] text-[#2E2E3A]/60">Multi-window split execution</div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <button
                      type="button"
                      disabled={!checkpointCapable}
                      onClick={() => handleToggleFragmentedStrategy(!fragmentedStrategyEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                        !checkpointCapable
                          ? 'bg-gray-300 cursor-not-allowed'
                          : fragmentedStrategyEnabled
                          ? 'bg-[#1B5E5A] cursor-pointer'
                          : 'bg-[#D1D5DB] cursor-pointer'
                      }`}
                      aria-label="Toggle Fragmented Strategy Switch"
                      title={!checkpointCapable ? 'Requires Checkpoint Capabilities Enabled' : undefined}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          checkpointCapable && fragmentedStrategyEnabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#2E2E3A]/70 leading-relaxed mt-2">
                    Splits runtime across disjoint low-carbon windows. When Checkpoint Capabilities is
                    turned off, this switch is automatically turned off and locked.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E9E7F2] flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-[#2E2E3A]/60">Fragmented Strategy State:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      !checkpointCapable
                        ? 'bg-red-100 text-red-700'
                        : fragmentedStrategyEnabled
                        ? 'bg-[#DFF3E7] text-[#1B5E5A]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {!checkpointCapable
                      ? 'Turned Off (Checkpoint Disabled)'
                      : fragmentedStrategyEnabled
                      ? 'Enabled (Evaluated in Screen 3)'
                      : 'Turned Off'}
                  </span>
                </div>
              </div>
            </div>

            {/* Option 3: Deterministic Strategy Evaluation Scope Banner */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                checkpointCapable && fragmentedStrategyEnabled
                  ? 'bg-white border-[#7FB892]/40 text-[#1B5E5A]'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-4 h-4 shrink-0 text-[#1B5E5A]" />
                <div>
                  <span className="font-bold">Deterministic Strategy Evaluation:</span>{' '}
                  <span className="font-normal text-[#2E2E3A]/80">
                    {checkpointCapable && fragmentedStrategyEnabled
                      ? 'Full Evaluation Scope: Scoring RUN NOW, DELAY, and FRAGMENT strategies.'
                      : 'Restricted Evaluation Scope: FRAGMENT option turned off. Evaluating RUN NOW and DELAY continuous strategies only.'}
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 uppercase tracking-wide ${
                  checkpointCapable && fragmentedStrategyEnabled
                    ? 'bg-[#DFF3E7] text-[#1B5E5A]'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {checkpointCapable && fragmentedStrategyEnabled
                  ? '3 Strategies Active'
                  : '2 Strategies Active (No Fragment)'}
              </span>
            </div>
          </div>

          {/* Screen 1 Action */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleRunAgentExtraction}
              className="flex items-center gap-2 px-6 py-3 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all shadow-md cursor-pointer"
            >
              <span>Validate & Extract Constraints with AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 2: AGENT ANALYSIS */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Screen 2: Agent Analysis & Validated Constraints</span>
              </div>
              <h3 className="text-xl font-bold text-[#2E2E3A]">LLM Natural-Language Constraint Extraction</h3>
              <p className="text-xs text-[#2E2E3A]/70 mt-1">
                The AI Agent processed your instructions and extracted structured operational boundaries.
              </p>
            </div>

            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E9E7F2] text-xs font-semibold text-[#1B5E5A] hover:bg-[#DFF3E7]/50 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showJson ? 'Hide Structured JSON' : 'View Structured JSON'}</span>
            </button>
          </div>

          {/* Status Indicator Badges Grid matching PDF Screen 2 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
              <div className="text-[11px] font-bold text-[#2E2E3A]/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1B5E5A]" /> Runtime Extracted
              </div>
              <div className="text-lg font-extrabold text-[#2E2E3A] mt-1 tabular-nums">{runtimeHours} Hours</div>
              <div className="text-[10px] text-[#2E2E3A]/50">Continuous compute required</div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
              <div className="text-[11px] font-bold text-[#2E2E3A]/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1B5E5A]" /> Deadline Extracted
              </div>
              <div className="text-lg font-extrabold text-[#2E2E3A] mt-1 tabular-nums">Before 8:00 AM</div>
              <div className="text-[10px] text-[#2E2E3A]/50">Total 8h window ({deadlineHours - runtimeHours}h slack)</div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
              <div className="text-[11px] font-bold text-[#2E2E3A]/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1B5E5A]" /> Budget Extracted
              </div>
              <div className="text-lg font-extrabold text-[#2E2E3A] mt-1 tabular-nums">${budget} Cap</div>
              <div className="text-[10px] text-[#2E2E3A]/50">GPU_SIM @ $75/hour rate</div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
              <div className="text-[11px] font-bold text-[#2E2E3A]/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1B5E5A]" /> Carbon Preference
              </div>
              <div className="text-lg font-extrabold text-[#1B5E5A] mt-1">High (Carbon Preferred)</div>
              <div className="text-[10px] text-[#2E2E3A]/50">Prioritize lowest emissions</div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
              <div className="text-[11px] font-bold text-[#2E2E3A]/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1B5E5A]" /> Checkpoint & Strategy State
              </div>
              <div
                className={`text-lg font-extrabold mt-1 ${
                  checkpointCapable && fragmentedStrategyEnabled ? 'text-[#2E2E3A]' : 'text-amber-700'
                }`}
              >
                {!checkpointCapable
                  ? 'Checkpoint Disabled'
                  : !fragmentedStrategyEnabled
                  ? 'Fragment Switch Off'
                  : 'Enabled (15m model)'}
              </div>
              <div className="text-[10px] text-[#2E2E3A]/50">
                {!checkpointCapable || !fragmentedStrategyEnabled
                  ? 'Strategy 3 (FRAGMENT) disabled'
                  : 'Supports state suspension'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
              <div className="text-[11px] font-bold text-[#2E2E3A]/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1B5E5A]" /> Region Extracted
              </div>
              <div className="text-lg font-extrabold text-[#2E2E3A] mt-1">
                {region === 'IN' ? 'India (IN)' : region}
              </div>
              <div className="text-[10px] text-[#2E2E3A]/50">Forecast dataset mapped</div>
            </div>
          </div>

          {/* AI Reasoning Box */}
          <div className="p-5 rounded-xl bg-[#DFF3E7]/40 border border-[#7FB892]/40 text-[#1B5E5A]">
            <div className="flex items-center gap-2 font-bold text-xs mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Agent Synthesis & Optimization Opportunity</span>
            </div>
            <p className="text-xs text-[#2E2E3A] leading-relaxed">
              {extractedData?.reasoning ||
                `The AI Agent identified a ${runtimeHours}-hour ${workloadType} task with an 8-hour window (2 hours of deadline slack). Checkpoint capability is active, enabling the Fragmentation Engine to avoid peak dirty grid hours (17:00-19:00) by splitting compute across green solar and wind windows.`}
            </p>
          </div>

          {/* Structured JSON Output Viewer */}
          {showJson && (
            <div className="p-4 rounded-xl bg-[#2E2E3A] text-[#DFF3E7] font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(extractedData || { runtimeHours, deadlineHours, budget, carbonPriority, checkpointCapable, region }, null, 2)}</pre>
            </div>
          )}

          {/* Screen 2 Actions */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-[#E9E7F2] text-xs font-semibold text-[#2E2E3A]/70 rounded-xl hover:bg-[#F7F5EE] cursor-pointer"
            >
              ← Back to Setup
            </button>
            <button
              onClick={handleProceedToStrategies}
              className="flex items-center gap-2 px-6 py-3 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all shadow-md cursor-pointer"
            >
              <span>
                {checkpointCapable && fragmentedStrategyEnabled
                  ? 'Evaluate RUN / DELAY / FRAGMENT Strategies'
                  : 'Evaluate RUN / DELAY Strategies (Fragment Disabled)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 3: STRATEGY COMPARISON */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 3 && strategies && (
        <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Screen 3: Deterministic Strategy Evaluation</span>
            </div>
            <h3 className="text-xl font-bold text-[#2E2E3A]">
              {checkpointCapable && fragmentedStrategyEnabled
                ? 'Compare RUN NOW, DELAY, and FRAGMENT'
                : 'Compare RUN NOW and DELAY (FRAGMENT Turned Off)'}
            </h3>
            <p className="text-xs text-[#2E2E3A]/70 mt-1">
              Deterministic code tested all hard constraints (deadline &lt;= 8h, cost &lt;= $600) and evaluated carbon reduction.
            </p>
          </div>

          {/* 3 Strategy Cards matching PDF section 11 & 13 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: RUN NOW */}
            <div
              onClick={() => setSelectedStrategy('RUN')}
              className={`rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedStrategy === 'RUN'
                  ? 'border-[#1B5E5A] bg-[#F7F5EE] shadow-md ring-2 ring-[#1B5E5A]/20'
                  : 'border-[#E9E7F2] bg-white hover:border-[#7FB892]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2E2E3A]/60">Strategy 1</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9E7F2] text-[#2E2E3A]/70">Baseline</span>
                </div>
                <h4 className="text-lg font-extrabold text-[#2E2E3A]">{strategies.RUN.name}</h4>
                <p className="text-xs text-[#2E2E3A]/60 mt-1">{strategies.RUN.tagline}</p>

                <div className="my-5 space-y-3 pt-4 border-t border-[#E9E7F2]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Carbon Emitted:</span>
                    <span className="text-base font-extrabold text-[#2E2E3A] tabular-nums">{strategies.RUN.carbonGrams} g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Simulated Cost:</span>
                    <span className="text-base font-extrabold text-[#2E2E3A] tabular-nums">${strategies.RUN.costDollars}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Estimated Finish:</span>
                    <span className="text-sm font-bold text-[#2E2E3A] tabular-nums">{strategies.RUN.finishTimeFormatted}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="p-3 rounded-xl bg-white border border-[#E9E7F2] text-[11px] text-[#2E2E3A]/70">
                  {strategies.RUN.feasibilityReason}
                </div>
                <button
                  className={`w-full mt-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    selectedStrategy === 'RUN' ? 'bg-[#1B5E5A] text-white' : 'bg-[#E9E7F2] text-[#2E2E3A]'
                  }`}
                >
                  {selectedStrategy === 'RUN' ? 'Selected Strategy' : 'Select Strategy'}
                </button>
              </div>
            </div>

            {/* Card 2: DELAY */}
            <div
              onClick={() => setSelectedStrategy('DELAY')}
              className={`rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedStrategy === 'DELAY'
                  ? 'border-[#1B5E5A] bg-[#F7F5EE] shadow-md ring-2 ring-[#1B5E5A]/20'
                  : 'border-[#E9E7F2] bg-white hover:border-[#7FB892]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2E2E3A]/60">Strategy 2</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFF3E7] text-[#1B5E5A]">
                    Saves {strategies.DELAY.carbonSavedPercent}% CO₂
                  </span>
                </div>
                <h4 className="text-lg font-extrabold text-[#2E2E3A]">{strategies.DELAY.name}</h4>
                <p className="text-xs text-[#2E2E3A]/60 mt-1">{strategies.DELAY.tagline}</p>

                <div className="my-5 space-y-3 pt-4 border-t border-[#E9E7F2]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Carbon Emitted:</span>
                    <span className="text-base font-extrabold text-[#1B5E5A] tabular-nums">{strategies.DELAY.carbonGrams} g</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Simulated Cost:</span>
                    <span className="text-base font-extrabold text-[#2E2E3A] tabular-nums">${strategies.DELAY.costDollars}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Estimated Finish:</span>
                    <span className="text-sm font-bold text-[#2E2E3A] tabular-nums">{strategies.DELAY.finishTimeFormatted}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="p-3 rounded-xl bg-white border border-[#E9E7F2] text-[11px] text-[#2E2E3A]/70">
                  {strategies.DELAY.feasibilityReason}
                </div>
                <button
                  className={`w-full mt-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                    selectedStrategy === 'DELAY' ? 'bg-[#1B5E5A] text-white' : 'bg-[#E9E7F2] text-[#2E2E3A]'
                  }`}
                >
                  {selectedStrategy === 'DELAY' ? 'Selected Strategy' : 'Select Strategy'}
                </button>
              </div>
            </div>

            {/* Card 3: FRAGMENT */}
            <div
              onClick={() => {
                if (checkpointCapable && fragmentedStrategyEnabled && strategies.FRAGMENT.isFeasible) {
                  setSelectedStrategy('FRAGMENT');
                }
              }}
              className={`rounded-2xl p-6 border-2 transition-all flex flex-col justify-between relative ${
                !checkpointCapable || !fragmentedStrategyEnabled
                  ? 'border-gray-200 bg-gray-50/80 opacity-75 cursor-not-allowed select-none'
                  : selectedStrategy === 'FRAGMENT'
                  ? 'border-[#1B5E5A] bg-gradient-to-b from-[#DFF3E7]/40 to-white shadow-md ring-2 ring-[#1B5E5A]/20 cursor-pointer'
                  : 'border-[#7FB892] bg-white hover:border-[#1B5E5A] cursor-pointer'
              }`}
            >
              {checkpointCapable && fragmentedStrategyEnabled && strategies.FRAGMENT.isFeasible && (
                <div className="absolute -top-3 right-6 bg-[#1B5E5A] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#7FB892]" /> Recommended
                </div>
              )}
              {(!checkpointCapable || !fragmentedStrategyEnabled) && (
                <div className="absolute -top-3 right-6 bg-gray-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-300" />
                  {!checkpointCapable ? 'Checkpoint Disabled' : 'Fragment Switch Off'}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      !checkpointCapable || !fragmentedStrategyEnabled ? 'text-[#2E2E3A]/40' : 'text-[#1B5E5A]'
                    }`}
                  >
                    Strategy 3 (Adaptive)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      !checkpointCapable || !fragmentedStrategyEnabled
                        ? 'bg-gray-200 text-gray-700 font-semibold'
                        : 'bg-[#1B5E5A] text-white'
                    }`}
                  >
                    {!checkpointCapable
                      ? 'Checkpoint Capabilities Disabled'
                      : !fragmentedStrategyEnabled
                      ? 'Fragment Strategy Switch Turned Off'
                      : `Lowest Carbon (-${strategies.FRAGMENT.carbonSavedPercent}%)`}
                  </span>
                </div>
                <h4
                  className={`text-lg font-extrabold ${
                    !checkpointCapable || !fragmentedStrategyEnabled ? 'text-[#2E2E3A]/60' : 'text-[#1B5E5A]'
                  }`}
                >
                  {strategies.FRAGMENT.name}
                </h4>
                <p className="text-xs text-[#2E2E3A]/60 mt-1">{strategies.FRAGMENT.tagline}</p>

                <div className="my-5 space-y-3 pt-4 border-t border-[#E9E7F2]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Carbon Emitted:</span>
                    <span
                      className={`text-base font-extrabold tabular-nums ${
                        !checkpointCapable || !fragmentedStrategyEnabled ? 'text-[#2E2E3A]/60' : 'text-[#1B5E5A]'
                      }`}
                    >
                      ~{strategies.FRAGMENT.carbonGrams} g
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Simulated Cost:</span>
                    <span
                      className={`text-base font-extrabold tabular-nums ${
                        !checkpointCapable || !fragmentedStrategyEnabled ? 'text-[#2E2E3A]/60' : 'text-[#2E2E3A]'
                      }`}
                    >
                      ~${strategies.FRAGMENT.costDollars}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#2E2E3A]/70">Estimated Finish:</span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        !checkpointCapable || !fragmentedStrategyEnabled ? 'text-[#2E2E3A]/60' : 'text-[#1B5E5A]'
                      }`}
                    >
                      {strategies.FRAGMENT.finishTimeFormatted}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div
                  className={`p-3 rounded-xl border text-[11px] font-medium ${
                    !checkpointCapable || !fragmentedStrategyEnabled
                      ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                      : 'bg-white border-[#7FB892]/40 text-[#2E2E3A]/80'
                  }`}
                >
                  {!checkpointCapable
                    ? 'Choosing Strategy 3 (FRAGMENT) is disabled because Checkpoint Capabilities is turned off on Screen 1.'
                    : !fragmentedStrategyEnabled
                    ? 'Choosing Strategy 3 (FRAGMENT) is disabled because the "Fragmented Strategy Switch" is turned off on Screen 1.'
                    : strategies.FRAGMENT.feasibilityReason}
                </div>
                <button
                  type="button"
                  disabled={!checkpointCapable || !fragmentedStrategyEnabled || !strategies.FRAGMENT.isFeasible}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (checkpointCapable && fragmentedStrategyEnabled && strategies.FRAGMENT.isFeasible) {
                      setSelectedStrategy('FRAGMENT');
                    }
                  }}
                  className={`w-full mt-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    !checkpointCapable || !fragmentedStrategyEnabled || !strategies.FRAGMENT.isFeasible
                      ? 'bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed opacity-90'
                      : selectedStrategy === 'FRAGMENT'
                      ? 'bg-[#1B5E5A] text-white shadow-xs cursor-pointer'
                      : 'bg-[#7FB892] text-white cursor-pointer hover:bg-[#1B5E5A]'
                  }`}
                >
                  {!checkpointCapable
                    ? 'Disabled (Requires Checkpoint Capability)'
                    : !fragmentedStrategyEnabled
                    ? 'Disabled (Fragment Strategy Switch Off)'
                    : selectedStrategy === 'FRAGMENT'
                    ? 'Selected Strategy ✓'
                    : 'Select Strategy'}
                </button>
              </div>
            </div>
          </div>

          {/* Screen 3 Actions */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-[#E9E7F2] text-xs font-semibold text-[#2E2E3A]/70 rounded-xl hover:bg-[#F7F5EE] cursor-pointer"
            >
              ← Back to Analysis
            </button>
            <button
              onClick={handleLaunchSimulation}
              className="flex items-center gap-2 px-7 py-3 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all shadow-md cursor-pointer"
            >
              <span>Schedule & Launch Simulator ({selectedStrategy})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 4: LIVE ORCHESTRATION & SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 4 && activePlan && (
        <div className="space-y-6">
          {/* Main Simulator Control Card matching PDF Screen 4 */}
          <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Screen 4: Workload Simulator & Live Orchestration</span>
                </div>
                <h3 className="text-xl font-bold text-[#2E2E3A]">
                  Simulating: {activePlan.name} Strategy ({workloadType})
                </h3>
                <p className="text-xs text-[#2E2E3A]/70 mt-0.5">
                  Observing state sequence: RUNNING → CHECKPOINT → WAITING → RESUME → COMPLETED
                </p>
              </div>

              {/* Simulation Controls & The Key Demo Button */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Speed Controls */}
                <div className="flex items-center bg-[#F7F5EE] rounded-xl p-1 border border-[#E9E7F2]">
                  {[1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSimSpeed(speed)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        simSpeed === speed ? 'bg-[#1B5E5A] text-white shadow-xs' : 'text-[#2E2E3A]/60'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {/* Play/Pause */}
                <button
                  onClick={() => setSimStatus(simStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all cursor-pointer shadow-xs"
                >
                  {simStatus === 'RUNNING' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{simStatus === 'RUNNING' ? 'Pause' : 'Resume'}</span>
                </button>

                {/* THE KEY DEMO CONTROL: SIMULATE GRID CHANGE (PDF Section 12) */}
                <button
                  onClick={handleSimulateGridChange}
                  disabled={simulatingChange || replanCount > 0}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer ${
                    replanCount > 0
                      ? 'bg-[#E9E7F2] text-[#2E2E3A]/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#F28C7B] to-[#e07563] text-white hover:brightness-105 ring-2 ring-[#F28C7B]/40 animate-pulse'
                  }`}
                  title="Simulate sudden carbon intensity change at 17:00 (210 to 360 gCO2/kWh)"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>{simulatingChange ? 'Detecting Surge...' : 'SIMULATE GRID CHANGE'}</span>
                </button>
              </div>
            </div>

            {/* Live Progress Bar & Status Pill */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-[#2E2E3A]">Progress:</span>
                  <span className="text-[#1B5E5A] tabular-nums">{Math.round(simProgress)}%</span>
                  <span className="text-[#2E2E3A]/40">·</span>
                  <span className="text-[#2E2E3A]/60">Simulated Hour: {simCurrentHour}h / {deadlineHours}h</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#2E2E3A]/60">Active State:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      currentSegment?.type === 'RUN'
                        ? 'bg-[#DFF3E7] text-[#1B5E5A]'
                        : currentSegment?.type === 'CHECKPOINT' || currentSegment?.type === 'RESUME'
                        ? 'bg-[#F6B26B]/20 text-[#B45309]'
                        : 'bg-[#E9E7F2] text-[#2E2E3A]'
                    }`}
                  >
                    {simProgress >= 100 ? 'COMPLETED' : currentSegment?.type || 'RUNNING'}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-3 w-full bg-[#E9E7F2] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-[#1B5E5A] transition-all duration-300 rounded-full"
                  style={{ width: `${simProgress}%` }}
                />
              </div>
            </div>

            {/* Live Gantt Timeline Track matching PDF Screen 4 */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#2E2E3A]">Execution Timeline (Gantt Schedule)</span>
                <div className="flex items-center gap-4 text-[11px] font-medium text-[#2E2E3A]/60">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#1B5E5A]"></span> RUN</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#F6B26B]"></span> CHECKPOINT / RESUME</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#E9E7F2] border border-[#2E2E3A]/20"></span> WAIT (Dirty Peak)</span>
                </div>
              </div>

              {/* Segmented Timeline Bar */}
              <div className="h-14 w-full bg-[#F7F5EE] rounded-xl border border-[#E9E7F2] p-1.5 flex gap-1 relative overflow-hidden">
                {activePlan.segments.map((seg) => {
                  const widthPercent = (seg.durationHours / deadlineHours) * 100;
                  const isRun = seg.type === 'RUN';
                  const isChk = seg.type === 'CHECKPOINT' || seg.type === 'RESUME';

                  return (
                    <div
                      key={seg.id}
                      style={{ width: `${widthPercent}%` }}
                      className={`h-full rounded-lg flex flex-col justify-center px-2 transition-all relative overflow-hidden ${
                        isRun
                          ? 'bg-[#1B5E5A] text-white'
                          : isChk
                          ? 'bg-[#F6B26B] text-[#2E2E3A]'
                          : 'bg-[#E9E7F2] text-[#2E2E3A]/70'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase truncate">{seg.type}</div>
                      <div className="text-[9px] opacity-80 truncate">{seg.durationHours}h ({seg.label})</div>
                    </div>
                  );
                })}

                {/* Scrubber Needle representing current sim progress */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#F28C7B] shadow-md z-10 transition-all duration-300 pointer-events-none"
                  style={{ left: `${(simCurrentHour / deadlineHours) * 100}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F28C7B] -translate-x-[4px] -top-1 absolute" />
                </div>
              </div>

              {/* Hour Scale */}
              <div className="flex justify-between text-[10px] font-mono text-[#2E2E3A]/50 px-1">
                <span>0h (12:00)</span>
                <span>2h (14:00)</span>
                <span>4h (16:00)</span>
                <span>6h (18:00 Peak)</span>
                <span>8h (20:00 Deadline)</span>
              </div>
            </div>

            {/* Live Metrics Grid matching PDF Screen 4 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Current Carbon Intensity</div>
                <div className="text-xl font-extrabold text-[#1B5E5A] mt-1 tabular-nums">
                  {isGridSpiked && simCurrentHour >= 4 ? '360' : '140'} <span className="text-xs font-normal text-[#2E2E3A]/60">gCO₂/kWh</span>
                </div>
                <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5">
                  {isGridSpiked ? '⚠️ Spiked grid condition' : 'Clean solar valley'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Cumulative Emissions</div>
                <div className="text-xl font-extrabold text-[#2E2E3A] mt-1 tabular-nums">
                  {Math.round((simProgress / 100) * activePlan.carbonGrams)} <span className="text-xs font-normal text-[#2E2E3A]/60">/ {activePlan.carbonGrams}g</span>
                </div>
                <div className="text-[10px] text-[#1B5E5A] font-semibold mt-0.5">
                  -{activePlan.carbonSavedPercent}% vs Baseline
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Estimated Cost</div>
                <div className="text-xl font-extrabold text-[#2E2E3A] mt-1 tabular-nums">
                  ${Math.round((simProgress / 100) * activePlan.costDollars)} <span className="text-xs font-normal text-[#2E2E3A]/60">/ ${activePlan.costDollars}</span>
                </div>
                <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5">Under ${budget} cap</div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Deadline Slack</div>
                <div className="text-xl font-extrabold text-[#2E2E3A] mt-1 tabular-nums">
                  {Math.max(0, deadlineHours - activePlan.finishHour).toFixed(2)}h
                </div>
                <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5">45m safety margin</div>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Re-plan Count</div>
                <div className={`text-xl font-extrabold mt-1 tabular-nums ${replanCount > 0 ? 'text-[#F28C7B]' : 'text-[#2E2E3A]'}`}>
                  {replanCount}
                </div>
                <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5">
                  {replanCount > 0 ? 'Adaptive plan active' : 'Initial schedule'}
                </div>
              </div>
            </div>

            {/* Navigation to Screen 5 or Back */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-[#E9E7F2] text-xs font-semibold text-[#2E2E3A]/70 rounded-xl hover:bg-[#F7F5EE] cursor-pointer"
              >
                ← Back to Strategy Comparison
              </button>
              {replanCount > 0 && (
                <button
                  onClick={() => setCurrentStep(5)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all cursor-pointer shadow-md"
                >
                  <span>View Re-planning Verification (Screen 5)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 5: ADAPTIVE RE-PLANNING & VERIFICATION */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Screen 5: Adaptive Re-planning & Verification</span>
            </div>
            <h3 className="text-xl font-bold text-[#2E2E3A]">
              Grid Disturbance Detected & Schedule Adapted
            </h3>
            <p className="text-xs text-[#2E2E3A]/70 mt-1">
              Demonstrating the complete decision loop: Detect Change → Re-evaluate → Re-plan → Execute → Verify.
            </p>
          </div>

          {/* Re-planning Event Sequence Card matching PDF Section 12 */}
          <div className="p-5 rounded-2xl bg-[#1B5E5A] text-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7FB892]">
                <Zap className="w-4 h-4 fill-current text-[#F6B26B]" />
                <span>Automated Re-planning Event Trail</span>
              </div>
              <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full font-mono text-[#DFF3E7]">
                Re-plan Count: 1
              </span>
            </div>

            {/* Step Sequence Pills */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-[#7FB892] font-bold">Step 1: Disturbance</div>
                <div className="font-bold mt-1 text-white">17:00 Forecast +71%</div>
                <div className="text-[10px] text-white/70">210 → 360 gCO₂/kWh</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-[#7FB892] font-bold">Step 2: Monitor</div>
                <div className="font-bold mt-1 text-white">Threshold Exceeded</div>
                <div className="text-[10px] text-white/70">&gt;15% delta alarm fired</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-[#7FB892] font-bold">Step 3: Decision Engine</div>
                <div className="font-bold mt-1 text-white">Re-evaluation Run</div>
                <div className="text-[10px] text-white/70">Hard bounds preserved</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-[#7FB892] font-bold">Step 4: Adaptation</div>
                <div className="font-bold mt-1 text-white">Checkpoint Pause +30m</div>
                <div className="text-[10px] text-white/70">Avoids dirty 360 spike</div>
              </div>
              <div className="p-3 rounded-xl bg-[#7FB892] text-[#1B5E5A]">
                <div className="text-[10px] font-bold uppercase">Step 5: Verified</div>
                <div className="font-bold mt-1">Extra 113g CO₂ Saved</div>
                <div className="text-[10px]">Finish 7:45 AM (&lt;8 AM)</div>
              </div>
            </div>
          </div>

          {/* Before & After Timeline Comparison */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-[#2E2E3A]">Schedule Comparison (Before vs. After Adaptive Re-plan)</h4>
            
            {/* Before: Initial Schedule */}
            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#2E2E3A]/70">Initial Schedule (Pre-Spike)</span>
                <span className="text-[11px] font-bold text-[#2E2E3A]/60">Carbon: 3,003g · Finish: 7:15 AM</span>
              </div>
              <div className="h-8 w-full bg-white rounded-lg border border-[#E9E7F2] flex gap-1 p-1">
                <div className="h-full bg-[#1B5E5A] rounded text-[10px] font-bold text-white flex items-center justify-center w-[37.5%]">
                  Run (3h)
                </div>
                <div className="h-full bg-[#F6B26B] rounded text-[10px] font-bold text-[#2E2E3A] flex items-center justify-center w-[6.25%]">
                  Chk
                </div>
                <div className="h-full bg-[#E9E7F2] rounded text-[10px] font-bold text-[#2E2E3A]/60 flex items-center justify-center w-[18.75%]">
                  Wait (1.5h)
                </div>
                <div className="h-full bg-[#1B5E5A] rounded text-[10px] font-bold text-white flex items-center justify-center w-[37.5%]">
                  Run (3h)
                </div>
              </div>
            </div>

            {/* After: Adapted Schedule */}
            <div className="p-4 rounded-xl bg-[#DFF3E7]/40 border border-[#7FB892] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#1B5E5A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Adapted Schedule (Post-Spike Re-plan)
                </span>
                <span className="text-[11px] font-bold text-[#1B5E5A]">Carbon: 2,890g · Finish: 7:45 AM (Extra 113g Saved!)</span>
              </div>
              <div className="h-8 w-full bg-white rounded-lg border border-[#7FB892]/40 flex gap-1 p-1">
                <div className="h-full bg-[#1B5E5A] rounded text-[10px] font-bold text-white flex items-center justify-center w-[37.5%]">
                  Run (3h Completed)
                </div>
                <div className="h-full bg-[#F6B26B] rounded text-[10px] font-bold text-[#2E2E3A] flex items-center justify-center w-[6.25%]">
                  Chk #2
                </div>
                <div className="h-full bg-[#F28C7B]/30 border border-[#F28C7B]/40 rounded text-[10px] font-bold text-[#C53030] flex items-center justify-center w-[25%]">
                  Extended Pause (Avoid 360 Spike)
                </div>
                <div className="h-full bg-[#7FB892] rounded text-[10px] font-bold text-[#1B5E5A] flex items-center justify-center w-[31.25%]">
                  Resume in Clean Valley (3h)
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation of the Re-plan */}
          <div className="p-5 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2] text-xs space-y-1">
            <div className="font-bold text-[#1B5E5A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Agent Re-plan Justification
            </div>
            <p className="text-[#2E2E3A] leading-relaxed">
              {replanEvent?.explanation ||
                `Monitoring observed a 71.4% surge in grid carbon intensity at 17:00 (210 → 360 gCO₂/kWh). Exceeding the 15% re-evaluation threshold, the decision engine suspended execution at Checkpoint #2 and deferred the final 3h compute segment to 20:00–23:00. This protected the workload from dirty fossil generation, yielding an aggregate 14% carbon reduction compared to continuous execution while meeting the 8:00 AM hard deadline.`}
            </p>
          </div>

          {/* Final Competition Summary Box matching PDF Section 14 */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1B5E5A] to-[#144744] text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#7FB892] font-bold">Hackathon Demo Result</div>
              <h4 className="text-xl font-extrabold mt-1">Autonomous Carbon-Aware Decision Loop Verified</h4>
              <p className="text-xs text-[#DFF3E7]/80 mt-1 max-w-xl">
                Proved: Understand → Decide → Schedule → Execute → Monitor → Adapt. Zero cloud waste, maximum green energy alignment.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-2xl font-black text-[#7FB892] tabular-nums">470g</div>
                <div className="text-[10px] text-white/70">Total Carbon Saved</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-2xl font-black text-white tabular-nums">$488</div>
                <div className="text-[10px] text-white/70">Within $600 Budget</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-2xl font-black text-[#7FB892] tabular-nums">7:45 AM</div>
                <div className="text-[10px] text-white/70">Met 8 AM Deadline</div>
              </div>
            </div>
          </div>

          {/* Screen 5 Actions */}
          <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 border border-[#E9E7F2] text-xs font-semibold text-[#2E2E3A]/70 rounded-xl hover:bg-[#F7F5EE] cursor-pointer"
            >
              ← Back to Simulator
            </button>

            <div className="flex items-center gap-3">
              {onNavigateToWorkloads && (
                <button
                  onClick={onNavigateToWorkloads}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-[#7FB892] bg-[#DFF3E7] text-[#1B5E5A] text-xs font-bold rounded-xl hover:bg-[#cbeedb] transition-all cursor-pointer shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>View in Workload History →</span>
                </button>
              )}

              <button
                onClick={handleResetDemo}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Run Another Workload Scenario</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
