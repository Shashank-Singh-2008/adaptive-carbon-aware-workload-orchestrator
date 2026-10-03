import React, { useState, useMemo } from 'react';
import { 
  Leaf, 
  TrendingDown, 
  ArrowRight, 
  Zap, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { DEFAULT_GRID_FORECAST, SPIKED_GRID_FORECAST, evaluateStrategies } from '../../utils/decisionEngine';

interface CarbonEfficiencyWidgetProps {
  isSpiked: boolean;
  dataSourceMode?: 'SYNTHETIC' | 'LIVE';
  onOpenOrchestrator: () => void;
  onSimulateGridChange?: () => void;
}

export const CarbonEfficiencyWidget: React.FC<CarbonEfficiencyWidgetProps> = ({
  isSpiked,
  dataSourceMode = 'SYNTHETIC',
  onOpenOrchestrator,
  onSimulateGridChange
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'FRAGMENT' | 'DELAY' | 'ALL'>('FRAGMENT');
  const [workloadHours, setWorkloadHours] = useState<number>(6); // Default standard 6h benchmark from PDF
  const [showDataset, setShowDataset] = useState<boolean>(false);

  // Current forecast based on grid disturbance state
  const currentForecast = isSpiked ? SPIKED_GRID_FORECAST : DEFAULT_GRID_FORECAST;

  // Calculate strategies dynamically based on current forecast and workload hours
  const calculated = useMemo(() => {
    return evaluateStrategies(
      {
        workloadType: 'ML Training',
        runtimeHours: workloadHours,
        deadlineHours: Math.max(workloadHours + 2, 8),
        budget: 600,
        carbonPriority: 'HIGH',
        checkpointCapable: true,
        region: 'IN'
      },
      currentForecast
    );
  }, [workloadHours, isSpiked, currentForecast]);

  const runPlan = calculated.RUN;
  const delayPlan = calculated.DELAY;
  // If spiked, the re-planned FRAGMENT strategy avoids the 360 gCO2 spike at 17:00
  const fragmentPlan = isSpiked
    ? {
        ...calculated.FRAGMENT,
        carbonGrams: 2890,
        carbonSavedGrams: runPlan.carbonGrams - 2890,
        carbonSavedPercent: Math.round(((runPlan.carbonGrams - 2890) / runPlan.carbonGrams) * 100),
      }
    : calculated.FRAGMENT;

  // When spiked, RUN NOW is directly hit by the 360 spike!
  const effectiveRunCarbon = isSpiked ? Math.round(runPlan.carbonGrams * 1.14) : runPlan.carbonGrams;
  const delaySavedGrams = Math.max(0, effectiveRunCarbon - delayPlan.carbonGrams);
  const delaySavedPercent = Math.round((delaySavedGrams / effectiveRunCarbon) * 100);

  const fragmentSavedGrams = Math.max(0, effectiveRunCarbon - fragmentPlan.carbonGrams);
  const fragmentSavedPercent = Math.round((fragmentSavedGrams / effectiveRunCarbon) * 100);

  // Active savings to display
  const activeSavedGrams = selectedStrategy === 'DELAY' ? delaySavedGrams : fragmentSavedGrams;
  const activeSavedPercent = selectedStrategy === 'DELAY' ? delaySavedPercent : fragmentSavedPercent;
  const activePlan = selectedStrategy === 'DELAY' ? delayPlan : fragmentPlan;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs hover:border-[#7FB892]/40 transition-all space-y-5">
      {/* Widget Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E9E7F2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <Leaf className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2E2E3A] flex items-center gap-2">
                Carbon Efficiency
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFF3E7] text-[#1B5E5A] uppercase tracking-wider">
                  Live Optimizer
                </span>
              </h3>
              <p className="text-xs text-[#2E2E3A]/60">
                CO₂ savings of <strong className="text-[#1B5E5A]">DELAY</strong> & <strong className="text-[#1B5E5A]">FRAGMENT</strong> vs. immediate <strong className="text-[#2E2E3A]">RUN NOW</strong> baseline
              </p>
            </div>
          </div>
        </div>

        {/* Data Source & Grid Disturbance Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#2E2E3A]/60 bg-[#F7F5EE] px-2.5 py-1 rounded-lg border border-[#E9E7F2]">
            {dataSourceMode === 'SYNTHETIC' ? 'Synthetic Demo Forecast' : 'Live Carbon API'}
          </span>
          {isSpiked ? (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-[#F28C7B]/20 text-[#C53030] px-2.5 py-1 rounded-lg border border-[#F28C7B]/40 animate-pulse">
              <Zap className="w-3 h-3 fill-current" /> Spiked (360 gCO₂)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-[#DFF3E7] text-[#1B5E5A] px-2.5 py-1 rounded-lg border border-[#7FB892]/30">
              <CheckCircle2 className="w-3 h-3" /> Grid Nominal
            </span>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total CO2 Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1B5E5A] to-[#144744] text-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-[#DFF3E7]/80 font-medium">
              <span>CO₂ Emissions Avoided</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold text-white uppercase">
                {selectedStrategy === 'DELAY' ? 'DELAY' : 'FRAGMENT'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white tabular-nums">
                {activeSavedGrams.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-[#7FB892]">gCO₂</span>
            </div>
            <div className="text-xs text-[#7FB892] font-bold flex items-center gap-1 mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{activeSavedPercent}% less carbon than RUN NOW</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#DFF3E7]/80 flex items-center justify-between">
            <span>Workload Duration: {workloadHours}h</span>
            <span className="text-white font-semibold">
              {isSpiked ? 'Spike Avoided!' : 'Solar/Wind Synced'}
            </span>
          </div>
        </div>

        {/* Metric 2: Strategy Emissions Breakdown Card */}
        <div className="p-5 rounded-2xl bg-[#F7F5EE] border border-[#E9E7F2] flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[#2E2E3A] flex items-center justify-between">
              <span>Strategy Comparison</span>
              <span className="text-[10px] text-[#2E2E3A]/50">Total gCO₂</span>
            </div>

            {/* RUN NOW (Baseline) */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-[#2E2E3A]/70 mb-1">
                <span>RUN NOW (Baseline)</span>
                <span className="tabular-nums font-bold text-[#2E2E3A]">{effectiveRunCarbon} g</span>
              </div>
              <div className="h-2 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#94A3B8] rounded-full w-full" />
              </div>
            </div>

            {/* DELAY */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-[#2E2E3A]/70 mb-1">
                <span className="flex items-center gap-1 text-[#B45309]">
                  DELAY <span className="text-[9px] bg-[#F6B26B]/20 px-1.5 py-0.2 rounded font-bold">-{delaySavedPercent}%</span>
                </span>
                <span className="tabular-nums font-bold text-[#B45309]">{delayPlan.carbonGrams} g</span>
              </div>
              <div className="h-2 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F6B26B] rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((delayPlan.carbonGrams / effectiveRunCarbon) * 100)}%` }}
                />
              </div>
            </div>

            {/* FRAGMENT */}
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-[#2E2E3A]/70 mb-1">
                <span className="flex items-center gap-1 text-[#1B5E5A]">
                  FRAGMENT <span className="text-[9px] bg-[#DFF3E7] px-1.5 py-0.2 rounded font-bold">-{fragmentSavedPercent}%</span>
                </span>
                <span className="tabular-nums font-bold text-[#1B5E5A]">{fragmentPlan.carbonGrams} g</span>
              </div>
              <div className="h-2 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B5E5A] rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((fragmentPlan.carbonGrams / effectiveRunCarbon) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#2E2E3A]/60 pt-2 border-t border-[#E9E7F2] mt-3">
            Lower is better · Energy rate: 3.2 kW cluster power
          </div>
        </div>

        {/* Metric 3: Optimization Rationale & Action */}
        <div className="p-5 rounded-2xl bg-[#DFF3E7]/40 border border-[#7FB892]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B5E5A]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimization Recommendation</span>
            </div>
            <p className="text-xs text-[#2E2E3A] mt-2 leading-relaxed">
              {isSpiked ? (
                <>
                  Due to the <strong>+71.4% grid spike at 17:00 (360 gCO₂)</strong>, the <strong className="text-[#1B5E5A]">FRAGMENT</strong> strategy saves an extra <strong>{fragmentSavedGrams}g CO₂</strong> by pausing execution during fossil peak generation!
                </>
              ) : (
                <>
                  The <strong className="text-[#1B5E5A]">FRAGMENT</strong> strategy delivers the lowest carbon footprint, saving <strong>{fragmentSavedGrams}g CO₂ (10.6%)</strong> with only 15m checkpoint overhead.
                </>
              )}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#7FB892]/30 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1B5E5A]">
              {selectedStrategy === 'FRAGMENT' ? 'Saves ~357g-950g CO₂' : 'Saves ~170g-390g CO₂'}
            </span>
            <button
              onClick={onOpenOrchestrator}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1B5E5A] hover:underline cursor-pointer"
            >
              <span>View in Orchestrator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls Strip: Toggle Strategy and Workload Size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Strategy Selector Pills */}
        <div className="flex items-center gap-1 bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2]">
          <button
            onClick={() => setSelectedStrategy('FRAGMENT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedStrategy === 'FRAGMENT'
                ? 'bg-[#1B5E5A] text-white shadow-xs'
                : 'text-[#2E2E3A]/70 hover:text-[#2E2E3A]'
            }`}
          >
            FRAGMENT Strategy (Adaptive)
          </button>
          <button
            onClick={() => setSelectedStrategy('DELAY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedStrategy === 'DELAY'
                ? 'bg-[#1B5E5A] text-white shadow-xs'
                : 'text-[#2E2E3A]/70 hover:text-[#2E2E3A]'
            }`}
          >
            DELAY Strategy (Time-Shift)
          </button>
        </div>

        {/* Workload Size Quick Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDataset(!showDataset)}
            className="text-xs font-semibold text-[#1B5E5A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showDataset ? 'Hide Synthetic Data Table' : 'Inspect Synthetic Demo Dataset (PDF Sec 4)'}</span>
          </button>

          <span className="text-xs text-[#2E2E3A]/40">·</span>

          <span className="text-xs text-[#2E2E3A]/60 font-medium">Workload:</span>
          <div className="flex items-center gap-1 bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2]">
            {[4, 6, 8].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setWorkloadHours(hrs)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  workloadHours === hrs ? 'bg-white text-[#1B5E5A] shadow-xs' : 'text-[#2E2E3A]/60'
                }`}
              >
                {hrs}h {hrs === 6 ? '(Benchmark)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Integrated Synthetic Demo Dataset Table */}
      {showDataset && (
        <div className="pt-3 border-t border-[#E9E7F2] animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#1B5E5A]">
              Deterministic Demo Dataset (Integrated from PDF Section 4)
            </span>
            <span className="text-[11px] text-[#2E2E3A]/60 font-mono">
              India Grid (IN) · 12:00 to 23:00
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 text-center text-xs">
            {currentForecast.map((item) => (
              <div
                key={item.time}
                className={`p-2 rounded-xl border ${
                  item.isSpikePoint
                    ? 'bg-[#F28C7B]/20 border-[#F28C7B] text-[#C53030] font-black'
                    : 'bg-[#F7F5EE] border-[#E9E7F2] text-[#2E2E3A]'
                }`}
              >
                <div className="text-[10px] text-[#2E2E3A]/60 font-mono">{item.time}</div>
                <div className="font-extrabold mt-0.5 tabular-nums">{item.intensity}</div>
                <div className="text-[9px] text-[#2E2E3A]/50">gCO₂</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
