import React, { useState, useEffect } from 'react';
import { counterApi } from '../../api/queueApi';
import { adminApi } from '../../api/campusApis';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { Building2, Plus, Clock, MapPin, Mail, Phone, CheckCircle } from 'lucide-react';

export const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'administrative',
    description: '',
    building: 'Main Administrative Block',
    floor: 'Ground Floor',
    email: '',
    phone: '',
    servicesOffered: 'Bonafide, Transcripts, ID Card',
  });
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    try {
      // Re-use counters api to get populated departments or query departments
      const res = await counterApi.getAllCounters();
      if (res.data.success) {
        const uniqueDepts = [];
        const seen = new Set();
        (res.data.counters || []).forEach((c) => {
          if (c.departmentDetails && !seen.has(c.departmentDetails._id)) {
            seen.add(c.departmentDetails._id);
            uniqueDepts.push(c.departmentDetails);
          }
        });
        setDepartments(uniqueDepts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.createDepartment({
        ...formData,
        servicesOffered: formData.servicesOffered.split(',').map((s) => s.trim()),
      });
      if (res.data.success) {
        setAddModalOpen(false);
        setFormData({
          name: '',
          code: '',
          category: 'administrative',
          description: '',
          building: 'Main Administrative Block',
          floor: 'Ground Floor',
          email: '',
          phone: '',
          servicesOffered: '',
        });
        loadDepartments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Department Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure administrative wings, academic departments, examination cells, and service hours
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div key={dept._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                  {dept.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                  {dept.category || 'Administrative'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 mb-1">{dept.name}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{dept.description || 'Core campus service department.'}</p>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept.building} • {dept.floor}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>09:00 AM – 05:00 PM (Lunch: 01:00 PM – 02:00 PM)</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Active in ERP
              </span>
              <span>Updated Today</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Create New Department" maxWidth="max-w-md">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Training & Placement Cell"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="TPC"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              >
                <option value="administrative">Administrative</option>
                <option value="academic">Academic</option>
                <option value="finance">Finance / Accounts</option>
                <option value="examination">Examination</option>
                <option value="services">Services / Facilities</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Building & Location</label>
            <input
              type="text"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Services Offered (Comma-separated)</label>
            <input
              type="text"
              value={formData.servicesOffered}
              onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
              placeholder="Internship Letters, Placement NOC, Verification"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

