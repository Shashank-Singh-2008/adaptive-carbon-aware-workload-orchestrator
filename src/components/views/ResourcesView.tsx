import React from 'react';
import { Server, Cpu, HardDrive, Zap, CheckCircle2, ShieldAlert, Leaf } from 'lucide-react';

export const ResourcesView: React.FC = () => {
  const nodes = [
    {
      id: 'Node-01',
      name: 'Primary ML Cluster Alpha',
      accelerators: '8x NVIDIA A100-SXM4-80GB',
      gpuUtil: 68,
      vramUsed: '420 / 640 GB',
      cpuUtil: 74,
      ramUtil: 62,
      powerDraw: '2.8 kW',
      state: 'Active',
      carbonPolicy: 'Adaptive Throttled',
      assignedJob: 'task-133 (LLM Quantization)',
    },
    {
      id: 'Node-02',
      name: 'Batch Inference Cluster Beta',
      accelerators: '4x NVIDIA H100 NVL',
      gpuUtil: 38,
      vramUsed: '190 / 376 GB',
      cpuUtil: 45,
      ramUtil: 51,
      powerDraw: '1.9 kW',
      state: 'Active',
      carbonPolicy: 'Normal',
      assignedJob: 'task-131 (BERT Embeddings)',
    },
    {
      id: 'Node-03',
      name: 'ETL & Data Transform Node',
      accelerators: 'CPU Optimized (AMD EPYC 9654)',
      gpuUtil: 0,
      vramUsed: 'N/A',
      cpuUtil: 88,
      ramUtil: 79,
      powerDraw: '0.9 kW',
      state: 'Active',
      carbonPolicy: 'Normal',
      assignedJob: 'task-128 (Data Processing)',
    },
    {
      id: 'Node-04',
      name: 'Checkpoint & Recovery Node',
      accelerators: '2x NVIDIA L4',
      gpuUtil: 12,
      vramUsed: '18 / 48 GB',
      cpuUtil: 22,
      ramUtil: 30,
      powerDraw: '0.4 kW',
      state: 'Standby',
      carbonPolicy: 'Deep Sleep Mode',
      assignedJob: 'Idle (Awaiting Task-129)',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
            <Server className="w-3.5 h-3.5" />
            <span>Infrastructure & Node Telemetry</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#2E2E3A] tracking-tight">Compute Cluster Resources</h2>
          <p className="text-xs text-[#2E2E3A]/70 mt-0.5">
            Real-time node telemetry and automated power modulation linked to the decision engine.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#DFF3E7] text-[#1B5E5A] px-4 py-2 rounded-xl text-xs font-bold">
          <Leaf className="w-4 h-4 text-[#7FB892]" />
          <span>Carbon-Aware Scheduling: ACTIVE</span>
        </div>
      </div>

      {/* Cluster Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="bg-white rounded-2xl p-6 border border-[#E9E7F2] shadow-xs hover:border-[#7FB892] transition-all space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E9E7F2] pb-3">
              <div>
                <div className="text-sm font-extrabold text-[#2E2E3A]">{node.id} · {node.name}</div>
                <div className="text-xs text-[#2E2E3A]/60 font-mono mt-0.5">{node.accelerators}</div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#DFF3E7] text-[#1B5E5A]">
                {node.state}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] text-[#2E2E3A]/50 font-bold uppercase">GPU Load</div>
                <div className="text-lg font-extrabold text-[#1B5E5A] mt-1 tabular-nums">{node.gpuUtil}%</div>
                <div className="text-[10px] text-[#2E2E3A]/60 mt-0.5 truncate">{node.vramUsed}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] text-[#2E2E3A]/50 font-bold uppercase">CPU Load</div>
                <div className="text-lg font-extrabold text-[#2E2E3A] mt-1 tabular-nums">{node.cpuUtil}%</div>
                <div className="text-[10px] text-[#2E2E3A]/60 mt-0.5">RAM: {node.ramUtil}%</div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="text-[10px] text-[#2E2E3A]/50 font-bold uppercase">Power Draw</div>
                <div className="text-lg font-extrabold text-[#2E2E3A] mt-1 tabular-nums">{node.powerDraw}</div>
                <div className="text-[10px] text-[#2E2E3A]/60 mt-0.5">{node.carbonPolicy}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#2E2E3A]/70 pt-1">
              <span className="truncate">
                Running: <strong className="text-[#2E2E3A]">{node.assignedJob}</strong>
              </span>
              <span className="text-[#1B5E5A] font-bold text-[11px]">Healthy · 48°C</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
