'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [loginVal, setLoginVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await login(loginVal, passwordVal);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Full-screen background (stock chart image) ── */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/login_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#09090b',
        }}
      />
      {/* dark overlay to keep card readable */}
      <div className="fixed inset-0 z-0 bg-black/40" />

      {/* ── Page content ── */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 antialiased select-none">
        <div className="w-full max-w-md">

          {/* ── Logo Header ── */}
          <div className="text-center mb-8">
            <div className="inline-flex w-32 h-32 items-center justify-center mb-4">
              {/* Investment logo — using styled shield as fallback */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-sky-500/90 to-purple-600/90 backdrop-blur flex items-center justify-center shadow-2xl shadow-sky-500/30 border border-white/10">
                  <img src="/assets/investnent.png" width={100} height={100} alt="Investment Logo" />
              </div> 
            </div>
            <h1 className="font-outfit font-extrabold text-3xl text-white tracking-tight drop-shadow-lg">
              Welcome Back
            </h1>
            <p className="text-zinc-300 text-sm mt-2 drop-shadow">
              Sign in to manage users, roles, and investments
            </p>
          </div>

          {/* ── Glassmorphism Login Card ── */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/60 rounded-3xl p-8 shadow-2xl shadow-black/60">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Error alert */}
              {errorMsg && (
                <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Success alert */}
              {successMsg && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Email / Phone */}
              <div>
                <label
                  htmlFor="login"
                  className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2"
                >
                  Email Address or Phone
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="login"
                    required
                    autoComplete="username"
                    value={loginVal}
                    onChange={e => setLoginVal(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    required
                    autoComplete="current-password"
                    value={passwordVal}
                    onChange={e => setPasswordVal(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-zinc-950/50 border border-zinc-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950/50 text-sky-500 focus:ring-sky-500 focus:ring-offset-zinc-900 focus:ring-0 cursor-pointer accent-sky-500"
                  />
                  <span className="text-zinc-400 text-xs font-medium group-hover:text-zinc-300 transition-colors">
                    Keep me signed in
                  </span>
                </label>
                <a href="#" className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-zinc-500 text-xs mt-8">
            &copy; {new Date().getFullYear()} Investment Pack. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
