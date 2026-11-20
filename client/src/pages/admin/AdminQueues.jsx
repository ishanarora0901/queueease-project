import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { Layers, Search, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export const AdminQueues = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Override Modal
  const [selectedToken, setSelectedToken] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('waiting');
  const [overridePriority, setOverridePriority] = useState('normal');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const loadQueues = async () => {
    try {
      const res = await adminApi.getCampusWideQueues();
      if (res.data.success) {
        setTokens(res.data.tokens || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
  }, []);

  const handleOpenOverride = (token) => {
    setSelectedToken(token);
    setOverrideStatus(token.status);
    setOverridePriority(token.priority || 'normal');
    setRemarks('');
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedToken) return;

    setSaving(true);
    try {
      const res = await adminApi.overrideToken(selectedToken._id, {
        status: overrideStatus,
        priority: overridePriority,
        remarks: remarks || 'Administrative manual override',
      });

      if (res.data.success) {
        setSelectedToken(null);
        loadQueues();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Override failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      t.tokenNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.studentDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.studentDetails?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  if (loading && tokens.length === 0) {
    return <LoadingSpinner text="Aggregating campus-wide queues..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Queue Oversight & Overrides</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-counter token monitoring with executive override privileges and audit trails
          </p>
        </div>

        <button
          onClick={loadQueues}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
          title="Refresh Queues"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by token (e.g. CAD-042) or student name/roll..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['', 'waiting', 'calling', 'serving', 'completed', 'skipped', 'no_show', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                statusFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Campus Queue Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">All Campus Tokens ({filteredTokens.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Token</th>
                <th className="py-3 px-4 font-semibold">Counter</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Service Type</th>
                <th className="py-3 px-4 font-semibold">Date & Slot</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTokens.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.tokenNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{t.counterDetails?.name || t.counter?.name || 'Counter'}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {t.studentDetails?.name || t.student?.name || 'Student'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{t.serviceType}</td>
                  <td className="py-3 px-4 text-slate-500">{t.bookedDate} • {t.timeSlot}</td>
                  <td className="py-3 px-4 font-semibold capitalize text-teal-800">{t.priority || 'Normal'}</td>
                  <td className="py-3 px-4"><Badge status={t.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenOverride(t)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Override Modal */}
      {selectedToken && (
        <Modal
          isOpen={!!selectedToken}
          onClose={() => setSelectedToken(null)}
          title={`Administrative Override: ${selectedToken.tokenNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">{selectedToken.tokenNumber} – {selectedToken.serviceType}</p>
              <p className="text-[11px] text-slate-500">Student: {selectedToken.studentDetails?.name || selectedToken.student?.name}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Override</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              >
                <option value="waiting">Waiting in Queue</option>
                <option value="called">Called to Counter</option>
                <option value="serving">Serving In-Progress</option>
                <option value="completed">Completed & Stamped</option>
                <option value="skipped">Skipped (Absent)</option>
                <option value="no_show">Marked No-Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Queue Priority</label>
              <select
                value={overridePriority}
                onChange={(e) => setOverridePriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              >
                <option value="normal">Normal Priority</option>
                <option value="urgent">Urgent Priority (Next in line)</option>
                <option value="rejoined">Rejoined Missed Turn</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrative Audit Reason</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for administrative override (recorded in audit log)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedToken(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm Override'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

