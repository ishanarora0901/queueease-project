import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { queueApi, counterApi } from '../../api/queueApi';
import { staffApi, cadApi, paymentApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { QRModal } from '../../components/common/QRModal';
import { LoadingSpinner } from '../../components/common/StatCard';
import {
  Clock,
  QrCode,
  Users,
  FileText,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Building,
  RefreshCw,
  Sparkles,
  IndianRupee,
  FileCheck,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTokens, setActiveTokens] = useState([]);
  const [counters, setCounters] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [cadApps, setCadApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRToken, setSelectedQRToken] = useState(null);

  // Verified fee data from UID + Password session
  const [verifiedFeeData, setVerifiedFeeData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('qe_verified_fee');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchDashboardData = async () => {
    try {
      const [tokensRes, countersRes, aptsRes, cadRes] = await Promise.all([
        queueApi.getStudentActiveTokens(),
        counterApi.getAllCounters(),
        staffApi.getStudentAppointments(),
        cadApi.getStudentApplications(),
      ]);

      if (tokensRes.data.success) setActiveTokens(tokensRes.data.tokens || []);
      if (countersRes.data.success) setCounters(countersRes.data.counters || []);
      if (aptsRes.data.success) setAppointments(aptsRes.data.appointments || []);
      if (cadRes.data.success) setCadApps(cadRes.data.applications || []);

      // Check if session has verified fee data
      try {
        const saved = sessionStorage.getItem('qe_verified_fee');
        if (saved) setVerifiedFeeData(JSON.parse(saved));
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading campus offices & dashboard..." />;
  }

  const primaryToken = activeTokens[0];

  return (
    <div className="space-y-8 text-left pb-12">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
              Student Active Session
            </span>
            <span className="text-xs text-slate-400">
              Batch: {user?.studentDetails?.batch || '2023-2027'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Roll No / UID: <span className="font-mono font-bold text-teal-400">{user?.studentDetails?.rollNumber || 'CS2023089'}</span> •{' '}
            {user?.studentDetails?.course || 'B.Tech CSE'} (Semester {user?.studentDetails?.semester || 4})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/student/queue"
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" /> Book Queue Token
          </Link>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CORE DEPARTMENT SELECTOR GATEWAY (Dual Office Structure) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Campus Office Gateway</h2>
            <p className="text-xs text-slate-500">Select where you need assistance: Admission Office or CAD Office</p>
          </div>
          <span className="text-xs text-teal-700 font-bold hidden sm:inline-block">2 Distinct Office Systems</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Office 1: Admission Office (Fees) */}
          <div className="bg-gradient-to-br from-teal-900/90 to-slate-900 text-white rounded-3xl p-6 border border-teal-700/40 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  Office 1 • Fees & Admissions
                </span>
                <span className="text-[11px] text-teal-300 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  Counter 1 Active
                </span>
              </div>

              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Admission Office</h3>
                  <p className="text-xs text-teal-200">College Fees, Dues Clearance & Admissions</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed">
                Manages all college fee transactions (Tuition, Exam, Hostel, Fines), official fee receipts, scholarship
                verification, and admission document checks.
              </p>

              {/* Secure Fee Status Display: Only shows once UID & Password verified */}
              {verifiedFeeData ? (
                <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-teal-500/30 mb-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-teal-500/20">
                    <span className="text-[10px] uppercase font-bold text-teal-300">
                      UID: {verifiedFeeData.student?.rollNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400">✓ Verified Ledger</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div>
                      <span className="text-[10px] text-rose-300 block font-semibold">Bhrne Wali Rehti Hai:</span>
                      <span className="text-base font-black text-rose-400">
                        ₹{verifiedFeeData.totalDue?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 block font-semibold">Aapne Bhr Di Hai:</span>
                      <span className="text-base font-black text-emerald-300">
                        ₹{verifiedFeeData.totalPaid?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/80 rounded-2xl p-3.5 border border-slate-700/80 mb-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-xs block">Fee Ledger Protected</span>
                      <span className="text-[11px] text-slate-300">
                        Enter UID & Password to see pending vs paid fees.
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/student/payments"
                    className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 font-black text-[11px] hover:bg-teal-400 shrink-0"
                  >
                    Unlock
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link
                to="/student/queue"
                className="py-2.5 px-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs text-center shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" /> Book Fee Visit
              </Link>
              <Link
                to="/student/payments"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all flex items-center justify-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5" /> Fee Portal
              </Link>
            </div>
          </div>

          {/* Office 2: CAD Office (Paperwork & Documentation) */}
          <div className="bg-gradient-to-br from-indigo-950/90 to-slate-900 text-white rounded-3xl p-6 border border-indigo-700/40 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Office 2 • Administration & Documentation
                </span>
                <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  Counters 2 & 3 Active
                </span>
              </div>

              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">CAD Office</h3>
                  <p className="text-xs text-indigo-200">Paperwork, Official Certificates & ID Cards</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed">
                Handles all student documentation work: Bonafide certificates, official transcripts, character
                certificates, student ID cards, migration letters, and verification paperwork.
              </p>

              {/* Status pill */}
              <div className="bg-slate-900/80 rounded-2xl p-3 border border-indigo-500/20 mb-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Requests</span>
                  <span className="font-extrabold text-indigo-300 text-sm">
                    {cadApps.length} Document Applications
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Desks</span>
                  <span className="font-semibold text-white">Counters 2 & 3</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link
                to="/student/queue"
                className="py-2.5 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs text-center shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" /> Book CAD Visit
              </Link>
              <Link
                to="/student/cad"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all flex items-center justify-center gap-1"
              >
                <FileCheck className="w-3.5 h-3.5" /> Paperwork Portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Active Token Callout if present */}
      {primaryToken ? (
        <div className="bg-white rounded-3xl border-2 border-teal-600/30 shadow-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-teal-400 font-extrabold flex items-center justify-center text-xl shrink-0 border border-slate-800 shadow-md">
                {primaryToken.tokenNumber}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge status={primaryToken.status} />
                  <span className="text-xs text-slate-400">
                    Slot: {primaryToken.timeSlot}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  {primaryToken.serviceType}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  At <span className="font-semibold text-slate-800">{primaryToken.counter?.name || 'Counter'}</span> (
                  {primaryToken.department?.name || 'Department'})
                </p>
                {primaryToken.totalFees > 0 && (
                  <p className="text-xs font-bold text-teal-700 mt-1">
                    Fees: ₹{Number(primaryToken.totalFees).toLocaleString('en-IN')} (
                    {primaryToken.paymentMode === 'online' ? 'Online Mode' : 'Pay at Counter 1'})
                  </p>
                )}
              </div>
            </div>

            {/* Live Queue Position and Wait Metrics */}
            <div className="flex items-center gap-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="text-center px-3 border-r border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Queue Rank</span>
                <span className="text-2xl font-black text-slate-900">
                  #{primaryToken.queuePosition || 1}
                </span>
              </div>
              <div className="text-center px-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Wait</span>
                <span className="text-2xl font-black text-teal-600">
                  ~{primaryToken.estimatedWaitMinutes || 10}m
                </span>
              </div>
              <button
                onClick={() => setSelectedQRToken(primaryToken)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-800 shadow-sm"
              >
                <QrCode className="w-4 h-4 text-teal-400" />
                View Pass
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Counter Status + CAD Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Counters */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Live Office Desks</h3>
                <p className="text-xs text-slate-500">Real-time status of Admission and CAD counters</p>
              </div>
              <Link to="/student/queue" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
                View All Desks <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {counters.slice(0, 4).map((c) => {
                const isAdm = c.counterNumber === 'C-01';
                return (
                  <div
                    key={c._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAdm
                        ? 'border-teal-200 bg-teal-50/40 hover:bg-teal-50/70'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        {isAdm ? <Building className="w-3.5 h-3.5 text-teal-700" /> : <FileText className="w-3.5 h-3.5 text-indigo-700" />}
                        {c.counterNumber}
                      </span>
                      <Badge status={c.status} />
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{c.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Staff: {c.assignedStaff?.name || 'Assigned Officer'}
                    </p>
                    {c.status === 'lunch_break' && (
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        Reopens at {c.expectedReopenTime || '02:00 PM'}
                      </p>
                    )}
                    {c.currentCallingTokenNumber && (
                      <div className="mt-2 text-[11px] text-slate-500 font-mono">
                        Now Calling: <span className="font-extrabold text-teal-700">{c.currentCallingTokenNumber}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CAD Document Application Tracker */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">CAD Paperwork Applications</h3>
                <p className="text-xs text-slate-500">Bonafide, Transcripts, No Dues, and ID Card applications</p>
              </div>
              <Link to="/student/cad" className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1">
                Apply New <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {cadApps.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent document applications.</p>
            ) : (
              <div className="space-y-3">
                {cadApps.slice(0, 3).map((app) => (
                  <div key={app._id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900">{app.applicationNumber}</span>
                        <Badge status={app.status} />
                      </div>
                      <p className="font-semibold text-xs text-slate-800">{app.documentType}</p>
                      <p className="text-[11px] text-slate-500">{app.purpose}</p>
                    </div>

                    {app.status === 'Ready for Collection' ? (
                      <Link
                        to="/student/cad"
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700 transition-colors"
                      >
                        Download / Collect
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Processing</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Appointments + Fee Summary (Secured by UID & Password) */}
        <div className="space-y-6">
          {/* Admission Office Fee Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-teal-600" />
                Admission Fee Status
              </h3>
              <Link to="/student/payments" className="text-xs font-bold text-teal-700 hover:underline">
                Fee Desk
              </Link>
            </div>

            {verifiedFeeData ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900 text-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-rose-300">Bhrne Wali Rehti Hai</span>
                    <span className="text-[10px] text-slate-400">UID: {verifiedFeeData.student?.rollNumber}</span>
                  </div>
                  <h4 className="text-2xl font-black text-rose-400 mt-0.5">
                    ₹{verifiedFeeData.totalDue?.toLocaleString('en-IN') || 0}
                  </h4>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Aapne Bhr Di Hai:</span>
                    <span className="font-bold text-emerald-400">
                      ₹{verifiedFeeData.totalPaid?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-2 pt-1">
                  {verifiedFeeData.feeBreakdown?.slice(0, 3).map((item) => (
                    <div key={item.category} className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-600 truncate max-w-[140px]">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</span>
                        <Badge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/student/payments"
                  className="block w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-extrabold text-center transition-colors mt-2"
                >
                  Open Full Fee Ledger
                </Link>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Fee Ledger Locked</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Enter your Student UID and Password to view how much fees is pending (bhrne wali) and cleared (bhr di).
                  </p>
                </div>
                <Link
                  to="/student/payments"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-xs transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Verify UID & Check Fees
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Teacher Appointments */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Faculty Consultations
              </h3>
              <Link to="/student/appointments" className="text-xs font-semibold text-blue-700 hover:underline">
                Book
              </Link>
            </div>

            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No consultations booked.</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 2).map((apt) => (
                  <div key={apt._id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{apt.teacherDetails?.name || 'Faculty Member'}</span>
                      <Badge status={apt.status} />
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{apt.purpose}</p>
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {apt.date} • {apt.timeSlot}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Pass Modal */}
      {selectedQRToken && (
        <QRModal
          isOpen={!!selectedQRToken}
          onClose={() => setSelectedQRToken(null)}
          title={`Digital Token Pass: ${selectedQRToken.tokenNumber}`}
          qrValue={selectedQRToken.qrCodeData}
          tokenDetails={selectedQRToken}
        />
      )}
    </div>
  );
};
