'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Layers, Loader2 } from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER';

interface AuthPageProps {
  onLogin: (user: {_id:string; name: string; email: string }) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'REGISTER' && !formData.name) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'LOGIN' ? '/api/login' : '/api/register';
      const payload = mode === 'LOGIN'
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // --- SAVE TOKEN ---
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      console.log("Data",data)
      // Construct user object
      const userData = {
        name: data.user.name || formData.name || 'User',
        email: data.user.email || formData.email,
        _id: data.user.id || data.user._id,
      };

      onLogin(userData);

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-8 text-center z-10">
        <div className="inline-flex items-center justify-center bg-indigo-600 p-3 rounded-xl mb-4 shadow-lg shadow-indigo-500/30">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">TeamSync</h1>
        <p className="text-slate-400 mt-2">Collaborate securely with your team.</p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    disabled={isLoading}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  disabled={isLoading}
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'LOGIN' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            {mode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
            <button
              disabled={isLoading}
              onClick={() => {
                setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                setError('');
                setFormData({ name: '', email: '', password: '' });
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'LOGIN' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
