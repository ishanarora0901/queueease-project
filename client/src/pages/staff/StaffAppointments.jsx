import React, { useState, useEffect } from 'react';
import { staffApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';
import { Calendar, Clock, CheckCircle, XCircle, Users, RefreshCw } from 'lucide-react';

export const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const { socket } = useSocket();

  const loadAppointments = async () => {
    try {
      const res = await staffApi.getStaffAppointments();
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
  }, []);

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

  const handleUpdateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await staffApi.updateAppointmentStatus(id, {
        status,
        statusReason,
      });
      setSelectedApt(null);
      setStatusReason('');
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && appointments.length === 0) {
    return <LoadingSpinner text="Fetching your student appointments..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Student Appointments</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage consultation sessions, project reviews, and student bookings</p>
        </div>
        <button
          onClick={loadAppointments}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">Scheduled Student Consultations ({appointments.length})</h3>

        {appointments.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No student appointments scheduled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ref Number</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Roll Number</th>
                  <th className="py-3 px-4 font-semibold">Purpose</th>
                  <th className="py-3 px-4 font-semibold">Date & Slot</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const student = apt.student || apt.studentDetails;
                  return (
                    <tr key={apt._id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{apt.appointmentNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{student?.name || 'Student'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{student?.studentDetails?.rollNumber || student?.rollNumber || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{apt.purpose}</td>
                      <td className="py-3 px-4 text-slate-500">{apt.date} • {apt.timeSlot}</td>
                      <td className="py-3 px-4"><Badge status={apt.status} /></td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {apt.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(apt._id, 'completed')}
                              className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold hover:bg-teal-100 text-[11px]"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt._id, 'cancelled')}
                              className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 text-[11px]"
                            >
                              Cancel
                            </button>
                          </>
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
    </div>
  );
};

