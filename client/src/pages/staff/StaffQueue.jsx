import React, { useState, useEffect } from 'react';
import { queueApi, counterApi } from '../../api/queueApi';
import { Badge } from '../../components/common/Badge';
import { QRScannerModal } from '../../components/common/QRScannerModal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  Volume2,
  CheckCircle2,
  SkipForward,
  UserX,
  QrCode,
  Users,
  RefreshCw,
  Clock,
  AlertCircle,
  Play,
} from 'lucide-react';

export const StaffQueue = () => {
  const { user } = useAuth();
  const [counters, setCounters] = useState([]);
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [queueData, setQueueData] = useState({ tokens: [], counter: null, waitingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [callingToken, setCallingToken] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const { socket } = useSocket();

  const loadCounters = async () => {
    try {
      const res = await counterApi.getAllCounters();
      if (res.data.success) {
        const list = res.data.counters || [];
        setCounters(list);
        if (list.length > 0 && !selectedCounterId) {
          // Default to assigned counter if matches current staff
          const mine = list.find((c) => c.assignedStaff?._id === user?.id || c.assignedStaff?._id === user?._id);
          const initialId = mine ? mine._id : list[0]._id;
          setSelectedCounterId(initialId);
          fetchQueue(initialId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async (counterId) => {
    if (!counterId) return;
    try {
      const res = await queueApi.getCounterQueue(counterId);
      if (res.data.success) {
        setQueueData(res.data);
        // Look for currently called or serving token
        const active = res.data.tokens?.find((t) => ['called', 'serving'].includes(t.status));
        setCallingToken(active || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCounters();
  }, []);

  // Listen to live queue changes
  useEffect(() => {
    if (!socket || !selectedCounterId) return;

    socket.emit('join_counter_room', selectedCounterId);

    const handleQueueUpdate = () => {
      fetchQueue(selectedCounterId);
    };

    socket.on('queue_updated', handleQueueUpdate);

    return () => {
      socket.off('queue_updated', handleQueueUpdate);
    };
  }, [socket, selectedCounterId]);

  const handleCounterSelect = (id) => {
    setSelectedCounterId(id);
    fetchQueue(id);
  };

  const handleCallNext = async () => {
    if (!selectedCounterId) return;
    setActionLoading(true);
    try {
      const res = await queueApi.callNextToken(selectedCounterId);
      if (res.data.success) {
        setCallingToken(res.data.token);
        fetchQueue(selectedCounterId);
        // Play gentle audio beep if supported
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
      }
    } catch (err) {
      alert(err.response?.data?.message || 'No waiting tokens in the queue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!callingToken) return;
    setActionLoading(true);
    try {
      await queueApi.updateTokenStatus(callingToken._id, {
        status,
        remarks: `Marked as ${status} by counter officer`,
      });
      setCallingToken(null);
      fetchQueue(selectedCounterId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update token status.');
    } finally {
      setActionLoading(false);
    }
  };

  const waitingTokens = queueData.tokens?.filter((t) => t.status === 'waiting') || [];

  if (loading && counters.length === 0) {
    return <LoadingSpinner text="Connecting to counter queue..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Top Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Managing Counter</span>
          <div className="flex items-center gap-2 mt-0.5">
            <select
              value={selectedCounterId}
              onChange={(e) => handleCounterSelect(e.target.value)}
              className="text-base font-bold text-slate-900 border-none bg-transparent focus:ring-0 cursor-pointer p-0"
            >
              {counters.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.counterNumber} – {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
          >
            <QrCode className="w-4 h-4 text-teal-700" />
            Verify Student QR
          </button>
          <button
            onClick={() => fetchQueue(selectedCounterId)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Calling Stage */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Active Calling Box */}
          <div className="w-full lg:w-2/3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></span>
              <span className="text-xs uppercase font-bold tracking-widest text-teal-400">
                Active Student at Counter
              </span>
            </div>

            {callingToken ? (
              <div className="mt-2 space-y-3">
                <div className="flex items-baseline gap-4">
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                    {callingToken.tokenNumber}
                  </h2>
                  <Badge status={callingToken.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Student Name:</span>
                    <span className="font-bold text-slate-100 text-sm">
                      {callingToken.studentName || callingToken.studentDetails?.name || callingToken.student?.name || 'Student'}
                    </span>
                    <span className="text-teal-400 font-mono block text-xs mt-0.5">
                      UID: {callingToken.uid || callingToken.studentDetails?.rollNumber || callingToken.student?.studentDetails?.rollNumber || 'CS2023089'}
                    </span>
                    {(callingToken.studentClass || callingToken.semester) && (
                      <span className="text-slate-300 block text-[11px] mt-1">
                        {callingToken.studentClass} • {callingToken.semester}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Service Requested:</span>
                    <span className="font-bold text-slate-100 text-sm">{callingToken.serviceType}</span>
                    <span className="text-slate-400 block text-xs mt-0.5">
                      Booked for: {callingToken.timeSlot}
                    </span>
                    {callingToken.totalFees > 0 && (
                      <span className="text-emerald-400 font-bold block text-xs mt-1 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded w-fit">
                        Total Fees: ₹{Number(callingToken.totalFees).toLocaleString('en-IN')} ({callingToken.paymentMode === 'online' ? 'Paid Online' : 'Pay at Counter'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Counter Calling Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Served & Completed
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('skipped')}
                    disabled={actionLoading}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    title="Student absent at counter"
                  >
                    <SkipForward className="w-4 h-4" /> Skip Student
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('no_show')}
                    disabled={actionLoading}
                    className="py-3 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold text-xs border border-rose-800/60 transition-colors flex items-center gap-1 disabled:opacity-50"
                    title="Grace period expired"
                  >
                    <UserX className="w-4 h-4" /> No-Show
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <h3 className="text-2xl font-bold text-slate-300">Counter Desk is Idle</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  There is no student currently at the desk. Click "Call Next Token" to call the next waiting student into the counter.
                </p>
                <div className="mt-5">
                  <button
                    onClick={handleCallNext}
                    disabled={actionLoading || waitingTokens.length === 0}
                    className="py-3 px-6 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Volume2 className="w-5 h-5" />
                    Call Next Token ({waitingTokens.length} Waiting)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics right */}
          <div className="w-full lg:w-1/3 bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 text-left space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Queue Backlog</span>
              <h4 className="text-3xl font-black text-white">{waitingTokens.length}</h4>
              <p className="text-[11px] text-slate-400">Students waiting in line today</p>
            </div>
            <div className="pt-3 border-t border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400">Today's Completed</span>
              <h4 className="text-2xl font-bold text-emerald-400">
                {queueData.counter?.dailyServedCount || 0} Served
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Waiting Tokens Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900">
            Waiting Queue ({waitingTokens.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Auto-sorted by priority & booking time</span>
        </div>

        {waitingTokens.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No students currently waiting for this counter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Token</th>
                  <th className="py-3 px-4 font-semibold">Student & UID</th>
                  <th className="py-3 px-4 font-semibold">Class / Sem</th>
                  <th className="py-3 px-4 font-semibold">Service / Fees</th>
                  <th className="py-3 px-4 font-semibold">Time Slot</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingTokens.map((t, idx) => (
                  <tr key={t._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-500">#{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.tokenNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{t.studentName || t.studentDetails?.name || t.student?.name || 'Student'}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{t.uid || t.studentDetails?.rollNumber || t.student?.studentDetails?.rollNumber || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{t.studentClass || 'Standard Course'}</span>
                      <span className="text-slate-400 text-[11px] block">{t.semester || 'Semester 4'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 font-medium block">{t.serviceType}</span>
                      {t.totalFees > 0 && (
                        <span className="text-emerald-700 font-bold text-[11px]">
                          ₹{Number(t.totalFees).toLocaleString('en-IN')} ({t.paymentMode === 'online' ? 'Paid' : 'At Counter'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{t.timeSlot}</td>
                    <td className="py-3 px-4">
                      {t.priority === 'rejoined' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          Rejoined Turn
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        mode="token"
        onVerified={() => {
          fetchQueue(selectedCounterId);
        }}
      />
    </div>
  );
};

