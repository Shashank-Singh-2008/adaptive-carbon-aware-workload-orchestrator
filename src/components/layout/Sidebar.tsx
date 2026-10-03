import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  Server, 
  Activity, 
  Bell, 
  BarChart3, 
  Settings, 
  Leaf,
  Sparkles,
  LogIn
} from 'lucide-react';

export type NavItem = 
  | 'dashboard' 
  | 'workloads' 
  | 'orchestrator' 
  | 'resources' 
  | 'monitoring' 
  | 'alerts' 
  | 'analytics' 
  | 'settings';

interface SidebarProps {
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
  replanCount: number;
  onOpenLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, replanCount, onOpenLogin }) => {
  const menuItems = [
    { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workloads' as NavItem, label: 'Workloads', icon: Layers, badge: '12' },
    { id: 'orchestrator' as NavItem, label: 'Orchestrator', icon: Cpu, isHighlight: true, badge: replanCount > 0 ? `+${replanCount}` : 'P0 Demo' },
    { id: 'resources' as NavItem, label: 'Resources', icon: Server },
    { id: 'monitoring' as NavItem, label: 'Monitoring', icon: Activity },
    { id: 'alerts' as NavItem, label: 'Alerts', icon: Bell, badge: replanCount > 0 ? '1' : undefined },
    { id: 'analytics' as NavItem, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#1B5E5A] text-white flex flex-col justify-between shrink-0 select-none shadow-xl min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A] shadow-inner">
              <Leaf className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                Workload
                <span className="text-[#7FB892] font-semibold text-xs bg-white/10 px-1.5 py-0.5 rounded">v1.2</span>
              </h1>
              <p className="text-xs text-[#DFF3E7]/80 tracking-wide font-medium">Orchestrator</p>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-[#DFF3E7]/70 font-light border-b border-white/10 pb-3">
            Smarter Execution · Cleaner Tomorrow
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#7FB892] text-[#1B5E5A] font-semibold shadow-md translate-x-1'
                    : 'text-[#DFF3E7]/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1B5E5A]' : 'text-[#7FB892]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-[#1B5E5A] text-white'
                        : item.isHighlight
                        ? 'bg-[#F28C7B] text-white'
                        : 'bg-white/15 text-[#DFF3E7]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Demo Login Portal Button */}
        <div className="px-3 pt-3">
          <button
            onClick={onOpenLogin}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-[#DFF3E7] hover:text-white transition-all border border-white/15 cursor-pointer shadow-xs group"
            title="Open Separate Demo Login Webpage"
          >
            <div className="flex items-center gap-2.5">
              <LogIn className="w-4 h-4 text-[#7FB892] group-hover:scale-110 transition-transform" />
              <span>Demo Login Portal</span>
            </div>
            <span className="text-[10px] font-semibold bg-[#7FB892] text-[#1B5E5A] px-2 py-0.5 rounded-full">
              Sign In
            </span>
          </button>
        </div>
      </div>

      {/* Sidebar Footer Accent Card */}
      <div className="p-4 m-3 rounded-2xl bg-[#144744] border border-white/10 text-[#DFF3E7]">
        <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[#7FB892]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Carbon-Aware Loop</span>
        </div>
        <p className="text-[11px] text-white/80 leading-relaxed">
          RUN · DELAY · FRAGMENT algorithms automatically re-plan when grid carbon spikes.
        </p>
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-[#DFF3E7]/70">
          <span>Work smarter.</span>
          <span className="text-[#7FB892] font-medium">Breathe cleaner.</span>
        </div>
      </div>
    </aside>
  );
};
