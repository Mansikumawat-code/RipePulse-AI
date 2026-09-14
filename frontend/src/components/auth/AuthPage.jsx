import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParticleBackground } from '../common/ParticleBackground';
import { FloatingProduce } from '../common/FloatingProduce';
import { 
  Leaf, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Boxes, 
  Truck, 
  Sliders, 
  CheckCircle2, 
  Lock, 
  Mail, 
  User, 
  Building,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp, USER_ROLES } from '../../context/AppContext';

export const AuthPage = () => {
  const navigate = useNavigate();
  const { loginUser, currentUser } = useApp();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState('WAREHOUSE_MANAGER');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState('elena.vance@ripepulse.ai');
  const [password, setPassword] = useState('RipePulse2026!');
  const [fullName, setFullName] = useState('Elena Vance');
  const [facilityName, setFacilityName] = useState('Indore Central Cold-Storage Hub');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // When role changes, prefill demo credentials for convenience
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    const roleInfo = USER_ROLES[roleId];
    if (roleInfo) {
      setEmail(roleInfo.email);
      setFullName(roleInfo.name);
      setFacilityName(roleInfo.facility);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = loginUser(selectedRole, {
      name: fullName,
      email: email,
      facility: facilityName
    });
    // Navigate to role-tailored route or dashboard
    navigate(user.defaultRoute || '/dashboard');
  };

  const handleQuickDemoLogin = (roleId) => {
    const user = loginUser(roleId);
    navigate(user.defaultRoute || '/dashboard');
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setResetSent(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#111c12] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Global CSS for Animations, Zooming & Gleams */}
      <style>{`
        @keyframes bgZoomPan {
          0%   { transform: scale(1) translate(0, 0); }
          50%  { transform: scale(1.08) translate(-1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes cardZoomEntrance {
          0%   { opacity: 0; transform: scale(0.92) translateY(24px); }
          70%  { opacity: 1; transform: scale(1.01) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes floatOrb1 {
          0%   { transform: translateY(0px) scale(1); }
          50%  { transform: translateY(-25px) scale(1.1); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes floatOrb2 {
          0%   { transform: translateY(0px) scale(1); }
          50%  { transform: translateY(30px) scale(1.15); }
          100% { transform: translateY(0px) scale(1); }
        }
        @keyframes buttonSheen {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }

        .anim-bg-zoom {
          animation: bgZoomPan 26s ease-in-out infinite alternate;
        }
        .anim-card-pop {
          animation: cardZoomEntrance 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-orb-1 {
          animation: floatOrb1 7s ease-in-out infinite;
        }
        .anim-orb-2 {
          animation: floatOrb2 9s ease-in-out infinite;
        }
        .btn-sheen:hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: buttonSheen 0.85s ease forwards;
        }
      `}</style>

      {/* Dynamic Particle Animation Background */}
      <ParticleBackground />
      <FloatingProduce />

      {/* Top Header */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-emerald-400/40">
            <Leaf className="w-5 h-5 fill-slate-950 stroke-slate-950 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white font-display">
            RipePulse<span className="text-emerald-400">.</span>
          </span>
        </Link>

        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200/70 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Back</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          
          {/* Card Wrapper with Zoom Entrance & Shimmer Border */}
          <div className="anim-card-pop relative bg-gradient-to-b from-white/15 via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 p-6 sm:p-7 shadow-2xl shadow-black/60 transition-all duration-500 hover:border-emerald-500/40 hover:shadow-emerald-950/40 group/card">
            
            {/* Top Border Glow Accent */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60 rounded-full" />

            {/* Title */}
            <div className="text-center mb-5">
              <h2 className="text-2xl font-extrabold text-white tracking-tight transition-transform duration-300 hover:scale-105 inline-block">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </h2>
            </div>

            {/* Mode Switcher Tabs with Animated Zoom */}
            <div className="flex bg-black/30 p-1 rounded-xl border border-white/10 text-xs font-bold mb-5 shadow-inner">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 rounded-lg transition-all duration-300 active:scale-95 ${
                  authMode === 'login'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                    : 'text-emerald-200/60 hover:text-white hover:scale-[1.01]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-1.5 rounded-lg transition-all duration-300 active:scale-95 ${
                  authMode === 'signup'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                    : 'text-emerald-200/60 hover:text-white hover:scale-[1.01]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Compact User Role Selection with Zoom Hover & Bounce */}
            <div className="mb-5">
              <div className="grid grid-cols-3 gap-2">
                {Object.values(USER_ROLES).map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleSelect(role.id)}
                      className={`group/role p-2.5 rounded-xl border transition-all duration-300 cursor-pointer select-none text-center flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-900/70 border-emerald-400 text-white ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/60 scale-105'
                          : 'bg-black/25 border-white/10 text-emerald-200/70 hover:bg-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      <span className="text-xl transition-transform duration-300 group-hover/role:scale-125 group-hover/role:rotate-6">
                        {role.icon}
                      </span>
                      <span className="text-[11px] font-bold leading-tight line-clamp-1">{role.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Form with Input Zoom & Focus Effects */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {authMode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-200/80 mb-1">Name</label>
                    <div className="relative group/input">
                      <User className="w-3.5 h-3.5 text-emerald-300/50 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 group-focus-within/input:text-emerald-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Elena Vance"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 transition-all duration-200 focus:outline-none focus:border-emerald-400 focus:scale-[1.02] focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-200/80 mb-1">Facility</label>
                    <div className="relative group/input">
                      <Building className="w-3.5 h-3.5 text-emerald-300/50 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 group-focus-within/input:text-emerald-400" />
                      <input
                        type="text"
                        required
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        placeholder="Indore Central Cold Storage"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 transition-all duration-200 focus:outline-none focus:border-emerald-400 focus:scale-[1.02] focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email with Focus Zoom */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-200/80 mb-1">
                  Email
                </label>
                <div className="relative group/input">
                  <Mail className="w-3.5 h-3.5 text-emerald-300/50 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 group-focus-within/input:text-emerald-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@ripepulse.ai"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 transition-all duration-200 focus:outline-none focus:border-emerald-400 focus:scale-[1.02] focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  />
                </div>
              </div>

              {/* Password with Focus Zoom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-emerald-200/80">
                    Password
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-all duration-200 hover:scale-105"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative group/input">
                  <Lock className="w-3.5 h-3.5 text-emerald-300/50 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 group-focus-within/input:text-emerald-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-8 pr-9 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/30 transition-all duration-200 focus:outline-none focus:border-emerald-400 focus:scale-[1.02] focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-white transition-all duration-200 hover:scale-110"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-100/70 select-none group/check">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-400 transition-transform duration-200 group-hover/check:scale-110"
                  />
                  <span className="transition-colors group-hover/check:text-white">Remember me</span>
                </label>
              </div>

              {/* Submit Button with Light Sheen Sweep & Zoom Effect */}
              <button
                type="submit"
                className="btn-sheen group relative overflow-hidden w-full py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-400/25 transition-all duration-300 hover:scale-105 hover:shadow-amber-400/40 active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </form>

            {/* Quick Demo Sign-In Buttons with Zoom & Glow */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="text-[10px] uppercase font-bold text-emerald-200/50 tracking-wider mb-2 text-center">
                Instant Demo Access
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('WAREHOUSE_MANAGER')}
                  className="group px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-400/60 text-center transition-all duration-200 hover:scale-105 active:scale-90 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm hover:shadow-emerald-900/40"
                  title="Warehouse Manager Demo"
                >
                  <span className="transition-transform duration-200 group-hover:scale-125">🏢</span>
                  <span className="text-[11px]">Warehouse</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('SUPPLY_CHAIN_MANAGER')}
                  className="group px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-indigo-400/60 text-center transition-all duration-200 hover:scale-105 active:scale-90 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm hover:shadow-indigo-900/40"
                  title="Supply Chain Manager Demo"
                >
                  <span className="transition-transform duration-200 group-hover:scale-125">🚛</span>
                  <span className="text-[11px]">Supply Chain</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ADMIN')}
                  className="group px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-amber-400/60 text-center transition-all duration-200 hover:scale-105 active:scale-90 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm hover:shadow-amber-900/40"
                  title="Admin Demo"
                >
                  <span className="transition-transform duration-200 group-hover:scale-125">🛡️</span>
                  <span className="text-[11px]">Admin</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#18261a] border border-emerald-800/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-100">
            <h3 className="text-base font-extrabold text-white">Reset Account Password</h3>
            <p className="text-xs text-emerald-200/70 mt-1">
              Enter your enterprise work email. A temporary security reset link will be transmitted.
            </p>

            {resetSent ? (
              <div className="mt-4 p-3 bg-emerald-900/50 border border-emerald-600 rounded-xl text-center text-xs text-emerald-200 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Password reset link transmitted!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@ripepulse.ai"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-emerald-400"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-emerald-200/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="relative z-20 py-4 text-center text-[11px] text-emerald-200/40">
        © 2026 RipePulse AI
      </footer>

    </div>
  );
};
