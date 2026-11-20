import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  Mail,
  Shield,
  GraduationCap,
} from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Add User Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    rollNumber: '',
    designation: '',
    department: 'Computer Science',
  });
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await adminApi.getAllUsers({ role: roleFilter, search: searchTerm });
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, searchTerm]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminApi.updateUserStatus(id, { status: newStatus });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      await adminApi.deleteUser(id);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        studentDetails: formData.role === 'student' ? {
          rollNumber: formData.rollNumber,
          department: formData.department,
        } : undefined,
        staffDetails: formData.role === 'staff' ? {
          designation: formData.designation,
          departmentName: formData.department,
        } : undefined,
      };

      const res = await adminApi.createUser(payload);
      if (res.data.success) {
        setAddModalOpen(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'student',
          phone: '',
          rollNumber: '',
          designation: '',
          department: 'Computer Science',
        });
        loadUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner text="Accessing User Directory..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer student enrollments, faculty accounts, administrative credentials, and access roles
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          Add Campus Account
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or student roll number..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          {['', 'student', 'staff', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                roleFilter === role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {role || 'All Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">Registered Accounts ({users.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Identifier</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {u.name?.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-semibold text-slate-800">{u.role}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {u.studentDetails?.rollNumber || u.staffDetails?.employeeId || 'System Admin'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={u.status || 'active'} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus(u._id, u.status || 'active')}
                      className={`text-[11px] font-semibold ${
                        u.status === 'suspended' ? 'text-emerald-600 hover:underline' : 'text-amber-600 hover:underline'
                      }`}
                    >
                      {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="text-[11px] font-semibold text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Create Campus Account" maxWidth="max-w-md">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="staff">Staff / Faculty</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {formData.role === 'student' ? 'Roll Number' : 'Designation'}
              </label>
              <input
                type="text"
                value={formData.role === 'student' ? formData.rollNumber : formData.designation}
                onChange={(e) =>
                  setFormData(
                    formData.role === 'student'
                      ? { ...formData, rollNumber: e.target.value }
                      : { ...formData, designation: e.target.value }
                  )
                }
                placeholder={formData.role === 'student' ? 'CS2023099' : 'Assistant Professor'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              />
            </div>
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
              disabled={creating}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

