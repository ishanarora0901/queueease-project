import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Layers,
  Clock,
  FileText,
  Users,
  CreditCard,
  MessageSquare,
  LogOut,
  Shield,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isStudent, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: Layers },
    { name: 'Admission Office (Fees)', path: '/student/payments', icon: CreditCard },
    { name: 'CAD Office (Paperwork)', path: '/student/cad', icon: FileText },
    { name: 'Smart Queue', path: '/student/queue', icon: Clock },
    { name: 'Faculty Consultations', path: '/student/appointments', icon: Users },
    { name: 'Feedback', path: '/student/feedback', icon: MessageSquare },
  ];

  const staffLinks = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: Layers },
    { name: 'Queue Manager', path: '/staff/queue', icon: Clock },
    { name: 'Appointments', path: '/staff/appointments', icon: Users },
    { name: 'CAD Review', path: '/staff/cad', icon: FileText },
    { name: 'My Schedule', path: '/staff/schedule', icon: CheckCircle },
  ];

  const navLinks = isStudent ? studentLinks : isStaff && !isAdmin ? staffLinks : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 font-black shadow-md border border-slate-800">
                QE
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                  QueueEase
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    Campus ERP
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
                  Smart Service Management
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Shield className="w-4 h-4 text-blue-700" />
                  Admin Console
                </Link>
              )}
            </nav>
          )}

          {/* Right Header: Notifications & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <NotificationDropdown />

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                {/* Profile Pill */}
                <div className="flex items-center gap-2.5 pl-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[130px] leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium capitalize">
                      {user.role} {user.studentDetails?.rollNumber ? `• ${user.studentDetails.rollNumber}` : ''}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/admin/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && user && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-800"
              >
                <Shield className="w-4 h-4" />
                Admin Console
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

