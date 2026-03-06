import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, Loader2, Info, X, Mail, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string | null;
  logo?: string;
}

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

const Login: React.FC<LoginProps> = ({ onLogin, error, logo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => setLockoutTime(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  // Handle external errors (like invalid creds) to increment attempts
  useEffect(() => {
    if (error) {
      setAttempts(prev => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) setLockoutTime(COOLDOWN_SECONDS);
        return next;
      });
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;
    
    setIsLoggingIn(true);
    setTimeout(() => {
      onLogin(username, password);
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-[120px]" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white p-10 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-28 h-20 bg-white rounded-[20px] flex items-center justify-center overflow-hidden mb-6 shadow-lg shadow-indigo-100/50 p-1 border border-gray-100 transition-transform hover:scale-105 duration-300">
            {logo ? (
              <img src={logo} alt="Maruthi HR Logo" className="w-full h-full object-contain object-center scale-110" />
            ) : (
              <ShieldCheck size={42} className="text-indigo-600" />
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Access Portal</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Secure Maruthi HR Solution Gateway</p>
        </div>

        {lockoutTime > 0 ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col items-center text-center gap-4 animate-in slide-in-from-top-2">
            <ShieldAlert size={48} className="text-red-500" />
            <h3 className="text-lg font-black text-red-900">Security Lockout</h3>
            <p className="text-sm text-red-700 font-medium">Too many failed attempts. Access temporarily disabled for security.</p>
            <div className="px-6 py-2 bg-red-100 text-red-600 rounded-full font-black text-lg">
              {lockoutTime}s
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Staff Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or hr_user"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 mt-2">
                  <Info size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={24} /> : <><span>Enter Portal</span><ArrowRight size={20} /></>}
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-gray-100 text-center flex flex-col gap-2">
          <div className="inline-flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>AES-256 Cloud Encryption Active</span>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">
                For security reasons, please contact your Payroll Administrator to reset your password or recover your account.
              </p>
              
              <div className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Admin Support</p>
                <a 
                  href="mailto:maruthihrsolution25@gmail.com" 
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  maruthihrsolution25@gmail.com
                </a>
              </div>

              <button 
                onClick={() => setShowForgotModal(false)}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
              >
                Close Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;