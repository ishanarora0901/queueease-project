import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide administrative credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await adminLogin(email, password);
      if (data.user?.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Unauthorized: Administrative role required.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Administrative verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    setEmail('admin@queueease.edu');
    setPassword('Admin@123');
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-left">
        {/* Deep Navy Header */}
        <div className="bg-slate-900 p-8 text-white text-center relative border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-xl mx-auto shadow-lg">
            QE
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-teal-400 text-xs font-bold mt-4">
            <KeyRound className="w-3.5 h-3.5" />
            Executive Administration
          </div>
          <h2 className="text-xl font-bold mt-2">Campus Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Authorized Dean & System Administrators Only</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Administrator Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@queueease.edu"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Master Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Verifying Authorization...' : 'Authenticate Admin Session'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Admin Button */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={handleQuickAdmin}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 text-xs font-semibold text-slate-800 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="block font-bold">Dr. Vikram Singhania</span>
                  <span className="text-[10px] text-slate-500 font-normal">Dean of Student Affairs & Chief Admin</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                1-Click Demo
              </span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            <Link to="/login" className="hover:text-slate-900 font-medium transition-colors">
              ← Return to Student & Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

