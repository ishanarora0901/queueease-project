import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

// Admin pages
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminDepartments } from '../pages/admin/AdminDepartments';
import { AdminCounters } from '../pages/admin/AdminCounters';
import { AdminQueues } from '../pages/admin/AdminQueues';
import { AdminCadRequests } from '../pages/admin/AdminCadRequests';
import { AdminAppointments } from '../pages/admin/AdminAppointments';
import { AdminPayments } from '../pages/admin/AdminPayments';
import { AdminAuditLogs } from '../pages/admin/AdminAuditLogs';
import { AdminSettings } from '../pages/admin/AdminSettings';

// Student pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentQueue } from '../pages/student/StudentQueue';
import { StudentAppointments } from '../pages/student/StudentAppointments';
import { StudentCad } from '../pages/student/StudentCad';
import { StudentPayments } from '../pages/student/StudentPayments';
import { StudentFeedback } from '../pages/student/StudentFeedback';

// Staff pages
import { StaffDashboard } from '../pages/staff/StaffDashboard';
import { StaffQueue } from '../pages/staff/StaffQueue';
import { StaffAppointments } from '../pages/staff/StaffAppointments';
import { StaffCad } from '../pages/staff/StaffCad';
import { StaffSchedule } from '../pages/staff/StaffSchedule';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Dedicated Admin Login */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Dedicated Admin Portal Routes (Strictly Role: admin) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="counters" element={<AdminCounters />} />
        <Route path="queues" element={<AdminQueues />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="cad-requests" element={<AdminCadRequests />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Main Student & Staff Layout */}
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<Navigate to="/login" replace />} />

        {/* Student Routes */}
        <Route
          path="student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/queue"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/appointments"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/cad"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentCad />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/payments"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/admission"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="student/feedback"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentFeedback />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/queue"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/appointments"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/cad"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffCad />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/schedule"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffSchedule />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

