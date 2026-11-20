import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Shield, Bell, Clock, Building } from 'lucide-react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    institutionName: 'Apex Institute of Technology & Science',
    accreditation: 'Accredited by NAAC Grade "A+" | Affiliated to State University',
    supportEmail: 'support@queueease.edu',
    supportPhone: '011-2345-6780',
    noShowGraceMinutes: '15',
    maxTokensPerStudentPerDay: '3',
    enableSocketAlerts: true,
    enableEmailReceipts: true,
    autoLunchBreakToggle: true,
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System & Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure campus administrative parameters, queue rules, grace periods, and branding
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {saved && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Platform settings saved and pushed to campus servers.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* University Branding */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600" />
              University Identity & Certificates
            </h3>
            <p className="text-slate-500 mb-3 text-[11px]">Reflected on generated PDF fee receipts and CAD certificates</p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  name="institutionName"
                  value={settings.institutionName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Accreditation Tagline</label>
                <input
                  type="text"
                  name="accreditation"
                  value={settings.accreditation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Helpdesk Support Email</label>
                  <input
                    type="email"
                    name="supportEmail"
                    value={settings.supportEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    name="supportPhone"
                    value={settings.supportPhone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Queue Rules */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Smart Queue Automated Rules
            </h3>
            <p className="text-slate-500 mb-3 text-[11px]">System behavior for missed turns and automated no-show triggers</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Automatic No-Show Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  name="noShowGraceMinutes"
                  value={settings.noShowGraceMinutes}
                  onChange={handleChange}
                  min={5}
                  max={60}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Grace time before student token is marked as absent</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Max Active Tokens Per Student Per Day
                </label>
                <input
                  type="number"
                  name="maxTokensPerStudentPerDay"
                  value={settings.maxTokensPerStudentPerDay}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Prevents hoarding slots across counters</p>
              </div>
            </div>
          </div>

          {/* Real-time Toggles */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              Real-Time Sockets & Alerts
            </h3>
            <p className="text-slate-500 mb-3 text-[11px]">Broadcast configurations for live turn alerts and notifications</p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enableSocketAlerts"
                  checked={settings.enableSocketAlerts}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-800">
                  Enable Socket.io instant turn approach alerts and chime sounds
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enableEmailReceipts"
                  checked={settings.enableEmailReceipts}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-800">
                  Automatically email official PDF receipts upon fee payment
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="autoLunchBreakToggle"
                  checked={settings.autoLunchBreakToggle}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-800">
                  Automatically switch counter status to Lunch Break at 01:00 PM
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-teal-400" /> Save Platform Configuration
          </button>
        </form>
      </div>
    </div>
  );
};

