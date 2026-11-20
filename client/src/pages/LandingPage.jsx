import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { counterApi } from '../api/queueApi';
import { Badge } from '../components/common/Badge';
import {
  Clock,
  FileText,
  Users,
  CreditCard,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building,
  Sparkles,
} from 'lucide-react';

export const LandingPage = () => {
  const { user, isStudent, isStaff, isAdmin } = useAuth();
  const [counters, setCounters] = useState([]);

  useEffect(() => {
    counterApi.getAllCounters().then((res) => {
      if (res.data.success) {
        setCounters(res.data.counters || []);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-14 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Digital Transformation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Skip the Wait, Manage Your Campus Services Smartly.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Eliminate long physical queues, avoid endless visits to administrative counters, and stay updated with real-time teacher and counter availability. All campus services in one secure portal.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                to={isAdmin ? '/admin' : isStaff ? '/staff/dashboard' : '/student/dashboard'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg transition-all"
              >
                Go to My Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg transition-all"
                >
                  Student & Staff Login <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-400" /> Administrative Console
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <p className="text-2xl font-bold text-white">0 Min</p>
              <p className="text-xs text-slate-400 mt-0.5">Physical Line Waiting</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-400">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">Online Token Booking</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">7+ CAD</p>
              <p className="text-xs text-slate-400 mt-0.5">Digital Certificates</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-400">Live</p>
              <p className="text-xs text-slate-400 mt-0.5">Counter Availability</p>
            </div>
          </div>
        </div>

        {/* Decorative background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial from-teal-400 to-transparent pointer-events-none hidden lg:block" />
      </section>

      {/* DUAL OFFICE GATEWAY SELECTOR (Admission Office vs CAD Office) */}
      <section className="text-left space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold mb-2">
            <Building className="w-3.5 h-3.5 text-teal-600" />
            <span>Campus Office Structure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Choose Your Destination Office
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Our campus services are divided into two dedicated departments. Select which office you need to visit:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Office 1: Admission Office */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-8 border border-teal-800/40 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-teal-500 transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  Office 1 • Fees & Admissions
                </span>
                <span className="text-xs text-teal-400 font-semibold flex items-center gap-1">
                  <CreditCard className="w-4 h-4" /> Counter 1 (Desk)
                </span>
              </div>

              <h3 className="text-2xl font-black text-white">Admission Office</h3>
              <p className="text-xs text-teal-200 mt-1 font-semibold">
                Central Fee Payments, Tuition Clearance & Student Admissions
              </p>

              <p className="text-xs text-slate-300 mt-3 mb-6 leading-relaxed">
                All college fee transactions (Tuition Fee, Exam Fee, Hostel & Mess, Fines), installment requests,
                official fee receipts, scholarship endorsements, and admission documents are managed exclusively here.
              </p>

              <div className="bg-slate-950/60 rounded-2xl p-4 border border-teal-500/20 mb-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Required Details:</span>
                  <span className="font-semibold text-white">UID, Name, Class/Course, Sem & Total Fees</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment Modes:</span>
                  <span className="font-semibold text-teal-300">Cash/Card at Counter 1 or Instant UPI Online</span>
                </div>
              </div>
            </div>

            <Link
              to={user ? '/student/queue' : '/login'}
              className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs text-center shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Visit Admission Office (Pay Fees / Token)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Office 2: CAD Office */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 border border-indigo-800/40 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500 transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Office 2 • All Paperwork & Docs
                </span>
                <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Counters 2 & 3
                </span>
              </div>

              <h3 className="text-2xl font-black text-white">CAD Office</h3>
              <p className="text-xs text-indigo-200 mt-1 font-semibold">
                College Administrative Department (Documentation & Paperwork)
              </p>

              <p className="text-xs text-slate-300 mt-3 mb-6 leading-relaxed">
                All official paper and documentation work: Bonafide certificates, character certificates, official
                transcripts, college ID card replacement, migration/transfer letters, and administrative verification.
              </p>

              <div className="bg-slate-950/60 rounded-2xl p-4 border border-indigo-500/20 mb-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Available Paperwork:</span>
                  <span className="font-semibold text-white">Bonafide, Transcripts, ID Cards, Migration TC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Collection Formats:</span>
                  <span className="font-semibold text-indigo-300">Instant PDF Download or Counter Collection</span>
                </div>
              </div>
            </div>

            <Link
              to={user ? '/student/cad' : '/login'}
              className="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs text-center shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Visit CAD Office (Apply for Paperwork)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Live Counter Peek Section */}
      <section className="text-left">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Live Campus Counter Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time availability of administrative desks and fee counters</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Socket Stream
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {counters.slice(0, 3).map((counter) => (
            <div
              key={counter._id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                  {counter.counterNumber}
                </span>
                <Badge status={counter.status} />
              </div>

              <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{counter.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dept: <span className="text-slate-700 font-medium">{counter.departmentDetails?.name || 'Administrative'}</span>
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {counter.operatingHours?.open} - {counter.operatingHours?.close}
                </span>
                <span className="font-medium text-teal-700">
                  {counter.dailyServedCount || 0} served today
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Modules Grid */}
      <section className="text-left">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Everything You Need for Campus Administration</h2>
          <p className="text-xs text-slate-500 mt-1">Designed specifically to eliminate administrative bottlenecks and save thousands of student hours</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Smart Queue Tokens</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Book digital tokens from anywhere. Get unique token numbers, QR passes, real-time position updates, and turn alarms.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Teacher Availability</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check teacher schedules, office hours, and lunch breaks before walking to departments. Book appointments in seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Digital CAD Services</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Apply online for Bonafide, Character certificates, transcripts, and ID cards. Download verified digital PDFs instantly.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-2">Online Fee Payments</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pay tuition, exam, and hostel fees via UPI, Cards, or NetBanking. Instant automated receipts with verified verification QR.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

