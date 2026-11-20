import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else if (data.user?.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="max-w-md mx-auto my-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-lg mx-auto shadow-md">
            QE
          </div>
          <h2 className="text-xl font-bold mt-3">Welcome to QueueEase</h2>
          <p className="text-xs text-slate-300 mt-1">
            Sign in with your assigned college email and password
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Official Account Notice */}
          <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Assigned Login Only:</strong> Institutional credentials are provided by College Administration. Self-registration is restricted.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@queueease.edu or staff@queueease.edu"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              One-Click Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('student@queueease.edu', 'Student@123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block">Aarav Patel</span>
                <span className="text-[10px] text-slate-500">Student (CS2023089)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('prof.sharma@queueease.edu', 'Staff@123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block">Prof. R. Sharma</span>
                <span className="text-[10px] text-slate-500">CSE Department Head</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('cad.officer@queueease.edu', 'Staff@123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block">Mrs. Sunita Verma</span>
                <span className="text-[10px] text-slate-500">CAD Officer (Counter 2)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('fees.officer@queueease.edu', 'Staff@123')}
                className="p-2 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-colors"
              >
                <span className="font-semibold text-slate-800 block">Prof. Arvind Mehta</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Admission Office Prof. (C-1)</span>
              </button>
            </div>
          </div>

          {/* Institutional Notice & Admin Portal Link */}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 inline" /> Official Campus ERP
            </span>
            <Link to="/admin/login" className="font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1">
              Admin Portal <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

