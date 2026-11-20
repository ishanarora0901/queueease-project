import React, { useState, useEffect } from 'react';
import { counterApi } from '../../api/queueApi';
import { adminApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { Store, Plus, Clock, Users, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminCounters = () => {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCounter, setEditCounter] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [statusReason, setStatusReason] = useState('');
  const [expectedReopen, setExpectedReopen] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadCounters = async () => {
    try {
      const res = await counterApi.getAllCounters();
      if (res.data.success) {
        setCounters(res.data.counters || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounters();
  }, []);

  const handleEditClick = (counter) => {
    setEditCounter(counter);
    setSelectedStatus(counter.status);
    setStatusReason(counter.statusReason || '');
    setExpectedReopen(counter.expectedReopenTime || '');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editCounter) return;
    setUpdating(true);
    try {
      const res = await counterApi.updateCounterStatus(editCounter._id, {
        status: selectedStatus,
        statusReason,
        expectedReopenTime: expectedReopen,
      });
      if (res.data.success) {
        setEditCounter(null);
        loadCounters();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update counter');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && counters.length === 0) {
    return <LoadingSpinner text="Loading campus counters..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Counter Operations & Staffing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure administrative service desks, assign counter officers, and manage operating schedules
          </p>
        </div>

        <button
          onClick={loadCounters}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
          title="Refresh counters"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {counters.map((c) => (
          <div key={c._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                  {c.counterNumber}
                </span>
                <Badge status={c.status} />
              </div>

              <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dept: <span className="font-semibold text-slate-700">{c.departmentDetails?.name || 'Administrative'}</span>
              </p>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 my-4">
                <p>
                  <span className="text-slate-400">Assigned Officer:</span>{' '}
                  <span className="font-semibold text-slate-800">{c.staffDetails?.name || 'Unassigned'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Hours:</span>{' '}
                  <span>{c.operatingHours?.open} – {c.operatingHours?.close}</span>
                </p>
                <p>
                  <span className="text-slate-400">Lunch Break:</span>{' '}
                  <span>{c.operatingHours?.lunchStart || '01:00 PM'} – {c.operatingHours?.lunchEnd || '02:00 PM'}</span>
                </p>
                <p>
                  <span className="text-slate-400">Avg Service:</span>{' '}
                  <span className="font-mono">{c.avgServiceTimeMinutes || 10} Mins</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Today's Served</span>
                <span className="text-base font-black text-teal-700">{c.dailyServedCount || 0} Students</span>
              </div>
              <button
                onClick={() => handleEditClick(c)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                Change Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Counter Status Modal */}
      {editCounter && (
        <Modal
          isOpen={!!editCounter}
          onClose={() => setEditCounter(null)}
          title={`Override Status: ${editCounter.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Counter Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none"
              >
                <option value="open">🟢 Open & Actively Serving</option>
                <option value="lunch_break">🍱 On Scheduled Lunch Break</option>
                <option value="temporarily_unavailable">🟠 Temporarily Unavailable</option>
                <option value="staff_absent">🔴 Staff Absent Today</option>
                <option value="closed">⚫ Closed for Session</option>
                <option value="maintenance">🛠️ Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Reopening Time</label>
              <input
                type="text"
                value={expectedReopen}
                onChange={(e) => setExpectedReopen(e.target.value)}
                placeholder="e.g. 02:00 PM"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Reason / Announcement</label>
              <input
                type="text"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="e.g. Technical server update in Accounts Section"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditCounter(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update & Broadcast'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

