import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, Users, BarChart3, Shield,
  ArrowRight, AlertCircle, CheckCircle2, LockKeyhole
} from 'lucide-react';
import { apiLogin, getAuthToken } from '../utils/api';

const Login = () => {
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (getAuthToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your admin email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await apiLogin(email.trim(), password);
      setSuccess('Authentication successful! Opening control center...');
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#F3F4F6] p-0 sm:p-4 lg:p-6 flex flex-col lg:flex-row items-center justify-center font-sans lg:overflow-hidden">
      <div className="flex flex-col lg:flex-row w-full max-w-[1440px] h-full lg:max-h-[820px] gap-0 lg:gap-6 mx-auto relative">
        
        {/* Left/Top Side - Dark Brand Card */}
        <div className="relative flex flex-col w-full lg:w-[52%] min-h-[250px] h-[30vh] sm:h-[35vh] lg:h-full bg-[#0B1B3D] text-white p-6 lg:p-10 overflow-hidden rounded-none sm:rounded-[32px] shadow-none sm:shadow-2xl pb-10 lg:pb-8">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/login.png')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3D] via-[#0B1B3D]/80 to-[#0B1B3D]/30 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-[#0B1B3D]/40"></div>

          {/* Top Nav Branding */}
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center">
              <img src="/logo.png" alt="RecruitCRM Logo" className="h-8 lg:h-9 w-auto object-contain" />
            </div>
            <div className="text-[10px] font-semibold tracking-[0.16em] text-blue-200/90 uppercase bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
              Admin Portal
            </div>
          </div>

          {/* Main Highlights */}
          <div className="relative z-10 mt-auto max-w-lg">
            <h1 className="text-[28px] lg:text-[40px] font-bold leading-[1.15] tracking-tight mb-2">
              Global Talent<br />
              Brighter <span className="text-[#60A5FA]">Futures</span>
            </h1>
            <p className="text-gray-200 lg:text-gray-300 text-[13px] lg:text-[14px] mb-6 font-normal tracking-wide">
              Overseas Placement, Lead Lifecycle & Visa Workflow CRM
            </p>

            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-medium text-white text-[13px]">Enterprise Workforce Management</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Role based access & branch controls</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-medium text-white text-[13px]">Real-Time Operational Analytics</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Track conversion & lead pipeline velocity</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-medium text-white text-[13px]">Bank-Grade Security</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Encrypted sessions & strict role authorization</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow"></div>

          {/* Footer Metrics */}
          <div className="relative z-10 pt-3">
            <div className="mb-4 border-l-[2px] border-[#60A5FA] pl-3">
              <p className="text-gray-100 italic text-[12px] leading-relaxed font-serif">
                "Right People • Right Process • Global Opportunity"
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/15 pt-3 pr-2">
              <div><div className="text-[18px] lg:text-[22px] font-bold text-[#60A5FA]">10K+</div><div className="text-[9px] text-gray-300 mt-1">Candidates</div></div>
              <div className="w-[1px] h-5 bg-white/15"></div>
              <div><div className="text-[18px] lg:text-[22px] font-bold text-[#60A5FA]">500+</div><div className="text-[9px] text-gray-300 mt-1">Placements</div></div>
              <div className="w-[1px] h-5 bg-white/15"></div>
              <div><div className="text-[18px] lg:text-[22px] font-bold text-[#60A5FA]">20+</div><div className="text-[9px] text-gray-300 mt-1">Countries</div></div>
            </div>
          </div>
        </div>

        {/* Right Side - Strict Admin Login Only Form */}
        <div className="flex-1 flex flex-col p-6 sm:p-10 lg:p-12 relative bg-white rounded-t-[32px] sm:rounded-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] lg:shadow-2xl overflow-y-auto -mt-8 lg:mt-0 z-20">
          <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto py-6 lg:py-0">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="RecruitCRM Logo" className="h-11 w-auto object-contain" />
            </div>

            {/* Form Title & Context */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[11px] font-semibold text-[#0066FF] mb-2.5">
                <LockKeyhole className="w-3.5 h-3.5" />
                <span>Authorized Personnel Only</span>
              </div>
              <h2 className="text-[24px] lg:text-[26px] font-bold text-gray-900 tracking-tight">
                Admin Sign In
              </h2>
              <p className="text-gray-500 text-[13px] mt-1">
                Enter your credentials to access the administrative control center
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-[13px] text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-[14px] text-[13px] text-emerald-700 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            <form className="space-y-4" onSubmit={handleLogin} noValidate>
              
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-medium text-gray-700">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-[18px] w-[18px] text-gray-400" strokeWidth={1.5} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="block w-full pl-11 pr-4 py-3 border border-[#E2E8F0] rounded-[14px] text-[13.5px] bg-[#F8FAFC] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] focus:bg-white transition-all"
                    placeholder="admin@gmail.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-medium text-gray-700">Password</label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-[18px] w-[18px] text-gray-400" strokeWidth={1.5} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="block w-full pl-11 pr-11 py-3 border border-[#E2E8F0] rounded-[14px] text-[13.5px] bg-[#F8FAFC] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] focus:bg-white transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={() => setShowPassword(p => !p)}
                  >
                    {showPassword
                      ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} />
                      : <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    }
                  </button>
                </div>
              </div>

             

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-[14px] text-[14px] font-bold text-white bg-[#0066FF] hover:bg-blue-700 disabled:opacity-70 transition-all mt-3 cursor-pointer shadow-md shadow-blue-500/15"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Verifying Credentials…
                  </>
                ) : (
                  <>Sign In to Dashboard <ArrowRight className="w-4 h-4 ml-0.5" strokeWidth={2} /></>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-gray-400">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Restricted admin access with encrypted session security</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
