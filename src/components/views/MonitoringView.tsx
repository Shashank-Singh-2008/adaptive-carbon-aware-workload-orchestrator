import React, { useState } from 'react';
import { 
  Activity, 
  Zap, 
  Leaf, 
  Sun, 
  Wind, 
  Flame, 
  Layers, 
  Radio, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { DEFAULT_GRID_FORECAST, SPIKED_GRID_FORECAST } from '../../utils/decisionEngine';

interface MonitoringViewProps {
  isSpiked: boolean;
  onToggleSpike: () => void;
  dataSourceMode: 'SYNTHETIC' | 'LIVE';
  onToggleDataSource: () => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  isSpiked,
  onToggleSpike,
  dataSourceMode,
  onToggleDataSource
}) => {
  const [selectedRegion, setSelectedRegion] = useState('IN');

  const currentForecast = isSpiked ? SPIKED_GRID_FORECAST : DEFAULT_GRID_FORECAST;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Grid Telemetry & Carbon Forecasting</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#2E2E3A] tracking-tight">Real-Time Carbon Grid Monitor</h2>
          <p className="text-xs text-[#2E2E3A]/70 mt-0.5">
            Observing carbon intensity (gCO₂/kWh) and detecting material threshold shifts (&gt;15%) to trigger re-planning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDataSource}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E9E7F2] rounded-xl text-xs font-semibold text-[#1B5E5A] hover:bg-[#DFF3E7]/40 cursor-pointer shadow-2xs"
          >
            <Radio className="w-3.5 h-3.5 text-[#7FB892] animate-pulse" />
            <span>{dataSourceMode === 'SYNTHETIC' ? 'Synthetic Demo Dataset' : 'Live Electricity Maps API'}</span>
          </button>

          <button
            onClick={onToggleSpike}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isSpiked
                ? 'bg-[#F28C7B] text-white hover:bg-[#e07563] animate-pulse'
                : 'bg-[#1B5E5A] text-white hover:bg-[#144744]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isSpiked ? 'Spike Active (360 gCO₂)' : 'Trigger 17:00 Grid Surge'}</span>
          </button>
        </div>
      </div>

      {/* Grid Carbon Forecast Bar Chart Card with interactive card hover */}
      <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-[#7FB892]/50 group/card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#2E2E3A] group-hover/card:text-[#1B5E5A] transition-colors">
                24-Hour Carbon Intensity Forecast ({selectedRegion === 'IN' ? 'India - Western Grid' : selectedRegion})
              </h3>
              <span className="text-[10px] font-semibold text-[#1B5E5A] bg-[#DFF3E7] px-2 py-0.5 rounded-full border border-[#7FB892]/30 opacity-80">
                Interactive Grid
              </span>
            </div>
            <p className="text-xs text-[#2E2E3A]/60 mt-0.5">
              Deterministic benchmark values (gCO₂/kWh) from PDF technical build plan. Hover over any hour to inspect.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSpiked && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F28C7B]/20 text-[#C53030] border border-[#F28C7B]/40 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> +71.4% Surge at 17:00
              </span>
            )}
            <div className="flex bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2] text-xs font-semibold">
              <button
                onClick={() => setSelectedRegion('IN')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedRegion === 'IN' ? 'bg-white text-[#1B5E5A] shadow-xs font-bold' : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                India (IN)
              </button>
              <button
                onClick={() => setSelectedRegion('US-EAST')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedRegion === 'US-EAST' ? 'bg-white text-[#1B5E5A] shadow-xs font-bold' : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                US-East (PJM)
              </button>
              <button
                onClick={() => setSelectedRegion('EU-WEST')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedRegion === 'EU-WEST' ? 'bg-white text-[#1B5E5A] shadow-xs font-bold' : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                EU-West (DE)
              </button>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization with interactive column and bar hover */}
        <div className="h-68 flex items-end gap-2.5 sm:gap-3 pt-8 pb-2 border-b border-[#E9E7F2] px-2 relative">
          {currentForecast.map((item) => {
            // max height 360 = 100%
            const heightPercent = (item.intensity / 380) * 100;
            const isGreen = item.intensity <= 150;
            const isMid = item.intensity > 150 && item.intensity <= 220;
            const isDirty = item.intensity > 220;
            const isSpike = item.isSpikePoint;

            return (
              <div
                key={item.time}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2.5 rounded-xl py-1 px-0.5 hover:bg-[#DFF3E7]/25"
              >
                {/* Elevated Floating Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 -translate-y-1 group-hover:-translate-y-2 bg-[#2E2E3A] text-white text-[10px] py-1.5 px-2.5 rounded-lg font-mono pointer-events-none whitespace-nowrap z-30 shadow-xl border border-white/15 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSpike ? 'bg-[#F28C7B]' : isGreen ? 'bg-[#7FB892]' : isMid ? 'bg-[#F6B26B]' : 'bg-[#94A3B8]'
                    }`}
                  />
                  <span className="font-bold text-[#DFF3E7]">{item.time}:</span>
                  <span className="font-extrabold text-white">{item.intensity} gCO₂</span>
                  <span className="text-white/60 text-[9px] font-normal">
                    ({item.renewableShare}% clean)
                  </span>
                </div>

                {/* Intensity Value Label */}
                <span
                  className={`text-[10px] font-bold tabular-nums mb-1.5 transition-all duration-200 ${
                    isSpike
                      ? 'text-[#C53030] font-black scale-110 group-hover:scale-125'
                      : isGreen
                      ? 'text-[#1B5E5A] group-hover:text-[#144744] group-hover:font-extrabold group-hover:scale-115'
                      : 'text-[#2E2E3A]/70 group-hover:text-[#2E2E3A] group-hover:font-extrabold group-hover:scale-115'
                  }`}
                >
                  {item.intensity}
                </span>

                {/* Interactive Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-xl transition-all duration-300 ease-out relative shadow-xs group-hover:shadow-lg group-hover:brightness-110 origin-bottom ${
                    isSpike
                      ? 'bg-gradient-to-t from-[#F28C7B] to-[#C53030] shadow-md ring-2 ring-[#F28C7B] group-hover:ring-4'
                      : isGreen
                      ? 'bg-gradient-to-t from-[#7FB892] to-[#1B5E5A]'
                      : isMid
                      ? 'bg-gradient-to-t from-[#F6B26B] to-[#E09040]'
                      : 'bg-gradient-to-t from-[#94A3B8] to-[#64748B]'
                  }`}
                >
                  {isSpike && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#C53030] animate-ping" />
                  )}
                  {/* Subtle top gloss highlight on hover */}
                  <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>

                {/* Hour Label */}
                <span className="text-[10px] font-semibold text-[#2E2E3A]/60 group-hover:text-[#1B5E5A] group-hover:font-bold transition-colors mt-2">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#2E2E3A]/70 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#1B5E5A]"></span>
              <span>Clean Valley (&le; 150 gCO₂)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F6B26B]"></span>
              <span>Moderate (151–220 gCO₂)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#94A3B8]"></span>
              <span>Fossil Peak (&gt; 220 gCO₂)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C53030]"></span>
              <span>Spike Disturbance (360 gCO₂)</span>
            </span>
          </div>

          <div className="text-[11px] text-[#2E2E3A]/50">
            Re-planning threshold: <strong>15% material change</strong>
          </div>
        </div>

        {/* PDF Section 4 & 5 Exact Synthetic Demo Table */}
        <div className="mt-6 pt-4 border-t border-[#E9E7F2] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1B5E5A] uppercase tracking-wider bg-[#DFF3E7] px-2.5 py-0.5 rounded-full">
                PDF Section 4: Synthetic Demo Dataset (Integrated)
              </span>
              <span className="text-xs text-[#2E2E3A]/60">Deterministic values for competition demo</span>
            </div>
            <span className="text-[11px] text-[#2E2E3A]/50 font-mono">Cost: $75/hr · 3.2 kW GPU Power</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E9E7F2]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F5EE] border-b border-[#E9E7F2] text-[11px] font-bold text-[#2E2E3A]/70 uppercase">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Region</th>
                  <th className="py-2.5 px-4">Carbon Intensity</th>
                  <th className="py-2.5 px-4">Renewable Share</th>
                  <th className="py-2.5 px-4">Status & Change-Event Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E7F2]">
                {currentForecast.map((row) => (
                  <tr
                    key={row.time}
                    className={`transition-colors ${
                      row.isSpikePoint
                        ? 'bg-[#F28C7B]/15 font-bold'
                        : 'hover:bg-[#F7F5EE]/60'
                    }`}
                  >
                    <td className="py-2 px-4 font-mono font-bold text-[#2E2E3A]">{row.time}</td>
                    <td className="py-2 px-4 font-semibold text-[#1B5E5A]">IN</td>
                    <td className="py-2 px-4 tabular-nums">
                      {row.isSpikePoint ? (
                        <span className="text-[#C53030] font-black flex items-center gap-1.5">
                          <span>360 gCO₂/kWh</span>
                          <span className="text-[10px] bg-[#F28C7B]/30 text-[#C53030] px-1.5 py-0.2 rounded font-mono">
                            Spiked from 210 (+71.4%)
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-[#2E2E3A]">{row.intensity} gCO₂/kWh</span>
                      )}
                    </td>
                    <td className="py-2 px-4 tabular-nums">{row.renewableShare}%</td>
                    <td className="py-2 px-4">
                      {row.time === '17:00' ? (
                        <span className="text-xs text-[#C53030] font-semibold">
                          ⚡ Change-Event Dataset: Triggers &gt;15% monitoring re-plan
                        </span>
                      ) : row.intensity <= 150 ? (
                        <span className="text-xs text-[#1B5E5A] font-semibold">
                          Optimal green valley (low solar/wind emissions)
                        </span>
                      ) : row.intensity >= 250 ? (
                        <span className="text-xs text-[#2E2E3A]/60">
                          Dirty fossil peaker ramp
                        </span>
                      ) : (
                        <span className="text-xs text-[#2E2E3A]/50">Nominal baseline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid Mix Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B5E5A]">
            <Sun className="w-4 h-4 text-[#F6B26B]" />
            <span>Solar & Wind Ramp (12:00–16:00)</span>
          </div>
          <div className="text-2xl font-extrabold text-[#2E2E3A] tabular-nums">52% Renewable</div>
          <p className="text-xs text-[#2E2E3A]/60 leading-relaxed">
            Midday solar surplus creates optimal green windows with carbon intensity plunging to 125 gCO₂/kWh.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C53030]">
            <Flame className="w-4 h-4 text-[#F28C7B]" />
            <span>Fossil Peaker Ramp (17:00–19:00)</span>
          </div>
          <div className="text-2xl font-extrabold text-[#2E2E3A] tabular-nums">
            {isSpiked ? '360 gCO₂/kWh' : '270 gCO₂/kWh'}
          </div>
          <p className="text-xs text-[#2E2E3A]/60 leading-relaxed">
            Evening lighting and cooling demand spikes fossil fuel generation. Workload orchestrator pauses compute during this period.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E9E7F2] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B5E5A]">
            <Wind className="w-4 h-4 text-[#7FB892]" />
            <span>Night Wind Valley (21:00–23:00)</span>
          </div>
          <div className="text-2xl font-extrabold text-[#2E2E3A] tabular-nums">120 gCO₂/kWh</div>
          <p className="text-xs text-[#2E2E3A]/60 leading-relaxed">
            Steady nighttime wind power drives clean baseload electricity, ideal for resumed checkpoint chunks.
          </p>
        </div>
      </div>
    </div>
  );
};
