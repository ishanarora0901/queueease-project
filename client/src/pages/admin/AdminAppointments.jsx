import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Building,
  Users,
  RefreshCw,
  AlertCircle,
  Check,
  Shield,
  Phone,
  Mail,
  User,
} from 'lucide-react';

export const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Action Modal State
  const [selectedApt, setSelectedApt] = useState(null);
  const [actionStatus, setActionStatus] = useState('completed');
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const { socket } = useSocket();

  const loadAppointments = async () => {
    try {
      const res = await adminApi.getAppointments({
        department: deptFilter,
        status: statusFilter,
        search: searchTerm,
      });
      if (res.data.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [deptFilter, statusFilter, searchTerm]);

  // Real-time socket listener for incoming appointments
  useEffect(() => {
    if (!socket) return;

    const handleNewAppointment = () => {
      loadAppointments();
    };

    socket.on('new_appointment', handleNewAppointment);
    socket.on('appointment_created_alert', handleNewAppointment);

    return () => {
      socket.off('new_appointment', handleNewAppointment);
      socket.off('appointment_created_alert', handleNewAppointment);
    };
  }, [socket]);

  const handleOpenAction = (apt, defaultStatus = 'completed') => {
    setSelectedApt(apt);
    setActionStatus(defaultStatus);
    setStatusReason('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApt) return;

    setUpdating(true);
    try {
      const res = await adminApi.updateAppointmentStatus(selectedApt._id, {
        status: actionStatus,
        statusReason,
      });

      if (res.data.success) {
        setSelectedApt(null);
        loadAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && appointments.length === 0) {
    return <LoadingSpinner text="Accessing Administrative Cell Appointments..." />;
  }

  const admCellAppointments = appointments.filter((a) => {
    const dept = (a.department?.name || a.departmentDetails?.name || '').toLowerCase();
    const officer = (a.teacher?.staffDetails?.designation || a.teacherDetails?.staffDetails?.designation || '').toLowerCase();
    return dept.includes('admin') || dept.includes('cad') || officer.includes('dean') || officer.includes('administrative');
  });

  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrative Cell & Campus Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized desk overseeing student consultations with Administrative Officers, Dean, and Academic Faculty
          </p>
        </div>

        <button
          onClick={loadAppointments}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Booked</span>
          <h3 className="text-2xl font-black text-slate-900 mt-0.5">{appointments.length}</h3>
          <p className="text-[11px] text-slate-500">All departments</p>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-teal-400">Adm. Cell & CAD</span>
          <h3 className="text-2xl font-black mt-0.5">{admCellAppointments.length}</h3>
          <p className="text-[11px] text-slate-300">Dean & Administrative requests</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Confirmed / Scheduled</span>
          <h3 className="text-2xl font-black text-teal-600 mt-0.5">{confirmedCount}</h3>
          <p className="text-[11px] text-slate-500">Awaiting student visit</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Completed Sessions</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{completedCount}</h3>
          <p className="text-[11px] text-slate-500">Service finalized</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, purpose, or reference number (APT-...)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none font-medium"
        >
          <option value="">All Departments</option>
          <option value="Admission">Admission Office (Admissions & Fees)</option>
          <option value="Administrative">Administrative Dept (CAD)</option>
          <option value="Computer Science">Computer Science & Engg</option>
          <option value="Accounts">Accounts & Fee Section</option>
          <option value="Exam">Examination Cell</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none font-medium"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Appointments Master Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">
          All Student Consultations & Officer Bookings ({appointments.length})
        </h3>

        {appointments.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">
            No appointments found matching the current search criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ref Number</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Roll Number</th>
                  <th className="py-3 px-4 font-semibold">Officer / Faculty</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Date & Slot</th>
                  <th className="py-3 px-4 font-semibold">Purpose</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const student = apt.student || apt.studentDetails;
                  const teacher = apt.teacher || apt.teacherDetails;
                  const dept = apt.department || apt.departmentDetails;

                  return (
                    <tr key={apt._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {apt.appointmentNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {student?.name || 'Student'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {student?.studentDetails?.rollNumber || student?.rollNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{teacher?.name || 'Officer'}</span>
                        <span className="block text-[10px] text-slate-400">
                          {teacher?.staffDetails?.designation || 'Staff'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {dept?.name || teacher?.staffDetails?.departmentName || 'Administrative'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {apt.date} • {apt.timeSlot}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={apt.purpose}>
                        {apt.purpose}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={apt.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {apt.status === 'confirmed' ? (
                          <>
                            <button
                              onClick={() => handleOpenAction(apt, 'completed')}
                              className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-[11px] transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleOpenAction(apt, 'cancelled')}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(apt, apt.status)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                          >
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action / Update Modal */}
      {selectedApt && (
        <Modal
          isOpen={!!selectedApt}
          onClose={() => setSelectedApt(null)}
          title={`Administrative Action: ${selectedApt.appointmentNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900">
                  {selectedApt.student?.name || selectedApt.studentDetails?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Officer / Teacher:</span>
                <span className="font-bold text-slate-900">
                  {selectedApt.teacher?.name || selectedApt.teacherDetails?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Slot:</span>
                <span className="font-medium text-slate-800">{selectedApt.date} • {selectedApt.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purpose:</span>
                <span className="text-slate-700 italic">{selectedApt.purpose}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Set Appointment Status</label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed (Service Provided)</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Administrative Notes / Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Remarks regarding this consultation session..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
