import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/campusApis';
import { LoadingSpinner } from '../../components/common/StatCard';
import { ShieldCheck, Search, RefreshCw, KeyRound, Clock, Server } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      const res = await adminApi.getAuditLogs({ module: moduleFilter });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  const filteredLogs = logs.filter((l) => {
    return (
      l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.performedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.targetResource?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading && logs.length === 0) {
    return <LoadingSpinner text="Reading security audit trails..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Operational Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system activity logging for compliance, security overrides, and user authentication events
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, actor name, or target resource..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'AUTH', 'QUEUE', 'COUNTER', 'CAD', 'PAYMENT', 'ADMIN'].map((mod) => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                moduleFilter === mod ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {mod || 'All Modules'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">Audit Records ({filteredLogs.length})</h3>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No audit records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Module</th>
                  <th className="py-3 px-4 font-semibold">Performed By</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Target Resource</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, idx) => (
                  <tr key={log._id || idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.performedByName}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{log.performedByRole}</td>
                    <td className="py-3 px-4 font-medium text-teal-800">{log.targetResource || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

