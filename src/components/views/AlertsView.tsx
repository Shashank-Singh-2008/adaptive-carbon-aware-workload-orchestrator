import React from 'react';
import { Bell, Zap, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AlertsViewProps {
  isSpiked: boolean;
  replanCount: number;
  onOpenOrchestrator: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ isSpiked, replanCount, onOpenOrchestrator }) => {
  const alerts = [
    ...(isSpiked || replanCount > 0
      ? [
          {
            id: 'alert-spk-1',
            type: 'CRITICAL',
            title: 'Grid Carbon Surge Exceeded 15% Threshold',
            desc: '17:00 forecast spiked from 210 to 360 gCO₂/kWh (+71.4%). Decision engine triggered automated workload re-planning.',
            time: 'Just now',
            action: 'Inspect Re-plan',
            highlight: true,
          },
        ]
      : []),
    {
      id: 'alert-chk-1',
      type: 'INFO',
      title: 'State Checkpoint Saved for Task #128',
      desc: 'Checkpointed 3h compute state to NVMe storage. Zero data loss during grid pause.',
      time: '12m ago',
    },
    {
      id: 'alert-nod-1',
      type: 'INFO',
      title: 'Node-04 Power Modulation Engaged',
      desc: 'Cluster Node-04 entered low-power standby during high fossil dispatch window.',
      time: '45m ago',
    },
    {
      id: 'alert-opt-1',
      type: 'SUCCESS',
      title: 'Optimal Solar Window Opened',
      desc: 'India Western Grid renewable generation reached 52%. All scheduled batch inference tasks resumed.',
      time: '1h 10m ago',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] mb-2">
          <Bell className="w-3.5 h-3.5" />
          <span>Automated Orchestrator Notifications</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#2E2E3A] tracking-tight">System & Grid Alerts</h2>
        <p className="text-xs text-[#2E2E3A]/70 mt-0.5">
          Real-time event logging from the monitoring service and decision engine.
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
              alert.highlight
                ? 'bg-[#F28C7B]/10 border-[#F28C7B] shadow-xs'
                : 'bg-white border-[#E9E7F2] shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.type === 'CRITICAL'
                    ? 'bg-[#F28C7B] text-white'
                    : alert.type === 'SUCCESS'
                    ? 'bg-[#1B5E5A] text-white'
                    : 'bg-[#DFF3E7] text-[#1B5E5A]'
                }`}
              >
                {alert.type === 'CRITICAL' ? (
                  <Zap className="w-4 h-4 fill-current" />
                ) : alert.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="text-sm font-bold text-[#2E2E3A] flex items-center gap-2">
                  <span>{alert.title}</span>
                  <span className="text-[11px] text-[#2E2E3A]/40 font-normal">· {alert.time}</span>
                </div>
                <p className="text-xs text-[#2E2E3A]/70 mt-1 max-w-2xl leading-relaxed">{alert.desc}</p>
              </div>
            </div>

            {alert.action && (
              <button
                onClick={onOpenOrchestrator}
                className="px-4 py-2 bg-[#1B5E5A] text-white text-xs font-bold rounded-xl hover:bg-[#144744] transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {alert.action} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
