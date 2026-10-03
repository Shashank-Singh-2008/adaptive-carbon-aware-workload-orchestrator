import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  Globe, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Server, 
  ShieldCheck, 
  DollarSign, 
  Leaf,
  Navigation,
  Compass
} from 'lucide-react';

export interface RegionCarbonData {
  id: string;
  name: string;
  code: string;
  location: string;
  intensity: number; // gCO2/kWh
  renewablePct: number;
  gpuCostPerHour: number;
  availableGpus: number;
  latencyMs: number;
  carbonGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  isCurrent?: boolean;
  isRecommended?: boolean;
}

interface RegionalCarbonMapProps {
  onRouteWorkload?: (regionCode: string) => void;
  onOpenOrchestrator: () => void;
  isSpiked: boolean;
}

export const RegionalCarbonMap: React.FC<RegionalCarbonMapProps> = ({
  onRouteWorkload,
  onOpenOrchestrator,
  isSpiked
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'intensity' | 'renewablePct'>('intensity');
  const [activeRegionId, setActiveRegionId] = useState<string>('eu-north');
  const [routedNotification, setRoutedNotification] = useState<string | null>(null);

  // Regional dataset calibrated to global grid intensities
  const regions: RegionCarbonData[] = [
    {
      id: 'eu-north',
      name: 'Europe North (Stockholm)',
      code: 'EU-NORTH',
      location: 'Sweden · Hydro / Wind Grid',
      intensity: 42,
      renewablePct: 94,
      gpuCostPerHour: 72,
      availableGpus: 32,
      latencyMs: 140,
      carbonGrade: 'A+',
      isRecommended: true,
    },
    {
      id: 'us-west',
      name: 'US West (Oregon)',
      code: 'US-WEST',
      location: 'The Dalles · Columbia River Hydro',
      intensity: 88,
      renewablePct: 82,
      gpuCostPerHour: 75,
      availableGpus: 48,
      latencyMs: 180,
      carbonGrade: 'A',
    },
    {
      id: 'eu-west',
      name: 'Europe West (Frankfurt)',
      code: 'EU-WEST',
      location: 'Germany · Wind & Solar Surplus',
      intensity: 115,
      renewablePct: 68,
      gpuCostPerHour: 78,
      availableGpus: 24,
      latencyMs: 120,
      carbonGrade: 'A',
    },
    {
      id: 'in-west',
      name: 'India West (Mumbai)',
      code: 'IN',
      location: 'Western Grid · Daytime Solar',
      intensity: isSpiked ? 360 : 165,
      renewablePct: isSpiked ? 14 : 38,
      gpuCostPerHour: 75,
      availableGpus: 16,
      latencyMs: 25,
      carbonGrade: isSpiked ? 'D' : 'B',
      isCurrent: true,
    },
    {
      id: 'asia-east',
      name: 'Asia East (Tokyo)',
      code: 'ASIA-EAST',
      location: 'TEPCO Grid · Nuclear / LNG',
      intensity: 215,
      renewablePct: 26,
      gpuCostPerHour: 80,
      availableGpus: 18,
      latencyMs: 95,
      carbonGrade: 'C',
    },
    {
      id: 'us-east',
      name: 'US East (N. Virginia)',
      code: 'US-EAST',
      location: 'PJM Interconnection · Gas / Coal',
      intensity: 265,
      renewablePct: 18,
      gpuCostPerHour: 74,
      availableGpus: 64,
      latencyMs: 190,
      carbonGrade: 'D',
    },
  ];

  // Sort regions by carbon intensity (lowest to highest)
  const sortedRegions = [...regions].sort((a, b) => a.intensity - b.intensity);
  const selectedRegionData = regions.find((r) => r.id === activeRegionId) || regions[0];

  const handleRouteClick = (region: RegionCarbonData) => {
    if (onRouteWorkload) onRouteWorkload(region.code);
    setRoutedNotification(`Routing target set to ${region.name} (${region.intensity} gCO₂/kWh). Transitioning to Orchestrator...`);
    setTimeout(() => {
      setRoutedNotification(null);
      onOpenOrchestrator();
    }, 1200);
  };

  // Color helper based on intensity
  const getBarColor = (intensity: number) => {
    if (intensity <= 60) return '#1B5E5A'; // Ultra clean (Stockholm)
    if (intensity <= 120) return '#7FB892'; // Clean hydro/wind (Oregon/Frankfurt)
    if (intensity <= 190) return '#F6B26B'; // Moderate (India daytime)
    return '#F28C7B'; // Dirty fossil peak (US East / Spiked IN)
  };

  const CustomMapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: RegionCarbonData = payload[0].payload;
      return (
        <div className="bg-[#2E2E3A] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs min-w-[200px]">
          <div className="flex items-center justify-between border-b border-white/15 pb-1">
            <span className="font-bold text-[#DFF3E7]">{data.name}</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">{data.code}</span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Carbon Intensity:</span>
              <span className="font-extrabold text-white tabular-nums">{data.intensity} gCO₂/kWh</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/70">Renewable Share:</span>
              <span className="text-[#7FB892] font-semibold">{data.renewablePct}%</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/70">Available GPUs:</span>
              <span className="text-white font-medium">{data.availableGpus} Nodes</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-white/70">Pricing:</span>
              <span className="text-white font-medium">${data.gpuCostPerHour}/hr</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs hover:border-[#7FB892]/40 transition-all space-y-5">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E7F2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <Globe className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2E2E3A] flex items-center gap-2">
                Regional Carbon Map & Workload Routing
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFF3E7] text-[#1B5E5A] uppercase tracking-wider">
                  Multi-Region Optimizer
                </span>
              </h3>
              <p className="text-xs text-[#2E2E3A]/60">
                Compare real-time marginal emissions across cloud data center regions to select the greenest destination
              </p>
            </div>
          </div>
        </div>

        {/* Metric Selector & Info Tag */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2] text-xs font-semibold">
            <button
              onClick={() => setSelectedMetric('intensity')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedMetric === 'intensity'
                  ? 'bg-white text-[#1B5E5A] shadow-xs'
                  : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
              }`}
            >
              Carbon Intensity (gCO₂)
            </button>
            <button
              onClick={() => setSelectedMetric('renewablePct')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedMetric === 'renewablePct'
                  ? 'bg-white text-[#1B5E5A] shadow-xs'
                  : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
              }`}
            >
              Renewables (% Share)
            </button>
          </div>
        </div>
      </div>

      {/* Toast routing alert */}
      {routedNotification && (
        <div className="p-3 bg-[#DFF3E7] border border-[#7FB892] rounded-xl text-xs font-semibold text-[#1B5E5A] flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#7FB892]" />
          <span>{routedNotification}</span>
        </div>
      )}

      {/* Main Grid: Chart on Left (2 Cols), Selected Region Decision Card on Right (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left: Recharts Horizontal Bar Chart */}
        <div className="lg:col-span-2 bg-[#F7F5EE]/60 rounded-2xl p-5 border border-[#E9E7F2] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-[#2E2E3A]">
              Regional Carbon Ranking (Lower is Cleaner)
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#2E2E3A]/60">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#1B5E5A]"></span> Ultra Clean (&lt;60g)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#7FB892]"></span> Clean (60-150g)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#F28C7B]"></span> High Carbon (&gt;200g)
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sortedRegions}
                margin={{ top: 5, right: 30, left: 45, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    setActiveRegionId(e.activePayload[0].payload.id);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E9E7F2" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#2E2E3A', opacity: 0.6 }}
                  axisLine={{ stroke: '#E9E7F2' }}
                  tickLine={false}
                  unit={selectedMetric === 'intensity' ? 'g' : '%'}
                />
                <YAxis
                  dataKey="code"
                  type="category"
                  tick={{ fontSize: 11, fill: '#2E2E3A', fontWeight: 600 }}
                  axisLine={{ stroke: '#E9E7F2' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomMapTooltip />} />

                {/* Optimal Valley Reference Line */}
                {selectedMetric === 'intensity' && (
                  <ReferenceLine
                    x={150}
                    stroke="#7FB892"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Clean Threshold (150g)',
                      position: 'top',
                      fill: '#1B5E5A',
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Bar
                  dataKey={selectedMetric === 'intensity' ? 'intensity' : 'renewablePct'}
                  radius={[0, 8, 8, 0]}
                  cursor="pointer"
                >
                  {sortedRegions.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={
                        entry.id === activeRegionId
                          ? '#1B5E5A'
                          : getBarColor(entry.intensity)
                      }
                      stroke={entry.id === activeRegionId ? '#1B5E5A' : 'none'}
                      strokeWidth={entry.id === activeRegionId ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-[#2E2E3A]/50 pt-2 flex items-center justify-between border-t border-[#E9E7F2]">
            <span>Click any regional bar to inspect and configure workload routing</span>
            <span>Live marginal emissions from regional ISO telemetry</span>
          </div>
        </div>

        {/* Right: Selected Region Decision Panel */}
        <div className="bg-[#F7F5EE] rounded-2xl p-5 border border-[#E9E7F2] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E2E3A]/60">
                Selected Destination
              </span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  selectedRegionData.carbonGrade === 'A+' || selectedRegionData.carbonGrade === 'A'
                    ? 'bg-[#DFF3E7] text-[#1B5E5A]'
                    : selectedRegionData.carbonGrade === 'B'
                    ? 'bg-[#F6B26B]/20 text-[#B45309]'
                    : 'bg-[#F28C7B]/20 text-[#C53030]'
                }`}
              >
                Grade: {selectedRegionData.carbonGrade}
              </span>
            </div>

            <h4 className="text-base font-extrabold text-[#2E2E3A] mt-1">
              {selectedRegionData.name}
            </h4>
            <div className="text-xs text-[#2E2E3A]/60 mt-0.5">
              {selectedRegionData.location}
            </div>

            {/* Key Comparison Stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 bg-white rounded-xl border border-[#E9E7F2]">
                <div className="text-[10px] font-bold text-[#2E2E3A]/50">Carbon Intensity</div>
                <div className="text-lg font-black text-[#1B5E5A] mt-0.5 tabular-nums">
                  {selectedRegionData.intensity} <span className="text-[10px] font-normal text-[#2E2E3A]/60">g/kWh</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E9E7F2]">
                <div className="text-[10px] font-bold text-[#2E2E3A]/50">Renewables</div>
                <div className="text-lg font-black text-[#7FB892] mt-0.5 tabular-nums">
                  {selectedRegionData.renewablePct}%
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E9E7F2]">
                <div className="text-[10px] font-bold text-[#2E2E3A]/50">GPU Sim Rate</div>
                <div className="text-sm font-bold text-[#2E2E3A] mt-0.5 tabular-nums">
                  ${selectedRegionData.gpuCostPerHour}/hr
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E9E7F2]">
                <div className="text-[10px] font-bold text-[#2E2E3A]/50">Network Latency</div>
                <div className="text-sm font-bold text-[#2E2E3A] mt-0.5 tabular-nums">
                  ~{selectedRegionData.latencyMs} ms
                </div>
              </div>
            </div>

            {/* Recommendation Delta */}
            <div className="mt-3 p-3 rounded-xl bg-white border border-[#E9E7F2] text-xs">
              {selectedRegionData.code === 'EU-NORTH' ? (
                <div className="text-[#1B5E5A] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#7FB892] shrink-0" />
                  <span>Optimal global target: -84% carbon vs US East!</span>
                </div>
              ) : selectedRegionData.code === 'IN' ? (
                <div className="text-[#2E2E3A] font-medium">
                  {isSpiked ? (
                    <span className="text-[#C53030] font-bold">
                      ⚠️ 17:00 grid surge active (+71%). Consider routing to EU-NORTH or delaying.
                    </span>
                  ) : (
                    <span>Home cluster region. Best network latency for local developers.</span>
                  )}
                </div>
              ) : (
                <div className="text-[#2E2E3A]/70">
                  Carbon delta: saves {Math.max(0, 265 - selectedRegionData.intensity)} gCO₂/kWh compared to high-fossil zones.
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => handleRouteClick(selectedRegionData)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1B5E5A] text-white text-xs font-bold hover:bg-[#144744] transition-all shadow-sm cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route Workload to {selectedRegionData.code} →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
