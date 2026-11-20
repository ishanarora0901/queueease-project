import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { queueApi, counterApi } from '../../api/queueApi';
import { staffApi, cadApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';
import {
  Clock,
  Users,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Coffee,
  ArrowRight,
  Shield,
  Phone,
  Calendar,
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user, updateUserProfile } = useAuth();
  const { socket } = useSocket();
  const [counters, setCounters] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [cadApplications, setCadApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Availability control state
  const [availStatus, setAvailStatus] = useState(
    user?.staffDetails?.availabilityStatus || 'available'
  );
  const [expectedReopen, setExpectedReopen] = useState(
    user?.staffDetails?.expectedReopenTime || ''
  );
  const [statusNote, setStatusNote] = useState(
    user?.staffDetails?.statusNote || ''
  );
  const [savingAvail, setSavingAvail] = useState(false);

  const loadData = async () => {
    try {
      const [countersRes, aptRes, cadRes] = await Promise.all([
        counterApi.getAllCounters(),
        staffApi.getStaffAppointments(),
        cadApi.getAllApplications(),
      ]);

      if (countersRes.data.success) setCounters(countersRes.data.counters || []);
      if (aptRes.data.success) setAppointments(aptRes.data.appointments || []);
      if (cadRes.data.success) setCadApplications(cadRes.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      loadData();
    };
    socket.on('new_appointment', handleRefresh);
    socket.on('appointment_created_alert', handleRefresh);
    return () => {
      socket.off('new_appointment', handleRefresh);
      socket.off('appointment_created_alert', handleRefresh);
    };
  }, [socket]);

  const handleUpdateAvailability = async (e) => {
    e?.preventDefault();
    setSavingAvail(true);
    try {
      const res = await staffApi.updateAvailability({
        availabilityStatus: availStatus,
        expectedReopenTime: expectedReopen,
        statusNote,
      });
      if (res.data.success) {
        updateUserProfile({
          ...user,
          staffDetails: {
            ...user.staffDetails,
            availabilityStatus: availStatus,
            expectedReopenTime: expectedReopen,
            statusNote,
          },
        });
        alert('Availability status updated and broadcasted in real time.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setSavingAvail(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Connecting to Staff Command Desk..." />;
  }

  // Assigned counter if any
  const assignedCounter = counters.find(
    (c) => c.assignedStaff?._id === user?.id || c.assignedStaff?._id === user?._id
  ) || counters[0];

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Staff Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
              Staff / Faculty Command Desk
            </span>
            <span className="text-xs text-slate-400">
              Emp ID: {user?.staffDetails?.employeeId || 'FAC-2026'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {user?.staffDetails?.designation || 'Faculty Member'} • {user?.staffDetails?.officeLocation || 'Main Campus'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/staff/queue"
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" /> Open Queue Desk
          </Link>
          <Link
            to="/staff/cad"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            Review CAD ({cadApplications.filter((c) => ['Submitted', 'Under Review'].includes(c.status)).length})
          </Link>
        </div>
      </div>

      {/* Real-Time Availability Control Card */}
      <div className="bg-white rounded-2xl p-6 border-2 border-teal-600/30 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Availability Control
            </h3>
            <p className="text-xs text-slate-500">
              Your status reflects immediately on the student portal and counter displays
            </p>
          </div>
          <Badge status={availStatus} />
        </div>

        <form onSubmit={handleUpdateAvailability} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
            <select
              value={availStatus}
              onChange={(e) => setAvailStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="available">🟢 Available at Desk</option>
              <option value="busy">🟡 Busy in Meeting</option>
              <option value="lunch_break">🍱 On Lunch Break</option>
              <option value="temporarily_unavailable">🟠 Temporarily Unavailable</option>
              <option value="on_leave">🔴 On Approved Leave</option>
              <option value="absent">⚫ Absent Today</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expected Reopening / Return</label>
            <input
              type="text"
              value={expectedReopen}
              onChange={(e) => setExpectedReopen(e.target.value)}
              placeholder="e.g. 02:00 PM or 30 Mins"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Note for Students</label>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Academic Council meeting"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingAvail}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              {savingAvail ? 'Updating...' : 'Update & Broadcast'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid: Counter & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Counter Quick View */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Assigned Counter Oversight</h3>
              <p className="text-xs text-slate-500">{assignedCounter?.name}</p>
            </div>
            <Link to="/staff/queue" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              Go to Calling Screen <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Counter Number</span>
              <h4 className="text-xl font-black text-slate-900">{assignedCounter?.counterNumber}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Hours: {assignedCounter?.operatingHours?.open} – {assignedCounter?.operatingHours?.close}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Students Served Today</span>
              <p className="text-2xl font-black text-teal-600">{assignedCounter?.dailyServedCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Student Appointments</h3>
              <p className="text-xs text-slate-500">Upcoming scheduled cabin visits</p>
            </div>
            <Link to="/staff/appointments" className="text-xs font-semibold text-teal-700 hover:underline">
              View All ({appointments.length})
            </Link>
          </div>

          {appointments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No student appointments scheduled.</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 3).map((apt) => (
                <div key={apt._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{apt.student?.name || apt.studentDetails?.name || 'Student'}</p>
                    <p className="text-[11px] text-slate-500">{apt.purpose}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Time: {apt.date} • {apt.timeSlot}</p>
                  </div>
                  <Badge status={apt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

