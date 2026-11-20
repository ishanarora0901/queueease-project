import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { queueApi, counterApi } from '../../api/queueApi';
import { paymentApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { QRModal } from '../../components/common/QRModal';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/StatCard';
import { useSocket } from '../../context/SocketContext';
import {
  Clock,
  QrCode,
  Calendar,
  AlertCircle,
  Plus,
  RefreshCw,
  XCircle,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  Building,
  FileText,
  CreditCard,
  ChevronRight,
  Check,
  Sparkles,
  User,
  GraduationCap,
  IndianRupee,
  FileCheck,
} from 'lucide-react';

const COURSES_LIST = [
  'B.Tech - Computer Science & Engineering',
  'B.Tech - Electronics & Communication',
  'B.Tech - Mechanical Engineering',
  'B.Tech - Civil Engineering',
  'BCA - Bachelor of Computer Applications',
  'MCA - Master of Computer Applications',
  'BBA - Bachelor of Business Administration',
  'MBA - Master of Business Administration',
  'B.Sc - Information Technology',
];

const SEMESTERS_LIST = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
];

const ADMISSION_PURPOSES = [
  { id: 'Fee Payment / Fee Submission', name: 'Fee Payment / Fee Submission', isFee: true, desc: 'Tuition, Examination, Hostel & Mess, or Late fees' },
  { id: 'Fee Clearance / No Dues (Fees)', name: 'Fee Clearance / No Dues (Fees)', isFee: true, desc: 'Obtain official fee clearance or financial no dues' },
  { id: 'Scholarship / Fee Concession', name: 'Scholarship / Fee Concession', isFee: true, desc: 'NSP, state or merit scholarship fee adjustment' },
  { id: 'Fee Receipt & Statement Generation', name: 'Fee Receipt & Statement Generation', isFee: true, desc: 'Collect physical stamped receipts or ledger copy' },
  { id: 'New Admission Verification & Enrollment', name: 'New Admission Verification & Enrollment', isFee: false, desc: 'Verify admission documents & confirm enrollment' },
  { id: 'Course / Branch Change Inquiry', name: 'Course / Branch Change Inquiry', isFee: false, desc: 'Admission office counseling and seat matrix' },
  { id: 'General Admission / Fee Inquiry', name: 'General Admission / Fee Inquiry', isFee: false, desc: 'Other fee or admission related queries' },
];

const CAD_PURPOSES = [
  { id: 'Bonafide Certificate', name: 'Bonafide Certificate', desc: 'Proof of study for passport, visa, or scholarships' },
  { id: 'Character Certificate', name: 'Character Certificate', desc: 'Conduct & character record for higher studies / jobs' },
  { id: 'Transcript Issuance', name: 'Official Transcript Issuance', desc: 'Consolidated semester-wise academic grades' },
  { id: 'College ID Card Replacement / Fresh ID', name: 'College ID Card Replacement / Fresh ID', desc: 'Lost ID card reissue or new semester ID card' },
  { id: 'Migration Certificate', name: 'Migration / Transfer Certificate', desc: 'University transfer and migration documentation' },
  { id: 'Academic Clearance & Paperwork', name: 'Academic No Dues & Paperwork', desc: 'Administrative clearance for course completion' },
  { id: 'Document Attestation & Verification', name: 'Document Attestation & Verification', desc: 'Attestation of marks cards and certificates' },
];

