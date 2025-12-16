
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthState } from '../types';
import { loginUser, registerUser, resetPassword, sendMockOTP, verifyMockOTP, confirmPasswordReset } from '../services/backend';
import { Smartphone, Lock, User, ArrowRight, Loader2, Sparkles, Gift, Eye, EyeOff, AlertTriangle, KeyRound, ChevronLeft, CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<AuthState>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State (Used for both Signup and Forgot Password)
  const [otpView, setOtpView] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1=Mobile, 2=OTP, 3=NewPass
  const [newPassword, setNewPassword] = useState('');

  // Form Data (Mobile Only)
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    referralCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Strict Input for Mobile: Only numbers allow
    if (name === 'mobile') {
        const numericValue = value.replace(/\D/g, ''); // Remove non-digits immediately
        setFormData({ ...formData, [name]: numericValue });
    } else {
        setFormData({ ...formData, [name]: value });
    }
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Login with Mobile
      const user = await loginUser(formData.mobile, formData.password);
      if (user && user.id) {
        // Successful login, navigation handled by Auth state change in App.tsx
      } else {
        throw new Error("Profile not found.");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  // STEP 1: Send OTP (Signup)
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    // Strict Mobile Validation
    if (!formData.mobile || formData.mobile.length !== 11) {
      setError("Please enter a valid 11-digit mobile number (e.g., 03001234567)");
      setLoading(false);
      return;
    }

    try {
       await sendMockOTP(formData.mobile);
       setOtpView(true); // Switch to OTP input
       setSuccessMsg("OTP sent to your mobile number.");
    } catch (err: any) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  // STEP 2: Verify OTP & Register (Signup)
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Verify OTP
      await verifyMockOTP(formData.mobile, otpCode);

      // 2. Register User
      await registerUser({
        name: formData.name,
        mobile: formData.mobile,
        password: formData.password,
        referredByCode: formData.referralCode
      });
      // Navigation handled by state change
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD FLOW ---

  const handleForgot_Step1_SendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.mobile || formData.mobile.length !== 11) {
      setError("Please enter a valid 11-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      // Check if user exists and send OTP with reset flag
      await sendMockOTP(formData.mobile, true); 
      setSuccessMsg("OTP Sent via WhatsApp!");
      setForgotStep(2);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot_Step2_VerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyMockOTP(formData.mobile, otpCode);
      setSuccessMsg("Verified! Set new password.");
      setForgotStep(3);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot_Step3_ResetPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if(newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(formData.mobile, newPassword);
      setSuccessMsg("Password Reset Successfully!");
      setTimeout(() => {
        setView('LOGIN');
        setForgotStep(1);
        setOtpCode('');
        setNewPassword('');
        setFormData({...formData, password: ''});
      }, 2000);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2 flex items-center justify-center">
            Stock<span className="text-neonBlue">Grow</span> <Sparkles className="ml-2 text-yellow-400" size={24} />
          </h1>
          <p className="text-slate-400">Smart investments, real returns.</p>
        </div>

        <div className="bg-surface/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          
          {error && (
            <div className="mb-4 p-4 rounded-xl text-xs font-bold text-center select-text break-words bg-red-500/10 border border-red-500/50 text-red-500 animate-pulse">
              <div className="flex items-center justify-center">
                <AlertTriangle size={18} className="mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-xs font-bold text-center flex items-center justify-center">
               <CheckCircle size={16} className="mr-2" /> {successMsg}
            </div>
          )}

          {view === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Mobile Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    name="mobile"
                    type="tel"
                    required
                    placeholder="03001234567"
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength={11}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white focus:border-neonBlue focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-white focus:border-neonBlue focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-white focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                        setView('FORGOT_PASSWORD');
                        setForgotStep(1);
                        setError('');
                        setSuccessMsg('');
                        setOtpCode('');
                    }} 
                    className="text-xs text-neonBlue hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neonBlue text-black font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center mt-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Login Account <ArrowRight className="ml-2" size={18} /></>}
              </button>

              <div className="text-center mt-6">
                <span className="text-slate-500 text-sm">New here? </span>
                <button type="button" onClick={() => setView('SIGNUP')} className="text-white font-bold hover:underline">
                  Create Account
                </button>
              </div>
            </form>
          )}

          {view === 'SIGNUP' && !otpView && (
            <form onSubmit={handleRequestOTP} className="space-y-3 animate-fade-in">
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-500" size={16} />
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white text-sm focus:border-neonBlue focus:outline-none"
                />
              </div>

              <div className="relative">
                <Smartphone className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  name="mobile"
                  type="tel"
                  required
                  placeholder="Mobile Number (03XXXXXXXXX)"
                  value={formData.mobile}
                  onChange={handleChange}
                  maxLength={11}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white text-sm focus:border-neonBlue focus:outline-none"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-white focus:border-neonBlue focus:outline-none"
                />
                 <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-white focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>

              <div className="relative">
                <Gift className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  name="referralCode"
                  type="text"
                  placeholder="Referral Code (Optional)"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white focus:border-neonPurple focus:outline-none"
                />
              </div>

              <div className="p-3 bg-neonBlue/10 rounded-xl border border-neonBlue/30 text-center">
                 <p className="text-neonBlue text-xs font-bold">Sign up now and get Rs.200 Free Bonus! 🎉</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center mt-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Verify & Create Account"}
              </button>

              <div className="text-center mt-4">
                <button type="button" onClick={() => setView('LOGIN')} className="text-slate-500 hover:text-white text-sm">
                  Already have an account? Login
                </button>
              </div>
            </form>
          )}

          {/* OTP VIEW (SIGNUP) */}
          {view === 'SIGNUP' && otpView && (
             <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-slide-up">
                 <div className="text-center">
                    <div className="w-16 h-16 bg-neonBlue/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-neonBlue/50 animate-pulse">
                        <Smartphone className="text-neonBlue" size={32} />
                    </div>
                    <h3 className="text-white font-bold text-lg">Verify Mobile</h3>
                    <p className="text-slate-400 text-sm mt-1">
                        We sent a code to <br/><span className="text-neonBlue font-mono">{formData.mobile}</span>
                    </p>
                 </div>

                 <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 text-slate-500" size={18} />
                    <input 
                      type="number"
                      placeholder="Enter 6-digit OTP"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-center text-white text-lg tracking-[0.5em] font-mono focus:border-neonBlue focus:outline-none"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                      required
                    />
                 </div>

                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neonBlue text-black font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : "Confirm OTP"}
                 </button>

                 <button 
                    type="button" 
                    onClick={() => setOtpView(false)}
                    className="w-full text-slate-500 text-xs flex items-center justify-center hover:text-white"
                 >
                     <ChevronLeft size={14} className="mr-1"/> Change Number
                 </button>
             </form>
          )}

          {/* --- FORGOT PASSWORD MULTI-STEP FLOW --- */}
          {view === 'FORGOT_PASSWORD' && (
            <div className="animate-fade-in text-center">
              <div className="w-16 h-16 bg-neonPurple/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neonPurple/30">
                <Lock className="text-neonPurple" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
              
              {/* Step Indicators */}
              <div className="flex justify-center space-x-2 mb-6">
                  <div className={`w-2 h-2 rounded-full ${forgotStep >= 1 ? 'bg-neonPurple' : 'bg-slate-800'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${forgotStep >= 2 ? 'bg-neonPurple' : 'bg-slate-800'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${forgotStep >= 3 ? 'bg-neonPurple' : 'bg-slate-800'}`}></div>
              </div>

              {/* STEP 1: Enter Mobile */}
              {forgotStep === 1 && (
                  <form onSubmit={handleForgot_Step1_SendOTP} className="space-y-4 animate-fade-in">
                    <p className="text-slate-400 text-xs mb-2">Enter your registered mobile number to receive OTP.</p>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-3.5 text-slate-500" size={18} />
                      <input
                        name="mobile"
                        type="tel"
                        required
                        placeholder="03XXXXXXXXX"
                        value={formData.mobile}
                        onChange={handleChange}
                        maxLength={11}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white focus:border-neonPurple focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-neonPurple text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center"
                    >
                       {loading ? <Loader2 className="animate-spin" /> : "Send OTP Code"}
                    </button>
                  </form>
              )}

              {/* STEP 2: Verify OTP */}
              {forgotStep === 2 && (
                  <form onSubmit={handleForgot_Step2_VerifyOTP} className="space-y-4 animate-fade-in">
                    <p className="text-slate-400 text-xs mb-2">Enter the OTP sent to <span className="text-neonPurple font-mono">{formData.mobile}</span></p>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3.5 text-slate-500" size={18} />
                      <input
                        type="number"
                        required
                        placeholder="6-Digit Code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.slice(0,6))}
                        maxLength={6}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-center text-white text-lg tracking-[0.5em] font-mono focus:border-neonPurple focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-neonPurple text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center"
                    >
                       {loading ? <Loader2 className="animate-spin" /> : "Verify Code"}
                    </button>
                    <button type="button" onClick={() => setForgotStep(1)} className="text-xs text-slate-500">Change Number</button>
                  </form>
              )}

              {/* STEP 3: New Password */}
              {forgotStep === 3 && (
                  <form onSubmit={handleForgot_Step3_ResetPass} className="space-y-4 animate-fade-in">
                    <p className="text-slate-400 text-xs mb-2">Create a new secure password.</p>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                      <input
                        type="text"
                        required
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 text-white focus:border-neonPurple focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-500 text-black font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center"
                    >
                       {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
                    </button>
                  </form>
              )}

              <button onClick={() => setView('LOGIN')} className="mt-6 text-slate-500 text-xs hover:text-white">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}