import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { staffApi } from '../../api/campusApis';
import { Clock, Calendar, CheckCircle2, Shield } from 'lucide-react';

export const StaffSchedule = () => {
  const { user, updateUserProfile } = useAuth();

  const [workingStart, setWorkingStart] = useState(user?.staffDetails?.workingHours?.start || '09:00 AM');
  const [workingEnd, setWorkingEnd] = useState(user?.staffDetails?.workingHours?.end || '05:00 PM');
  const [lunchStart, setLunchStart] = useState(user?.staffDetails?.lunchHours?.start || '01:00 PM');
  const [lunchEnd, setLunchEnd] = useState(user?.staffDetails?.lunchHours?.end || '02:00 PM');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await staffApi.updateAvailability({
        availabilityStatus: user?.staffDetails?.availabilityStatus || 'available',
        workingHours: { start: workingStart, end: workingEnd },
        lunchHours: { start: lunchStart, end: lunchEnd },
      });

      if (res.data.success) {
        updateUserProfile({
          ...user,
          staffDetails: {
            ...user.staffDetails,
            workingHours: { start: workingStart, end: workingEnd },
            lunchHours: { start: lunchStart, end: lunchEnd },
          },
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Working Schedule & Breaks</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your daily cabin availability, consultation slots, and scheduled lunch hours
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {saved && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Schedule hours updated successfully and synchronized campus-wide.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              General Working Hours
            </h3>
            <p className="text-slate-500 mb-3 text-[11px]">Normal operating window when students may book appointments</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift Start</label>
                <input
                  type="text"
                  value={workingStart}
                  onChange={(e) => setWorkingStart(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift End</label>
                <input
                  type="text"
                  value={workingEnd}
                  onChange={(e) => setWorkingEnd(e.target.value)}
                  placeholder="05:00 PM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              Daily Lunch Break Window
            </h3>
            <p className="text-slate-500 mb-3 text-[11px]">Counter is automatically marked on lunch break during this period</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lunch Start</label>
                <input
                  type="text"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  placeholder="01:00 PM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lunch End / Reopen</label>
                <input
                  type="text"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  placeholder="02:00 PM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving Hours...' : 'Save Schedule Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

