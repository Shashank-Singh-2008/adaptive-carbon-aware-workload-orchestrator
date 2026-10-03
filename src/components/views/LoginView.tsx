import React, { useState } from 'react';
import { 
  Leaf, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { UserProfile, DEMO_USERS } from '../../types/auth';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBackToDashboard: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBackToDashboard }) => {
  const [email, setEmail] = useState<string>('shristi@greencompute.io');
  const [password, setPassword] = useState<string>('orchestrator2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDemoUser, setSelectedDemoUser] = useState<UserProfile>(DEMO_USERS[0]);

  const handleSelectDemoProfile = (user: UserProfile) => {
    setSelectedDemoUser(user);
    setEmail(user.email);
    setPassword('orchestrator2026');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);

    // Simulate authentication latency & session creation
    setTimeout(() => {
      setIsLoading(false);
      // Find matching demo user or create session from input
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );
      const userToLogin: UserProfile = matched || {
        name: email.split('@')[0].toUpperCase(),
        email: email,
        role: 'Compute Operator',
        avatarInitials: email.slice(0, 2).toUpperCase(),
        region: 'India (IN Grid)',
      };

      if (rememberMe) {
        localStorage.setItem('orchestrator_auth_user', JSON.stringify(userToLogin));
      }
      onLoginSuccess(userToLogin);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EE] flex flex-col md:flex-row text-[#2E2E3A] font-sans antialiased selection:bg-[#DFF3E7] selection:text-[#1B5E5A]">
      {/* Left Showcase Side (Forest Green Brand Visuals) */}
      <div className="md:w-5/12 lg:w-1/2 bg-[#1B5E5A] text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden select-none">
        {/* Subtle decorative background gradient circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#7FB892]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#144744]/60 blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#DFF3E7] flex items-center justify-center text-[#1B5E5A] shadow-md shadow-black/10">
              <Leaf className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight flex items-center gap-2">
                Workload Orchestrator
                <span className="text-[10px] uppercase font-bold bg-white/15 px-2 py-0.5 rounded-full text-[#DFF3E7]">
                  Demo
                </span>
              </div>
              <p className="text-xs text-[#DFF3E7]/80">Adaptive Carbon-Aware Decision Engine</p>
            </div>
          </div>
        </div>

        {/* Hero Copy & Live Value Cards */}
        <div className="relative z-10 my-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-[#DFF3E7] border border-white/15 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#7FB892]" />
            <span>Autonomous Grid-Carbon Scheduling</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug">
            Smarter compute execution. <br />
            <span className="text-[#7FB892]">Cleaner grid footprint.</span>
          </h2>

          <p className="text-xs text-[#DFF3E7]/80 max-w-md leading-relaxed">
            Continuously evaluate <strong>RUN</strong>, <strong>DELAY</strong>, and <strong>FRAGMENT</strong> strategies against real-time marginal carbon intensity to schedule heavy ML pipelines within strict budgets and deadlines.
          </p>

          {/* Metric Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
              <div className="text-[10px] uppercase font-bold text-[#7FB892] tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" /> Carbon Reduced
              </div>
              <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">-10.6%</div>
              <div className="text-[10px] text-white/60">vs immediate continuous run</div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
              <div className="text-[10px] uppercase font-bold text-[#7FB892] tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Constraint Safety
              </div>
              <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">100%</div>
              <div className="text-[10px] text-white/60">Zero budget or SLA breaches</div>
            </div>
          </div>
        </div>

        {/* Bottom Status Ribbon */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-[#DFF3E7]/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7FB892] animate-pulse" />
            <span>Deterministic Scoring Engine Online</span>
          </div>
          <span className="font-mono text-[11px] text-white/50">v1.2.4</span>
        </div>
      </div>

      {/* Right Login Panel Side */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-18 max-w-2xl mx-auto w-full">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-6">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-xs font-bold text-[#2E2E3A]/70 hover:text-[#1B5E5A] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Public Dashboard</span>
          </button>

          <span className="text-[11px] font-semibold text-[#1B5E5A] bg-[#DFF3E7] px-3 py-1 rounded-full border border-[#7FB892]/40">
            Demo Portal
          </span>
        </div>

        {/* Login Form Container */}
        <div className="my-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2E2E3A] tracking-tight">
              Sign In to Orchestrator
            </h1>
            <p className="text-xs text-[#2E2E3A]/60 mt-1.5">
              Select a quick demo persona or enter your control plane credentials.
            </p>
          </div>

          {/* Quick 1-Click Demo Personas */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2E2E3A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1B5E5A]" />
              <span>Select Demo Account (1-Click Auto-Fill):</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DEMO_USERS.map((user) => {
                const isSelected = selectedDemoUser.email === user.email;
                return (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => handleSelectDemoProfile(user)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#DFF3E7]/50 border-[#1B5E5A] ring-2 ring-[#1B5E5A]/20 shadow-xs'
                        : 'bg-white border-[#E9E7F2] hover:border-[#7FB892]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-[#1B5E5A] text-white' : 'bg-[#E9E7F2] text-[#2E2E3A]'
                        }`}
                      >
                        {user.avatarInitials}
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E5A]" />}
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-bold text-[#2E2E3A] truncate">{user.name}</div>
                      <div className="text-[10px] text-[#2E2E3A]/60 truncate">{user.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#2E2E3A] block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2E2E3A]/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@greencompute.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9E7F2] rounded-xl text-xs font-medium text-[#2E2E3A] focus:outline-none focus:ring-2 focus:ring-[#7FB892] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2E2E3A]">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Demo Password is: orchestrator2026')}
                  className="text-[11px] font-semibold text-[#1B5E5A] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2E2E3A]/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E9E7F2] rounded-xl text-xs font-medium text-[#2E2E3A] focus:outline-none focus:ring-2 focus:ring-[#7FB892] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2E2E3A]/50 hover:text-[#2E2E3A] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#2E2E3A]/80 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E9E7F2] text-[#1B5E5A] focus:ring-[#7FB892] accent-[#1B5E5A] cursor-pointer"
                />
                <span>Remember this workstation</span>
              </label>

              <span className="text-[11px] text-[#2E2E3A]/50">Demo Credentials Loaded</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#1B5E5A] text-white rounded-xl text-xs font-bold hover:bg-[#144744] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {selectedDemoUser.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="text-xs text-[#2E2E3A]/70 hover:text-[#1B5E5A] font-semibold underline underline-offset-4 cursor-pointer"
            >
              Continue without signing in (View Demo as Guest)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#E9E7F2] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#2E2E3A]/50 gap-2">
          <span>© 2026 Adaptive Carbon-Aware Workload Orchestrator</span>
          <div className="flex items-center gap-3">
            <span>Privacy</span>
            <span>·</span>
            <span>Security Docs</span>
            <span>·</span>
            <span>SLA 99.9%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
