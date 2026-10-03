import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { 
  Activity, 
  RefreshCw, 
  Globe, 
  Sun, 
  Flame, 
  TrendingDown, 
  Zap, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { fetchLiveGridForecast, GridForecastResponse, HourlyCarbonData } from '../../services/carbonApiService';

interface CarbonIntensityForecastProps {
  isSpiked: boolean;
  onOpenOrchestrator?: () => void;
}

// Custom tooltip component matching the palette and card styling
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: HourlyCarbonData = payload[0].payload;
    return (
      <div className="bg-[#2E2E3A] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs space-y-1.5 min-w-[180px]">
        <div className="flex items-center justify-between border-b border-white/15 pb-1 font-mono">
          <span className="font-bold text-[#DFF3E7]">{label} (Predicted)</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
              data.isPeak
                ? 'bg-[#F28C7B] text-white'
                : data.isOptimal
                ? 'bg-[#7FB892] text-[#1B5E5A]'
                : 'bg-white/20 text-[#DFF3E7]'
            }`}
          >
            {data.isPeak ? 'Fossil Peak' : data.isOptimal ? 'Clean Valley' : 'Moderate'}
          </span>
        </div>

        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Carbon Intensity:</span>
            <span className="font-bold text-base text-white tabular-nums">
              {data.intensity} <span className="text-[10px] font-normal text-white/60">gCO₂/kWh</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/70">Renewable Share:</span>
            <span className="font-semibold text-[#7FB892] tabular-nums">
              {data.renewablePercentage}%
            </span>
          </div>

          <div className="text-[10px] text-white/50 pt-1 border-t border-white/10 flex items-center gap-1">
            {data.isOptimal ? (
              <span className="text-[#7FB892] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recommended compute window
              </span>
            ) : data.isPeak ? (
              <span className="text-[#F28C7B] font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Checkpoint & pause recommended
              </span>
            ) : (
              <span>Standard grid dispatch</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const CarbonIntensityForecast: React.FC<CarbonIntensityForecastProps> = ({
  isSpiked,
  onOpenOrchestrator
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('IN');
  const [forecast, setForecast] = useState<GridForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetchLiveGridForecast(selectedRegion, isSpiked);
      setForecast(response);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to fetch grid forecast:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRegion, isSpiked]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs hover:border-[#7FB892]/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out space-y-5">
      {/* Component Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E7F2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A]">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2E2E3A] flex items-center gap-2">
                Carbon Intensity Forecast (Next 24h)
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DFF3E7] text-[#1B5E5A] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7FB892] animate-pulse"></span>
                  Live Recharts
                </span>
              </h3>
              <p className="text-xs text-[#2E2E3A]/60">
                Hourly marginal grid emissions prediction to orchestrate compute during renewable surplus
              </p>
            </div>
          </div>
        </div>

        {/* Region Selector & Refresh Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Region Tabs */}
          <div className="flex items-center bg-[#F7F5EE] p-1 rounded-xl border border-[#E9E7F2] text-xs font-semibold">
            {[
              { id: 'IN', label: 'India (IN)' },
              { id: 'US-EAST', label: 'US-East (PJM)' },
              { id: 'EU-WEST', label: 'EU-West (DE)' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-white text-[#1B5E5A] shadow-xs'
                    : 'text-[#2E2E3A]/60 hover:text-[#2E2E3A]'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E9E7F2] text-xs font-semibold text-[#2E2E3A]/70 hover:bg-[#F7F5EE] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh grid API feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1B5E5A]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges Row */}
      {forecast && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
            <div className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">Current Grid Level</div>
            <div className="text-xl font-extrabold text-[#2E2E3A] mt-0.5 tabular-nums">
              {forecast.metrics.current} <span className="text-xs font-normal text-[#2E2E3A]/60">gCO₂/kWh</span>
            </div>
            <div className="text-[10px] text-[#1B5E5A] font-semibold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FB892]"></span> Active Feed
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#DFF3E7]/40 border border-[#7FB892]/30">
            <div className="text-[10px] font-bold uppercase text-[#1B5E5A]">Cleanest Window (Valley)</div>
            <div className="text-xl font-extrabold text-[#1B5E5A] mt-0.5 tabular-nums">
              {forecast.metrics.min.value} <span className="text-xs font-normal text-[#1B5E5A]/70">gCO₂</span>
            </div>
            <div className="text-[10px] text-[#1B5E5A] font-medium mt-0.5 flex items-center gap-1">
              <Sun className="w-3 h-3 text-[#F6B26B]" /> At {forecast.metrics.min.time} (Max Solar/Wind)
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${isSpiked ? 'bg-[#F28C7B]/15 border-[#F28C7B]/40' : 'bg-[#F7F5EE] border-[#E9E7F2]'}`}>
            <div className="text-[10px] font-bold uppercase text-[#C53030]">Dirtiest Window (Peaker Peak)</div>
            <div className="text-xl font-extrabold text-[#C53030] mt-0.5 tabular-nums">
              {forecast.metrics.max.value} <span className="text-xs font-normal text-[#C53030]/70">gCO₂</span>
            </div>
            <div className="text-[10px] text-[#C53030] font-medium mt-0.5 flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#F28C7B]" /> At {forecast.metrics.max.time} {isSpiked ? '(Spiked!)' : ''}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
            <div className="text-[10px] font-bold uppercase text-[#2E2E3A]/50">24-Hour Average</div>
            <div className="text-xl font-extrabold text-[#2E2E3A] mt-0.5 tabular-nums">
              {forecast.metrics.avg} <span className="text-xs font-normal text-[#2E2E3A]/60">gCO₂/kWh</span>
            </div>
            <div className="text-[10px] text-[#2E2E3A]/50 mt-0.5">
              Target: Execute below average
            </div>
          </div>
        </div>
      )}

      {/* Recharts Line Chart Visualization */}
      <div className="h-64 w-full pt-2 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1B5E5A]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#7FB892]" />
              <span>Fetching live grid forecast from mock API service...</span>
            </div>
          </div>
        )}

        {forecast && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecast.data}
              margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="carbonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B5E5A" stopOpacity={0.25} />
                  <stop offset="60%" stopColor="#7FB892" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#DFF3E7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E7F2" />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#2E2E3A', opacity: 0.6 }}
                axisLine={{ stroke: '#E9E7F2' }}
                tickLine={false}
                interval={2}
              />

              <YAxis
                domain={[80, isSpiked ? 390 : 310]}
                tick={{ fontSize: 10, fill: '#2E2E3A', opacity: 0.6 }}
                axisLine={{ stroke: '#E9E7F2' }}
                tickLine={false}
                unit="g"
              />

              <Tooltip content={<CustomChartTooltip />} />

              {/* Threshold Reference Line: Optimal Green Window (<150 gCO2) */}
              <ReferenceLine
                y={150}
                stroke="#7FB892"
                strokeDasharray="4 4"
                label={{
                  value: 'Optimal Valley (≤150g)',
                  position: 'insideBottomRight',
                  fill: '#1B5E5A',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Threshold Reference Line: Dirty Peaker Peak (>220 gCO2) */}
              <ReferenceLine
                y={220}
                stroke="#F28C7B"
                strokeDasharray="3 3"
                label={{
                  value: 'Peaker Threshold (>220g)',
                  position: 'insideTopRight',
                  fill: '#C53030',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Area Under Curve */}
              <Area
                type="monotone"
                dataKey="intensity"
                fill="url(#carbonAreaGradient)"
                stroke="none"
              />

              {/* Primary Line */}
              <Line
                type="monotone"
                dataKey="intensity"
                stroke="#1B5E5A"
                strokeWidth={2.8}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: '#1B5E5A',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Context Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E9E7F2] text-xs text-[#2E2E3A]/70">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1B5E5A]"></span>
            <span>Carbon Intensity Line (gCO₂/kWh)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#DFF3E7] border border-[#7FB892]"></span>
            <span>Green Dispatch Zone</span>
          </span>
        </div>

        <div className="text-[11px] text-[#2E2E3A]/50 flex items-center gap-2">
          <span>Source: {forecast?.regionName}</span>
          {lastRefreshed && <span>· Updated {lastRefreshed}</span>}
        </div>
      </div>
    </div>
  );
};
