import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  Building,
  ArrowRight,
  Smartphone,
  Wallet,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  User,
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles,
  IndianRupee,
  RefreshCw,
  Clock,
} from 'lucide-react';

export const StudentPayments = () => {
  const { user } = useAuth();

  // Verification state (UID + Password)
  const [verifiedFeeData, setVerifiedFeeData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('qe_verified_fee');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Verification form inputs
  const [inputUid, setInputUid] = useState(user?.studentDetails?.rollNumber || 'CS2023089');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Payment Modal state
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [paying, setPaying] = useState(false);
  const [successPayment, setSuccessPayment] = useState(null);

  // If user profile changes, pre-fill UID if available and not yet verified
  useEffect(() => {
    if (!verifiedFeeData && user?.studentDetails?.rollNumber) {
      setInputUid(user.studentDetails.rollNumber);
    }
  }, [user, verifiedFeeData]);

  // Handle UID + Password Verification
  const handleVerifyStudentFee = async (e) => {
    e.preventDefault();
    if (!inputUid.trim() || !inputPassword) {
      setVerifyError('Please enter both Student UID / Roll Number and Password.');
      return;
    }

    setVerifyLoading(true);
    setVerifyError('');

    try {
      const res = await paymentApi.verifyStudentFee({
        uid: inputUid.trim(),
        password: inputPassword,
      });

      if (res.data.success && res.data.verified) {
        setVerifiedFeeData(res.data);
        sessionStorage.setItem('qe_verified_fee', JSON.stringify(res.data));
        setInputPassword('');
      } else {
        setVerifyError(res.data.message || 'Verification failed. Please check credentials.');
      }
    } catch (err) {
      setVerifyError(
        err.response?.data?.message || 'Invalid Student UID or Password. Please check your credentials.'
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  // Re-lock or switch student
  const handleLockSession = () => {
    sessionStorage.removeItem('qe_verified_fee');
    setVerifiedFeeData(null);
    setInputPassword('');
    setVerifyError('');
  };

  // Demo auto-fill helper for instant testing
  const handleDemoFill = (demoUid, demoPass = 'Student@123') => {
    setInputUid(demoUid);
    setInputPassword(demoPass);
    setVerifyError('');
  };

  // Process Online Payment
  const handlePayClick = (feeItem) => {
    setSelectedFee(feeItem);
    setSuccessPayment(null);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    setPaying(true);

    try {
      // Step 1: Create Order
      const orderRes = await paymentApi.initiateOrder({
        feeCategory: selectedFee.category,
        semester: selectedFee.semester,
        amount: selectedFee.amount,
        paymentMethod,
      });

      if (!orderRes.data.success) throw new Error('Order creation failed');

      const { transactionId } = orderRes.data;

      // Simulate gateway delay
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Verification
      const verifyRes = await paymentApi.verifyPayment({
        transactionId,
        razorpayPaymentId: `pay_QE${Date.now()}`,
        paymentMethod,
      });

      if (verifyRes.data.success) {
        setSuccessPayment(verifyRes.data.payment);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Refresh verified data locally
        if (verifiedFeeData) {
          const updatedBreakdown = verifiedFeeData.feeBreakdown.map((item) =>
            item.category === selectedFee.category ? { ...item, status: 'PAID' } : item
          );
          const newPaid = (verifiedFeeData.totalPaid || 0) + selectedFee.amount;
          const newDue = Math.max(0, (verifiedFeeData.totalDue || 0) - selectedFee.amount);
          const updatedHistory = [verifyRes.data.payment, ...(verifiedFeeData.paymentHistory || [])];

          const updated = {
            ...verifiedFeeData,
            totalDue: newDue,
            totalPaid: newPaid,
            feeBreakdown: updatedBreakdown,
            paymentHistory: updatedHistory,
          };
          setVerifiedFeeData(updated);
          sessionStorage.setItem('qe_verified_fee', JSON.stringify(updated));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header with Admission Office Distinction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 text-xs font-semibold mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>Admission Office • Central Fee System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admission Office: Fees & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            All college fee transactions, dues clearances, and receipts come under the Admission Office (Counter 1).
          </p>
        </div>

        {verifiedFeeData && (
          <div className="flex items-center gap-2">
            <Link
              to="/student/queue"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all"
            >
              <CreditCard className="w-4 h-4" /> Book Counter 1 Fee Token
            </Link>
            <button
              onClick={handleLockSession}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              title="Lock fee records & switch student"
            >
              <Lock className="w-4 h-4 text-slate-500" /> Lock / Switch UID
            </button>
          </div>
        )}
      </div>

      {/* College Architecture Notice */}
      <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/90 text-xs text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold block">Separate Department Systems</span>
            <span className="text-teal-800 text-[11px]">
              The <strong>Admission Office</strong> manages fees, installments, receipts, and enrollments. All document and paperwork requests are handled by the <strong>CAD Office</strong>.
            </span>
          </div>
        </div>

        <Link
          to="/student/cad"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:text-teal-950 underline shrink-0"
        >
          Go to CAD Office (Paperwork) <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* =============================================================== */}
      {/* CASE 1: STUDENT HAS NOT YET ENTERED UID & PASSWORD (AUTHENTICATION GATE) */}
      {/* =============================================================== */}
      {!verifiedFeeData ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-200 shadow-lg text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Fee Verification Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            Please enter your <strong>Student UID / Roll Number</strong> and <strong>Password</strong> to view your
            personalized fee status: <em>kitni fees bhrne wali rehti hai</em> (Pending Dues) aur <em>kitni aapne bhr di</em> (Paid Fees).
          </p>

          {verifyError && (
            <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyStudentFee} className="mt-6 space-y-4 text-left max-w-md mx-auto">
            {/* Student UID / Roll Number */}
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1.5 uppercase tracking-wide">
                Student UID / Roll Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={inputUid}
                  onChange={(e) => setInputUid(e.target.value)}
                  placeholder="e.g. CS2023089"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            {/* Student Password */}
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1.5 uppercase tracking-wide">
                Student Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Enter your student portal password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Default password for campus demo accounts is: <code className="font-bold text-teal-700">Student@123</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={verifyLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifyLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" /> Verify UID & Check Fee Status
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Profiles for Instant Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-2.5">
              Instant Demo Fill (Click any Student UID to test):
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('CS2023089')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                Aarav Patel (UID: CS2023089)
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('EC2023045')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                Priya Nair (UID: EC2023045)
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('ME2022012')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                Rohan Gupta (UID: ME2022012)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =============================================================== */
        /* CASE 2: STUDENT HAS ENTERED UID & PASSWORD (VERIFIED LEDGER VIEW) */
        /* =============================================================== */
        <div className="space-y-6">
          {/* Verified Student Banner */}
          <div className="bg-white rounded-3xl p-5 border-2 border-teal-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                {verifiedFeeData.student?.name?.[0] || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900">{verifiedFeeData.student?.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    ✓ UID Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  UID / Roll: <strong className="font-mono text-slate-800">{verifiedFeeData.student?.rollNumber}</strong> •{' '}
                  {verifiedFeeData.student?.course} (Semester {verifiedFeeData.student?.semester})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/student/queue"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Book Counter 1 Visit
              </Link>
              <button
                onClick={handleLockSession}
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                title="Lock ledger"
              >
                Lock
              </button>
            </div>
          </div>

          {/* Dues Status KPI Cards (Clear distinction between Bhrne Wali vs Bhr Di) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1: BHRNE WALI FEES (Remaining Pending Dues) */}
            <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 text-white rounded-3xl p-6 shadow-xl border border-rose-800/40 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                  Bhrne Wali Rehti Hai
                </span>
                <span className="text-xs font-semibold text-rose-400">Pending Dues</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black mt-2 text-white">
                ₹{verifiedFeeData.totalDue?.toLocaleString('en-IN') || 0}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {verifiedFeeData.totalDue > 0
                  ? 'Remaining fees to be cleared for this academic term'
                  : 'All fees fully settled. Zero pending dues! 🎉'}
              </p>
            </div>

            {/* Card 2: BHR DI FEES (Total Paid Fees) */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Aapne Bhr Di Hai
                </span>
                <span className="text-xs font-semibold text-emerald-400">Total Paid Fees</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black mt-2 text-emerald-300">
                ₹{verifiedFeeData.totalPaid?.toLocaleString('en-IN') || 0}
              </h3>
              <p className="text-xs text-slate-300 mt-1">Receipts verified & stamped by Admission Office</p>
            </div>

            {/* Card 3: Counter 1 & Payment Gateway */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desk & Gateway</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-extrabold text-sm text-slate-900">Counter 1 & UPI Ready</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Pay online via Razorpay 256-Bit SSL or take your token to <strong>Counter 1</strong> for cash/DD receipt.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Academic Year:</span>
                <span className="text-teal-700">2025-2026</span>
              </div>
            </div>
          </div>

          {/* Fee Breakdown Schedule */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Current Semester Fee Breakdown</h3>
                <p className="text-xs text-slate-500">Detailed status of what has been paid vs what is still pending</p>
              </div>
              <span className="text-xs font-bold text-slate-500">Semester 4 Ledger</span>
            </div>

            <div className="space-y-3">
              {verifiedFeeData.feeBreakdown?.map((item) => (
                <div
                  key={item.category}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-colors gap-3 ${
                    item.status === 'PAID'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-extrabold text-sm text-slate-900">{item.category}</h4>
                      {item.status === 'PAID' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Bhr Di (Paid)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          ⏳ Bhrne Wali Rehti Hai (Pending)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{item.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Due Date: {item.dueDate} • Term: {item.semester}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-slate-900">₹{item.amount.toLocaleString('en-IN')}</span>
                    {item.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePayClick(item)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Pay Online
                        </button>
                        <Link
                          to="/student/queue"
                          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Pay at Counter
                        </Link>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History & Downloadable Receipts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 mb-4">Official Payment Receipts & Challans</h3>

            {verifiedFeeData.paymentHistory?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No fee receipts on record yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Receipt No</th>
                      <th className="py-3 px-4 font-semibold">Transaction ID</th>
                      <th className="py-3 px-4 font-semibold">Fee Category</th>
                      <th className="py-3 px-4 font-semibold">Amount Paid</th>
                      <th className="py-3 px-4 font-semibold">Payment Mode</th>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verifiedFeeData.paymentHistory?.map((p) => (
                      <tr key={p._id || p.transactionId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.transactionId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{p.feeCategory}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(p.paidAt || p.createdAt || Date.now()).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={p.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status === 'success' && (
                            <a
                              href={paymentApi.downloadReceiptUrl(p.receiptNumber)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition-colors"
                            >
                              <Download className="w-3 h-3 text-teal-700" /> PDF Receipt
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Payment Gateway Modal */}
      {selectedFee && (
        <Modal
          isOpen={!!selectedFee}
          onClose={() => {
            setSelectedFee(null);
            setSuccessPayment(null);
          }}
          title={successPayment ? 'Payment Successful!' : 'Campus Fee Payment Gateway'}
          maxWidth="max-w-md"
        >
          {successPayment ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">₹{successPayment.amount.toLocaleString('en-IN')} Paid</h3>
              <p className="text-xs text-slate-500">
                Official Receipt <span className="font-mono font-bold text-slate-800">{successPayment.receiptNumber}</span> generated and archived.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-slate-700">{successPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-800">{successPayment.feeCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Mode:</span>
                  <span className="font-semibold text-teal-700">{successPayment.paymentMethod}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={paymentApi.downloadReceiptUrl(successPayment.receiptNumber)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF Receipt
                </a>
                <button
                  onClick={() => setSelectedFee(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-[10px] text-teal-400 uppercase font-bold">Payable Amount</span>
                <h3 className="text-2xl font-black mt-0.5">₹{selectedFee.amount.toLocaleString('en-IN')}</h3>
                <p className="text-[11px] text-slate-300 mt-1">{selectedFee.category} • {selectedFee.semester}</p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Select Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                    { id: 'Debit Card', label: 'Debit / Card', icon: CreditCard },
                    { id: 'Net Banking', label: 'Net Banking', icon: Wallet },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Enter Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    placeholder="name@upi"
                    required
                  />
                </div>
              )}

              {paymentMethod === 'Debit Card' && (
                <div className="space-y-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      defaultValue="09/29"
                      className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-center"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="882"
                      className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-center"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFee(null)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {paying ? 'Authorizing Payment...' : `Pay ₹${selectedFee.amount.toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