export const StudentQueue = () => {
  const { user } = useAuth();
  const [activeTokens, setActiveTokens] = useState([]);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Office filter tab for dashboard: 'all' | 'admission' | 'cad'
  const [officeFilter, setOfficeFilter] = useState('all');

  // Booking Modal State
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState('admission'); // 'admission' | 'cad'

  // Admission Office Form Fields
  const [admissionPurpose, setAdmissionPurpose] = useState('Fee Payment / Fee Submission');
  const [studentName, setStudentName] = useState(user?.name || '');
  const [uid, setUid] = useState(user?.studentDetails?.rollNumber || 'CS2023089');
  const [studentClass, setStudentClass] = useState(user?.studentDetails?.course || 'B.Tech - Computer Science & Engineering');
  const [semester, setSemester] = useState(user?.studentDetails?.semester ? `Semester ${user?.studentDetails?.semester}` : 'Semester 4');
  const [batch, setBatch] = useState(user?.studentDetails?.batch || '2023-2027');
  const [feeCategory, setFeeCategory] = useState('Tuition Fee');
  const [totalFees, setTotalFees] = useState('45000');
  const [paymentMode, setPaymentMode] = useState('counter'); // 'counter' | 'online'

  // CAD Office Form Fields
  const [cadPurpose, setCadPurpose] = useState('Bonafide Certificate');
  const [cadReason, setCadReason] = useState('Required for scholarship portal and bank education verification');
  const [cadCopies, setCadCopies] = useState('1');
  const [cadDelivery, setCadDelivery] = useState('physical_collection'); // 'physical_collection' | 'digital_download'

  // Common Booking Fields
  const [bookedDate, setBookedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM - 11:00 AM');
  const [remarks, setRemarks] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Modals
  const [rescheduleModalToken, setRescheduleModalToken] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [qrModalToken, setQrModalToken] = useState(null);

  const { socket } = useSocket();

  // Pre-fill user profile info when loaded
  useEffect(() => {
    if (user) {
      if (user.name) setStudentName(user.name);
      if (user.studentDetails?.rollNumber) setUid(user.studentDetails.rollNumber);
      if (user.studentDetails?.course) setStudentClass(user.studentDetails.course);
      if (user.studentDetails?.semester) setSemester(`Semester ${user.studentDetails.semester}`);
      if (user.studentDetails?.batch) setBatch(user.studentDetails.batch);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [activeRes, histRes, countersRes] = await Promise.all([
        queueApi.getStudentActiveTokens(),
        queueApi.getStudentHistory(),
        counterApi.getAllCounters(),
      ]);

      if (activeRes.data.success) setActiveTokens(activeRes.data.tokens || []);
      if (histRes.data.success) setTokenHistory(histRes.data.tokens || []);
      if (countersRes.data.success) setCounters(countersRes.data.counters || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Socket listener for live updates
  useEffect(() => {
    if (!socket) return;
    const handleQueueUpdated = () => loadData();
    socket.on('queue_updated', handleQueueUpdated);
    socket.on('counter_status_changed', handleQueueUpdated);
    return () => {
      socket.off('queue_updated', handleQueueUpdated);
      socket.off('counter_status_changed', handleQueueUpdated);
    };
  }, [socket]);

  // Open modal with pre-selected office
  const openBookingForOffice = (office) => {
    setSelectedOffice(office);
    setFormError('');
    setBookModalOpen(true);
  };

  // Find target counter based on selected office
  const getCounterForOffice = (office) => {
    if (office === 'admission') {
      // Find counter assigned to Admission or code ADM/ACC
      return (
        counters.find((c) => c.counterNumber === 'C-01' || c.department?.code === 'ADM' || c.department?.code === 'ACC') ||
        counters[0]
      );
    } else {
      // CAD Office Counters (C-02 or C-03)
      return (
        counters.find((c) => c.counterNumber === 'C-02' || c.department?.code === 'CAD') ||
        counters[1] ||
        counters[0]
      );
    }
  };

  const handleBookToken = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setFormError('');

    const targetCounter = getCounterForOffice(selectedOffice);
    if (!targetCounter) {
      setFormError('No counter currently active for this department.');
      setBookingLoading(false);
      return;
    }

    const deptId = targetCounter.department?._id || targetCounter.department;
    const serviceType = selectedOffice === 'admission' ? admissionPurpose : cadPurpose;

    const payload = {
      counterId: targetCounter._id,
      departmentId: deptId,
      serviceType,
      bookedDate,
      timeSlot: selectedSlot,
      remarks:
        selectedOffice === 'admission'
          ? `${remarks ? remarks + ' | ' : ''}Fee: ₹${totalFees} (${paymentMode === 'online' ? 'Online Mode' : 'Pay at Counter'})`
          : `${remarks ? remarks + ' | ' : ''}Purpose: ${cadReason} (${cadCopies} copy, ${cadDelivery})`,
      officeType: selectedOffice,
      studentName,
      uid,
      studentClass,
      semester,
      totalFees: selectedOffice === 'admission' ? Number(totalFees) || 0 : 0,
      feeCategory: selectedOffice === 'admission' ? feeCategory : '',
      paymentMode: selectedOffice === 'admission' ? paymentMode : 'counter',
    };

    try {
      const res = await queueApi.bookToken(payload);

      if (res.data.success) {
        setBookModalOpen(false);
        setRemarks('');

        // If student chose online payment, trigger celebratory confetti
        if (selectedOffice === 'admission' && paymentMode === 'online') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        }

        loadData();
        setQrModalToken(res.data.token);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to book token. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelToken = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this token? The slot will be released.')) return;
    try {
      await queueApi.cancelToken(id, 'Cancelled by student');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel token');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModalToken) return;
    try {
      await queueApi.rescheduleToken(rescheduleModalToken._id, {
        newDate,
        newTimeSlot: newSlot,
      });
      setRescheduleModalToken(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule token');
    }
  };

  const handleRejoinQueue = async (id) => {
    try {
      await queueApi.rejoinQueue(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rejoin queue');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Fetching campus queues & departments..." />;
  }

  // Helper to determine token office type
  const isAdmissionToken = (token) => {
    return (
      token.officeType === 'admission' ||
      token.department?.code === 'ADM' ||
      token.department?.code === 'ACC' ||
      token.tokenNumber?.startsWith('ADM') ||
      token.tokenNumber?.startsWith('ACC') ||
      token.counter?.counterNumber === 'C-01'
    );
  };

  const isCadToken = (token) => {
    return (
      token.officeType === 'cad' ||
      token.department?.code === 'CAD' ||
      token.tokenNumber?.startsWith('CAD') ||
      token.counter?.counterNumber === 'C-02' ||
      token.counter?.counterNumber === 'C-03'
    );
  };

  // Filtered active tokens
  const filteredActiveTokens = activeTokens.filter((token) => {
    if (officeFilter === 'admission') return isAdmissionToken(token);
    if (officeFilter === 'cad') return isCadToken(token);
    return true;
  });

  // Filtered history
  const filteredHistory = tokenHistory.filter((token) => {
    if (officeFilter === 'admission') return isAdmissionToken(token);
    if (officeFilter === 'cad') return isCadToken(token);
    return true;
  });

  const admissionCounter = counters.find(
    (c) => c.counterNumber === 'C-01' || c.department?.code === 'ADM' || c.department?.code === 'ACC'
  );
  const cadCounters = counters.filter(
    (c) => c.counterNumber === 'C-02' || c.counterNumber === 'C-03' || c.department?.code === 'CAD'
  );

  const isCurrentAdmissionPurposeFee = ADMISSION_PURPOSES.find((p) => p.id === admissionPurpose)?.isFee ?? true;

  return (
    <div className="space-y-8 text-left pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Office Queue Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Office & Book Queue Token
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Choose whether you need to visit the <strong>Admission Office</strong> (Fees & Admissions) or the{' '}
            <strong>CAD Office</strong> (Paperwork & Documentation).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DEPARTMENT SELECTOR CARDS (Central Office Switcher) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: ADMISSION OFFICE */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-7 shadow-xl border border-teal-700/40 flex flex-col justify-between group transition-all hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-44 h-44 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 tracking-wide uppercase">
                Department 1 • Finance & Admissions
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {admissionCounter?.status === 'open' ? 'Counter 1 Live' : 'Counter Ready'}
              </span>
            </div>

            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 shadow-sm">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Admission Office</h2>
                <p className="text-xs text-teal-200/90 font-medium">All Fee Systems, Admissions & Financial Clearances</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-2 mb-5">
              Handles all college fee payments (Tuition, Exam, Hostel, Fines), installment requests, scholarship
              endorsements, admission verification, and physical fee counter clearance.
            </p>

            {/* Quick highlights */}
            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-teal-500/20 mb-6 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Counter:</span>
                <span className="font-semibold text-white">Counter 1 (Admission & Fees)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Calling:</span>
                <span className="font-mono font-bold text-teal-400">{admissionCounter?.currentCallingTokenNumber || 'ADM-104'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Required Info:</span>
                <span className="font-medium text-teal-200">UID, Name, Course, Sem & Total Fees</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => openBookingForOffice('admission')}
            className="w-full py-3.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            <CreditCard className="w-4 h-4" />
            Visit Admission Office (Pay Fees / Inquiry)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: CAD OFFICE */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white p-7 shadow-xl border border-indigo-700/40 flex flex-col justify-between group transition-all hover:shadow-2xl">
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wide uppercase">
                Department 2 • Administration & Records
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                Counters 2 & 3 Live
              </span>
            </div>

            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">CAD Office</h2>
                <p className="text-xs text-indigo-200/90 font-medium">College Administrative Department (Paperwork & Docs)</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-2 mb-5">
              Handles all official student paperwork: Bonafide certificates, character certificates, official grade
              transcripts, college ID card reissue, migration/transfer letters, and document attestation.
            </p>

            {/* Quick highlights */}
            <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-indigo-500/20 mb-6 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Counters:</span>
                <span className="font-semibold text-white">Counter 2 (Docs) & Counter 3 (IDs)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Calling:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {cadCounters[0]?.currentCallingTokenNumber || 'CAD-041'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Delivery Modes:</span>
                <span className="font-medium text-indigo-200">Instant PDF Download or Counter Collection</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => openBookingForOffice('cad')}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            <FileText className="w-4 h-4" />
            Visit CAD Office (Paperwork & Documents)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOfficeFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              officeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Campus Queues ({activeTokens.length})
          </button>
          <button
            onClick={() => setOfficeFilter('admission')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              officeFilter === 'admission'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Admission Office ({activeTokens.filter(isAdmissionToken).length})
          </button>
          <button
            onClick={() => setOfficeFilter('cad')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              officeFilter === 'cad'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            CAD Office ({activeTokens.filter(isCadToken).length})
          </button>
        </div>

        <button
          onClick={() => openBookingForOffice('admission')}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
        >
          <Plus className="w-4 h-4" /> Book Another Office Token
        </button>
      </div>

      {/* ACTIVE TOKENS SECTION */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Your Active Tokens in {officeFilter === 'all' ? 'All Offices' : officeFilter === 'admission' ? 'Admission Office' : 'CAD Office'} ({filteredActiveTokens.length})
        </h2>

        {filteredActiveTokens.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900">No active queue tokens in this department</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Select an office above to book a new queue token for <strong>Admission Office (Fees)</strong> or{' '}
              <strong>CAD Office (Paperwork)</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <button
                onClick={() => openBookingForOffice('admission')}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Book Admission / Fee Token
              </button>
              <button
                onClick={() => openBookingForOffice('cad')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Book CAD Paperwork Token
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredActiveTokens.map((token) => {
              const isAdm = isAdmissionToken(token);
              return (
                <div
                  key={token._id}
                  className={`bg-white rounded-3xl p-6 border-2 shadow-sm transition-all text-left relative overflow-hidden ${
                    isAdm ? 'border-teal-500/40 hover:border-teal-500' : 'border-indigo-500/40 hover:border-indigo-500'
                  }`}
                >
                  {/* Office indicator pill */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                        isAdm
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {isAdm ? <Building className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {isAdm ? 'Admission Office' : 'CAD Office'}
                    </span>
                    <Badge status={token.status} />
                  </div>

                  {/* Token Number & Title */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Token Number</span>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{token.tokenNumber}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Counter</span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {token.counter?.name || (isAdm ? 'Counter 1 - Admission' : 'Counter 2 - CAD')}
                      </span>
                    </div>
                  </div>

                  {/* Service info */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 mb-4 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{token.serviceType}</span>
                      <span className="text-[11px] font-normal text-slate-500">{token.timeSlot}</span>
                    </p>

                    {/* Student Info if present */}
                    {(token.studentName || token.uid) && (
                      <p className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {token.studentName} • UID: <strong className="text-slate-800 font-mono">{token.uid}</strong>
                        </span>
                      </p>
                    )}

                    {/* Class & Sem if present */}
                    {(token.studentClass || token.semester) && (
                      <p className="text-slate-600 flex items-center gap-1.5 text-[11px]">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {token.studentClass} • <strong>{token.semester}</strong>
                        </span>
                      </p>
                    )}

                    {/* Admission Fee details callout */}
                    {token.totalFees > 0 && (
                      <div className="mt-2 pt-2 border-t border-teal-200/60 flex items-center justify-between text-teal-900 bg-teal-50 -mx-1.5 -mb-1.5 p-2 rounded-b-xl">
                        <span className="font-bold flex items-center gap-1 text-xs">
                          <IndianRupee className="w-3.5 h-3.5 text-teal-700" />
                          Total Fees: ₹{Number(token.totalFees).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200">
                          {token.paymentMode === 'online' ? 'Paid Online' : 'Pay at Counter 1'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Queue Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-900 text-white rounded-xl p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Queue Position</span>
                      <span className="text-2xl font-black text-teal-400">#{token.queuePosition || 1}</span>
                    </div>
                    <div className="bg-slate-100 rounded-xl p-3 text-center border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Est. Wait</span>
                      <span className="text-xl font-extrabold text-slate-800">~{token.estimatedWaitMinutes || 8} min</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setQrModalToken(token)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <QrCode className="w-4 h-4 text-teal-400" />
                      View Pass & QR
                    </button>
                    <button
                      onClick={() => {
                        setRescheduleModalToken(token);
                        setNewDate(token.bookedDate);
                        setNewSlot(token.timeSlot);
                      }}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelToken(token._id)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
                      title="Cancel token"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TOKEN HISTORY TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base text-slate-900">
            Booking History ({filteredHistory.length})
          </h3>
          <span className="text-xs text-slate-500">Filtered by: {officeFilter.toUpperCase()}</span>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No past visits recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Office</th>
                  <th className="py-3 px-4 font-semibold">Token</th>
                  <th className="py-3 px-4 font-semibold">Service / Details</th>
                  <th className="py-3 px-4 font-semibold">Counter</th>
                  <th className="py-3 px-4 font-semibold">Date & Slot</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((t) => {
                  const isAdm = isAdmissionToken(t);
                  return (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAdm ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {isAdm ? 'Admission Office' : 'CAD Office'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.tokenNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{t.serviceType}</span>
                        {t.totalFees > 0 && (
                          <span className="text-[11px] text-teal-700 font-bold block">
                            Fees: ₹{Number(t.totalFees).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.counter?.name || 'Counter'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {t.bookedDate} • {t.timeSlot}
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={t.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {['skipped', 'no_show'].includes(t.status) && (
                          <button
                            onClick={() => handleRejoinQueue(t._id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-800 font-semibold text-[11px] hover:bg-teal-100"
                          >
                            <RotateCcw className="w-3 h-3" /> Rejoin
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE BOOKING MODAL WITH DYNAMIC OFFICE SELECTION */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title={selectedOffice === 'admission' ? 'Admission Office Token Booking' : 'CAD Office Token Booking'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBookToken} className="space-y-5 text-xs text-left">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: CHOOSE OFFICE (Admission vs CAD) */}
          <div>
            <label className="block font-bold text-slate-800 mb-2 uppercase tracking-wide text-[11px]">
              Step 1: Choose Department Office to Visit
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedOffice('admission')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                  selectedOffice === 'admission'
                    ? 'border-teal-600 bg-teal-50/60 shadow-sm ring-1 ring-teal-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedOffice === 'admission' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Admission Office</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Fees, clearance, accounts & enrollments</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOffice('cad')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                  selectedOffice === 'cad'
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedOffice === 'cad' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">CAD Office</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">All paperwork, certificates & ID cards</p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: PURPOSE OF VISIT ACCORDING TO OFFICE */}
          {selectedOffice === 'admission' ? (
            /* ADMISSION OFFICE SECTION */
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase tracking-wide text-[11px]">
                  Step 2: Purpose of Visit at Admission Office
                </label>
                <select
                  value={admissionPurpose}
                  onChange={(e) => setAdmissionPurpose(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                >
                  {ADMISSION_PURPOSES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ADMISSION_PURPOSES.find((p) => p.id === admissionPurpose)?.desc}
                </p>
              </div>

              {/* IF PURPOSE IS FEES: REQUEST ALL STUDENT FEE DETAILS */}
              {isCurrentAdmissionPurposeFee && (
                <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-teal-200">
                    <IndianRupee className="w-4 h-4 text-teal-700" />
                    <span className="font-extrabold text-xs text-teal-950 uppercase tracking-wider">
                      Student & Fee Submission Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Student Full Name */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Student Full Name</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Aarav Patel"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    {/* UID / Student Roll Number */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">UID / Roll Number</label>
                      <input
                        type="text"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        placeholder="e.g. CS2023089"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    {/* Class / Course */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Class / Course & Branch</label>
                      <select
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      >
                        {COURSES_LIST.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Semester */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      >
                        {SEMESTERS_LIST.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Section / Batch */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Batch / Academic Year</label>
                      <input
                        type="text"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        placeholder="e.g. 2023-2027"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Fee Category */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Fee Type / Category</label>
                      <select
                        value={feeCategory}
                        onChange={(e) => setFeeCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="Tuition Fee">Tuition Fee</option>
                        <option value="Examination Fee">Examination Fee</option>
                        <option value="Admission & Registration Fee">Admission & Registration Fee</option>
                        <option value="Hostel & Mess Fee">Hostel & Mess Fee</option>
                        <option value="Late Fee / Fine">Late Fee / Fine</option>
                        <option value="Other Miscellaneous Fee">Other Miscellaneous Fee</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Fees to Fill / Pay */}
                  <div>
                    <label className="block font-bold text-teal-950 mb-1 text-xs">
                      Total Fees You Want to Fill / Pay (in ₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={totalFees}
                        onChange={(e) => setTotalFees(e.target.value)}
                        placeholder="e.g. 45000"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-teal-300 text-sm font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    {/* Quick amount presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500 mr-1 font-medium">Quick Amounts:</span>
                      {['5000', '15000', '32000', '45000', '82000'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTotalFees(amt)}
                          className="px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 text-[11px] font-bold hover:bg-teal-100 transition-colors"
                        >
                          ₹{Number(amt).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Mode Selection */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5 text-[11px]">
                      Payment Preference Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          paymentMode === 'counter'
                            ? 'bg-white border-teal-600 text-teal-950 font-bold shadow-xs'
                            : 'bg-white/60 border-slate-300 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payMode"
                          checked={paymentMode === 'counter'}
                          onChange={() => setPaymentMode('counter')}
                          className="text-teal-600"
                        />
                        <span>Pay at Counter 1 (Cash / DD / POS)</span>
                      </label>

                      <label
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          paymentMode === 'online'
                            ? 'bg-white border-teal-600 text-teal-950 font-bold shadow-xs'
                            : 'bg-white/60 border-slate-300 text-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payMode"
                          checked={paymentMode === 'online'}
                          onChange={() => setPaymentMode('online')}
                          className="text-teal-600"
                        />
                        <span>Pay Online Now (UPI / Net Banking)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CAD OFFICE SECTION (Paperwork & Documentation) */
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 uppercase tracking-wide text-[11px]">
                  Step 2: Paperwork & Document Requested
                </label>
                <select
                  value={cadPurpose}
                  onChange={(e) => setCadPurpose(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  {CAD_PURPOSES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {CAD_PURPOSES.find((p) => p.id === cadPurpose)?.desc}
                </p>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-200">
                  <FileCheck className="w-4 h-4 text-indigo-700" />
                  <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">
                    CAD Documentation Details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">UID / Roll Number</label>
                    <input
                      type="text"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                    Purpose / Reason for Paperwork Request
                  </label>
                  <input
                    type="text"
                    value={cadReason}
                    onChange={(e) => setCadReason(e.target.value)}
                    placeholder="e.g. Higher studies abroad, passport verification, internship application"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Number of Copies</label>
                    <select
                      value={cadCopies}
                      onChange={(e) => setCadCopies(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1 Copy</option>
                      <option value="2">2 Copies</option>
                      <option value="3">3 Copies</option>
                      <option value="5">5 Copies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Delivery Preference</label>
                    <select
                      value={cadDelivery}
                      onChange={(e) => setCadDelivery(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="physical_collection">Physical Pickup at CAD Counter 2</option>
                      <option value="digital_download">Digital Download (PDF Certificate)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VISIT DATE & TIME SLOT */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block font-bold text-slate-800 mb-2 uppercase tracking-wide text-[11px]">
              Step 3: Preferred Visit Date & Time Window
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Visit Date</label>
                <input
                  type="date"
                  value={bookedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Time Slot</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="09:30 AM - 10:30 AM">09:30 AM - 10:30 AM</option>
                  <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
                  <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                  <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                  <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Additional Remarks (Optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Urgent submission needed for semester registration"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Assigned Counter:{' '}
              <strong className="text-slate-800">
                {selectedOffice === 'admission' ? 'Counter 1 (Admission & Fees)' : 'Counter 2 (CAD Paperwork)'}
              </strong>
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBookModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bookingLoading}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-md transition-all ${
                  selectedOffice === 'admission'
                    ? 'bg-teal-600 hover:bg-teal-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                } disabled:opacity-50`}
              >
                {bookingLoading ? (
                  'Confirming Token...'
                ) : (
                  <>
                    Confirm {selectedOffice === 'admission' ? 'Admission' : 'CAD'} Token
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      {rescheduleModalToken && (
        <Modal
          isOpen={!!rescheduleModalToken}
          onClose={() => setRescheduleModalToken(null)}
          title={`Reschedule Token: ${rescheduleModalToken.tokenNumber}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs text-left">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select New Date</label>
              <input
                type="date"
                value={newDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select New Time Slot</label>
              <select
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                required
              >
                <option value="09:30 AM - 10:30 AM">09:30 AM - 10:30 AM</option>
                <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
                <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleModalToken(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                Confirm Reschedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Pass Modal */}
      {qrModalToken && (
        <QRModal
          isOpen={!!qrModalToken}
          onClose={() => setQrModalToken(null)}
          title={`Digital Token Pass: ${qrModalToken.tokenNumber}`}
          qrValue={qrModalToken.qrCodeData}
          tokenDetails={qrModalToken}
        />
      )}
    </div>
  );
};
