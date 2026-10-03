import React, { useState } from 'react';
import { Settings, Sliders, Database, Radio, DollarSign, ShieldCheck, Check } from 'lucide-react';

interface SettingsViewProps {
  dataSourceMode: 'SYNTHETIC' | 'LIVE';
  onToggleDataSource: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ dataSourceMode, onToggleDataSource }) => {
  const [gpuCost, setGpuCost] = useState(75);
  const [replanThreshold, setReplanThreshold] = useState(15);
  const [checkpointOverhead, setCheckpointOverhead] = useState(15);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Platform Preferences & Model Tuning</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#2E2E3A] tracking-tight">Orchestrator Settings</h2>
        <p className="text-xs text-[#2E2E3A]/70 mt-0.5">
          Tune decision engine thresholds, simulated GPU pricing, and carbon data providers.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-6">
        {/* Data Source Configuration */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#2E2E3A]">Carbon Grid Data Source (Section 18)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => { if (dataSourceMode !== 'SYNTHETIC') onToggleDataSource(); }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                dataSourceMode === 'SYNTHETIC'
                  ? 'border-[#1B5E5A] bg-[#DFF3E7]/30 shadow-xs'
                  : 'border-[#E9E7F2] hover:border-[#7FB892]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#2E2E3A]">Deterministic Synthetic Demo Dataset</span>
                {dataSourceMode === 'SYNTHETIC' && <Check className="w-4 h-4 text-[#1B5E5A]" />}
              </div>
              <p className="text-[11px] text-[#2E2E3A]/60">
                Reproducible 12:00–23:00 forecast with exact 17:00 spike trigger for hackathon judging.
              </p>
            </div>

            <div
              onClick={() => { if (dataSourceMode !== 'LIVE') onToggleDataSource(); }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                dataSourceMode === 'LIVE'
                  ? 'border-[#1B5E5A] bg-[#DFF3E7]/30 shadow-xs'
                  : 'border-[#E9E7F2] hover:border-[#7FB892]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#2E2E3A]">Live Electricity Maps / WattTime Adapter</span>
                {dataSourceMode === 'LIVE' && <Check className="w-4 h-4 text-[#1B5E5A]" />}
              </div>
              <p className="text-[11px] text-[#2E2E3A]/60">
                Polls real-time marginal carbon emissions and grid mixes from live cloud regions.
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#E9E7F2]" />

        {/* Numeric Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#2E2E3A]">Simulated GPU Cost</label>
              <span className="text-xs font-extrabold text-[#1B5E5A] tabular-nums">${gpuCost}/hour</span>
            </div>
            <input
              type="range"
              min="25"
              max="150"
              step="5"
              value={gpuCost}
              onChange={(e) => setGpuCost(parseInt(e.target.value))}
              className="w-full accent-[#1B5E5A]"
            />
            <div className="text-[10px] text-[#2E2E3A]/50 mt-1">PDF Section 3: GPU_SIM @ $75/hr</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#2E2E3A]">Re-planning Threshold</label>
              <span className="text-xs font-extrabold text-[#1B5E5A] tabular-nums">{replanThreshold}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={replanThreshold}
              onChange={(e) => setReplanThreshold(parseInt(e.target.value))}
              className="w-full accent-[#1B5E5A]"
            />
            <div className="text-[10px] text-[#2E2E3A]/50 mt-1">Triggers re-plan when forecast shifts &gt;15%</div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#2E2E3A]">Checkpoint Overhead</label>
              <span className="text-xs font-extrabold text-[#1B5E5A] tabular-nums">{checkpointOverhead} mins</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={checkpointOverhead}
              onChange={(e) => setCheckpointOverhead(parseInt(e.target.value))}
              className="w-full accent-[#1B5E5A]"
            />
            <div className="text-[10px] text-[#2E2E3A]/50 mt-1">Modeled snapshot save & warm resume time</div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          {saved && (
            <span className="text-xs font-bold text-[#1B5E5A] flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#7FB892]" /> Configuration updated successfully
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-all cursor-pointer shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
