import React, { useState } from 'react';
import { Search, Bell, Zap, ChevronDown, LogIn, LogOut, UserCheck } from 'lucide-react';
import { UserProfile } from '../../types/auth';

interface HeaderProps {
  dataSourceMode: 'SYNTHETIC' | 'LIVE';
  onToggleDataSource: () => void;
  onSimulateGridChange: () => void;
  isSpiked: boolean;
  replanCount: number;
  onOpenOrchestrator: () => void;
  currentUser?: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataSourceMode,
  onToggleDataSource,
  onSimulateGridChange,
  isSpiked,
  replanCount,
  onOpenOrchestrator,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  return (
    <header className="h-18 px-8 bg-[#F7F5EE] border-b border-[#E9E7F2] flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Search Input */}
      <div className="relative w-80 lg:w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2E2E3A]/40" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-xs font-medium text-[#2E2E3A] border border-[#E9E7F2] focus:outline-none focus:ring-2 focus:ring-[#7FB892]/40 shadow-xs transition-all placeholder:text-[#2E2E3A]/40"
        />
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Data Source Badge Mode Toggle */}
        <button
          onClick={onToggleDataSource}
          title="Toggle between Synthetic Demo Forecast and Live API Adapter"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#E9E7F2] text-[#1B5E5A] hover:bg-[#DFF3E7]/40 transition-colors shadow-2xs cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#7FB892] animate-pulse"></span>
          <span className="text-[11px] uppercase tracking-wider text-[#2E2E3A]/60 font-medium">Source:</span>
          <span className="font-semibold text-xs">
            {dataSourceMode === 'SYNTHETIC' ? 'Synthetic Demo Forecast' : 'Live Carbon API'}
          </span>
        </button>

        {/* Quick Demo Trigger: Simulate Grid Change */}
        <button
          onClick={onSimulateGridChange}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer ${
            isSpiked
              ? 'bg-[#F28C7B] text-white hover:bg-[#e07563] animate-pulse ring-2 ring-[#F28C7B]/30'
              : 'bg-[#F6B26B]/20 text-[#B45309] hover:bg-[#F6B26B]/30 border border-[#F6B26B]/40'
          }`}
          title="Click to simulate sudden grid carbon spike at 17:00 (210 to 360 gCO2/kWh)"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isSpiked ? 'Grid Spiked (360 gCO₂)' : 'Simulate Grid Change'}</span>
          <span className="md:hidden">{isSpiked ? 'Spike' : 'Simulate'}</span>
        </button>

        {/* Notifications Icon with count */}
        <div className="relative">
          <button 
            onClick={onOpenOrchestrator}
            className="w-9 h-9 rounded-full bg-white border border-[#E9E7F2] flex items-center justify-center text-[#2E2E3A]/70 hover:text-[#1B5E5A] hover:border-[#7FB892] transition-colors relative cursor-pointer"
            title="Notifications & Re-plans"
          >
            <Bell className="w-4 h-4" />
            {replanCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F28C7B] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {replanCount}
              </span>
            )}
          </button>
        </div>

        {/* Dedicated Demo Login Button */}
        <button
          onClick={onOpenLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#DFF3E7] text-[#1B5E5A] border border-[#7FB892]/40 hover:bg-[#1B5E5A] hover:text-white transition-all shadow-2xs cursor-pointer"
          title="Open Separate Demo Login Webpage"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Demo Login</span>
        </button>

        {/* User Profile Avatar with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 border-l border-[#E9E7F2] cursor-pointer hover:opacity-80 transition-opacity"
            title="User Profile & Session"
          >
            <div className="w-9 h-9 rounded-full bg-[#1B5E5A] text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white">
              {currentUser ? currentUser.avatarInitials : 'SS'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[#2E2E3A] leading-tight">
                {currentUser ? currentUser.name : 'Shristi S.'}
              </div>
              <div className="text-[10px] text-[#2E2E3A]/50 font-medium">
                {currentUser ? currentUser.role : 'Orchestrator Lead'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#2E2E3A]/40" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl p-3 border border-[#E9E7F2] shadow-xl z-50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 rounded-xl bg-[#F7F5EE] border border-[#E9E7F2]">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#1B5E5A]">
                  <UserCheck className="w-3.5 h-3.5" /> Active Session
                </div>
                <div className="text-xs font-bold text-[#2E2E3A] mt-1">
                  {currentUser ? currentUser.name : 'Shristi S.'}
                </div>
                <div className="text-[11px] text-[#2E2E3A]/60 font-mono truncate">
                  {currentUser ? currentUser.email : 'shristi@greencompute.io'}
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#1B5E5A] hover:bg-[#DFF3E7] rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Switch Demo Persona / Login Page</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

