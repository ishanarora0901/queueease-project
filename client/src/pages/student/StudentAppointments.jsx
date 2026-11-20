import React, { useState, useEffect } from 'react';
import { staffApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';
import {
  Users,
  Search,
  Calendar,
  Clock,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const StudentAppointments = () => {
  const [staffList, setStaffList] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Booking Modal State
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('11:00 AM - 11:30 AM');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const { socket } = useSocket();

  const loadData = async () => {
    try {
      const [staffRes, aptRes] = await Promise.all([
        staffApi.getStaffList({ search: searchTerm, department: selectedDept }),
        staffApi.getStudentAppointments(),
      ]);

      if (staffRes.data.success) setStaffList(staffRes.data.staff || []);
      if (aptRes.data.success) setMyAppointments(aptRes.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedDept]);

  // Listen to staff availability socket events
  useEffect(() => {
    if (!socket) return;
    const handleAvailabilityChange = () => {
      loadData();
    };
    socket.on('staff_availability_changed', handleAvailabilityChange);
    return () => {
      socket.off('staff_availability_changed', handleAvailabilityChange);
    };
  }, [socket]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !purpose) return;

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await staffApi.bookAppointment({
        teacherId: selectedTeacher._id,
        departmentId: selectedTeacher.staffDetails?.department?._id || selectedTeacher.staffDetails?.department,
        date,
        timeSlot,
        purpose,
        notes,
      });

      if (res.data.success) {
        setSelectedTeacher(null);
        setPurpose('');
        setNotes('');
        loadData();
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await staffApi.updateAppointmentStatus(id, {
        status: 'cancelled',
        statusReason: 'Cancelled by student',
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  if (loading && staffList.length === 0) {
    return <LoadingSpinner text="Connecting to faculty directory..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty & Staff Availability</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View live teacher schedules, office hours, and book digital appointments before visiting cabins
        </p>
      </div>

      {/* Search & Department Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teacher by name or designation..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none text-slate-700 font-medium"
        >
          <option value="">All Departments</option>
          <option value="Admission">Admission Office (Admissions & Fees)</option>
          <option value="Admin">Administrative Cell (Dean & CAD)</option>
          <option value="Computer Science">Computer Science & Engineering</option>
          <option value="Accounts">Accounts & Fee Section</option>
          <option value="Exam">Examination Cell</option>
          <option value="Library">Library Services</option>
        </select>
      </div>

      {/* Faculty Cards Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          Faculty Directory ({staffList.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => {
            const status = staff.staffDetails?.availabilityStatus || 'available';
            const isAvail = status === 'available';

            return (
              <div
                key={staff._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm overflow-hidden shrink-0">
                        {staff.avatar ? (
                          <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          staff.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">{staff.name}</h3>
                          {(staff.role === 'admin' ||
                            (staff.staffDetails?.departmentName || '').toLowerCase().includes('admin') ||
                            (staff.staffDetails?.departmentName || '').toLowerCase().includes('cad')) && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 text-[9px] font-bold tracking-wide uppercase">
                              Adm. Cell
                            </span>
                          )}
                          {((staff.staffDetails?.departmentName || '').toLowerCase().includes('admission') ||
                            (staff.staffDetails?.departmentName || '').toLowerCase().includes('fee') ||
                            (staff.staffDetails?.designation || '').toLowerCase().includes('admission')) && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold tracking-wide uppercase">
                              Admission Office
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-teal-700 font-semibold">{staff.staffDetails?.designation || 'Faculty Member'}</p>
                      </div>
                    </div>
                    <Badge status={status} />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{staff.staffDetails?.departmentName || 'Academic Department'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{staff.staffDetails?.officeLocation || 'Main Campus'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {staff.staffDetails?.workingHours?.start || '09:00 AM'} -{' '}
                        {staff.staffDetails?.workingHours?.end || '05:00 PM'}
                      </span>
                    </p>
                  </div>

                  {status === 'busy' && (
                    <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ⚠️ {staff.staffDetails?.statusNote || 'In meeting'} (Reopening: {staff.staffDetails?.expectedReopenTime || 'Shortly'})
                    </p>
                  )}
                  {status === 'lunch_break' && (
                    <p className="text-[11px] text-orange-700 mt-2 bg-orange-50 p-2 rounded-lg border border-orange-200">
                      🍱 Lunch hour until {staff.staffDetails?.expectedReopenTime || '02:00 PM'}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Available Mon-Fri</span>
                  <button
                    onClick={() => setSelectedTeacher(staff)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Scheduled Appointments */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">My Booked Appointments</h3>

        {myAppointments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No appointments booked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ref Number</th>
                  <th className="py-3 px-4 font-semibold">Teacher</th>
                  <th className="py-3 px-4 font-semibold">Purpose</th>
                  <th className="py-3 px-4 font-semibold">Date & Slot</th>
                  <th className="py-3 px-4 font-semibold">Cabin Location</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAppointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{apt.appointmentNumber}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{apt.teacherDetails?.name || 'Faculty'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{apt.purpose}</td>
                    <td className="py-3 px-4 text-slate-500">{apt.date} • {apt.timeSlot}</td>
                    <td className="py-3 px-4 text-slate-600">{apt.officeLocation || 'Main Block'}</td>
                    <td className="py-3 px-4"><Badge status={apt.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelAppointment(apt._id)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {selectedTeacher && (
        <Modal
          isOpen={!!selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          title={`Book Appointment: ${selectedTeacher.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">{selectedTeacher.name}</p>
              <p className="text-[11px] text-slate-500">{selectedTeacher.staffDetails?.designation} • {selectedTeacher.staffDetails?.officeLocation}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                >
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                  <option value="03:00 PM - 03:30 PM">03:00 PM - 03:30 PM</option>
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose of Visit</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Major Project Synopsis Review / Doubt Discussion"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Additional Notes for Faculty</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific documents or references you will be carrying..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bookingLoading}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50"
              >
                {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

