import React from 'react';
import { BarChart3, TrendingDown, DollarSign, Leaf, Award, CheckCircle2, Trees } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Impact Analytics & Emission Savings</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#2E2E3A] tracking-tight">Carbon & Cost Intelligence</h2>
          <p className="text-xs text-[#2E2E3A]/70 mt-0.5">
            Aggregated carbon mitigation, budget preservation, and strategy distribution across 128 workloads.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#DFF3E7] text-[#1B5E5A] px-4 py-2 rounded-xl text-xs font-bold">
          <Award className="w-4 h-4 text-[#7FB892]" />
          <span>Sustainability Tier: Carbon-Leader</span>
        </div>
      </div>

      {/* Top Score & Savings Cards Row (Inspired by Pic 2 & 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Carbon Rating Badge Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#E9E7F2" strokeWidth="6" fill="transparent" />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#1B5E5A"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - 0.88)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-extrabold text-xl text-[#1B5E5A]">A+</span>
              <span className="text-[9px] uppercase font-bold text-[#2E2E3A]/50">Score</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#2E2E3A]/60">Orchestrator Carbon Grade</div>
            <div className="text-lg font-extrabold text-[#1B5E5A]">Top 5% Eco-Efficiency</div>
            <p className="text-[11px] text-[#2E2E3A]/70 mt-1">
              88% of workloads executed in optimal low-carbon grid windows.
            </p>
          </div>
        </div>

        {/* Total Emissions Avoided */}
        <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E2E3A]/60">Total Emissions Avoided</span>
            <span className="p-2 rounded-xl bg-[#DFF3E7] text-[#1B5E5A]">
              <Leaf className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#1B5E5A] tabular-nums tracking-tight">
            8,309.4 <span className="text-sm font-semibold text-[#2E2E3A]/60">kgCO₂e</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#1B5E5A] font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-23.4% reduction vs immediate baseline</span>
          </div>
        </div>

        {/* Tree & Solar Equivalent */}
        <div className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E2E3A]/60">Ecological Equivalent</span>
            <span className="p-2 rounded-xl bg-[#DFF3E7] text-[#1B5E5A]">
              <Trees className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[#2E2E3A] tabular-nums tracking-tight">
            548 <span className="text-sm font-semibold text-[#2E2E3A]/60">Trees Planted</span>
          </div>
          <div className="text-xs text-[#2E2E3A]/60">
            Equivalent carbon absorption across 12 months.
          </div>
        </div>
      </div>

      {/* Strategy Breakdown Card */}
      <div className="bg-white rounded-2xl p-7 border border-[#E9E7F2] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#2E2E3A]">Autonomous Strategy Allocation (128 Workloads)</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#1B5E5A]">FRAGMENT Strategy (Adaptive Checkpointing)</span>
              <span className="tabular-nums">68% (87 Workloads) · Lowest Carbon</span>
            </div>
            <div className="h-3 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
              <div className="h-full bg-[#1B5E5A] rounded-full" style={{ width: '68%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#B45309]">DELAY Strategy (Time-Shifted Window)</span>
              <span className="tabular-nums">22% (28 Workloads) · Non-checkpointable</span>
            </div>
            <div className="h-3 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
              <div className="h-full bg-[#F6B26B] rounded-full" style={{ width: '22%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[#2E2E3A]/70">RUN NOW (Tight Deadline Priority)</span>
              <span className="tabular-nums">10% (13 Workloads) · Hard Slack Bounds</span>
            </div>
            <div className="h-3 w-full bg-[#E9E7F2] rounded-full overflow-hidden">
              <div className="h-full bg-[#94A3B8] rounded-full" style={{ width: '10%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
