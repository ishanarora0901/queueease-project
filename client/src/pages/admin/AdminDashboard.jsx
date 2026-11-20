import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/campusApis';
import { StatCard, LoadingSpinner } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Building2,
  Store,
  Layers,
  FileCheck,
  CreditCard,
  Clock,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const res = await adminApi.getDashboardMetrics();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner text="Generating campus analytics..." />;
  }

  const { stats, charts, recentTokens, recentAuditLogs } = data || {};

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Top Welcome & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus-wide live queue monitoring, CAD service status, and administrative analytics
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Registered Students"
          value={stats?.totalStudents || 0}
          subtitle="Enrolled in ERP"
          icon={Users}
          color="navy"
          trend="+12% this term"
        />
        <StatCard
          title="Active Counters"
          value={stats?.activeCounters || 0}
          subtitle="Serving right now"
          icon={Store}
          color="teal"
        />
        <StatCard
          title="Today's Tokens"
          value={stats?.todayTokens || 0}
          subtitle={`${stats?.completedRequestsToday || 0} completed`}
          icon={Layers}
          color="blue"
          trend="+18 today"
        />
        <StatCard
          title="Pending CAD Requests"
          value={stats?.pendingCadApps || 0}
          subtitle="Awaiting desk review"
          icon={FileCheck}
          color="amber"
        />
        <StatCard
          title="Fee Volume Cleared"
          value={`₹${(stats?.totalFeeCollected || 0).toLocaleString('en-IN')}`}
          subtitle="Total verified receipts"
          icon={CreditCard}
          color="emerald"
        />
        <StatCard
          title="Faculty & Staff"
          value={stats?.totalStaff || 0}
          subtitle="Active campus officers"
          icon={Users}
          color="navy"
        />
        <StatCard
          title="Departments"
          value={stats?.totalDepartments || 0}
          subtitle="Administrative & Academic"
          icon={Building2}
          color="blue"
        />
        <Link to="/admin/appointments" className="block text-left transition-transform hover:-translate-y-0.5">
          <StatCard
            title="Active Appointments"
            value={stats?.activeAppointments || 0}
            subtitle="Adm Cell & Faculty desk"
            icon={Clock}
            color="teal"
          />
        </Link>
      </div>

      {/* Charts Section: Peak Queue Hours & Department Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Queue Hours Area Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Peak Queue Traffic Hours</h3>
              <p className="text-xs text-slate-500">Hourly token booking volume & average wait time</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-700 text-[10px] font-bold">
              Today's Flow
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.peakHoursData || []}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="tokens" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#tokenGradient)" name="Tokens Booked" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Usage Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Department Service Volume</h3>
              <p className="text-xs text-slate-500">Total tokens served by campus department</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
              Breakdown
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.departmentUsageData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="tokens" fill="#1E3A8A" radius={[6, 6, 0, 0]} name="Tokens Served" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables: Live Tokens Feed & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Token Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Live Campus Queue Stream</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Token</th>
                  <th className="py-2.5 px-3 font-semibold">Counter</th>
                  <th className="py-2.5 px-3 font-semibold">Service</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTokens?.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.tokenNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.counterDetails?.name || t.counter?.name || 'Counter'}</td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-[120px] truncate">{t.serviceType}</td>
                    <td className="py-2.5 px-3"><Badge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Logs Feed */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Security & Operational Audit Logs</h3>
            <span className="text-xs text-slate-400">SHA-256 Verified</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {recentAuditLogs?.map((log, idx) => (
              <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-slate-900">{log.action}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-semibold">
                      {log.module}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    By <span className="font-medium text-slate-800">{log.performedByName}</span> • {log.targetResource}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

