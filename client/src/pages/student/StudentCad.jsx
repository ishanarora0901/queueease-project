import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cadApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { QRModal } from '../../components/common/QRModal';
import { LoadingSpinner } from '../../components/common/StatCard';
import {
  FileText,
  Plus,
  Download,
  QrCode,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Building,
  ArrowRight,
} from 'lucide-react';

export const StudentCad = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState('Bonafide Certificate');
  const [purpose, setPurpose] = useState('');
  const [urgency, setUrgency] = useState('standard');
  const [deliveryMethod, setDeliveryMethod] = useState('digital_download');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected QR pass modal for physical pickup
  const [selectedQRPass, setSelectedQRPass] = useState(null);

  const loadApplications = async () => {
    try {
      const res = await cadApi.getStudentApplications();
      if (res.data.success) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!purpose) {
      setErrorMsg('Please specify the purpose for the certificate.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('purpose', purpose);
    formData.append('urgency', urgency);
    formData.append('deliveryMethod', deliveryMethod);

    files.forEach((file) => {
      formData.append('documents', file);
    });

    try {
      const res = await cadApi.submitApplication(formData);
      if (res.data.success) {
        setApplyModalOpen(false);
        setPurpose('');
        setFiles([]);
        loadApplications();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Application submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && applications.length === 0) {
    return <LoadingSpinner text="Fetching CAD document requests..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>CAD Office • All Paperwork & Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            CAD Office: Paperwork & Documentation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            College Administrative Department – Apply for verified bonafide certificates, transcripts, character certificates, and ID cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Apply for Paperwork
          </button>
          <Link
            to="/student/queue"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Clock className="w-4 h-4 text-teal-400" />
            Book CAD Desk Token
          </Link>
        </div>
      </div>

      {/* College Architecture Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold block">Separate Department Systems</span>
            <span className="text-indigo-800 text-[11px]">
              The <strong>CAD Office</strong> specializes in all student paperwork and documentation. For fee payments, fee clearance, or installments, please visit the <strong>Admission Office</strong>.
            </span>
          </div>
        </div>

        <Link
          to="/student/payments"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 hover:text-indigo-950 underline shrink-0"
        >
          Go to Admission Office (Fees) <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Available Document Types Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { name: 'Bonafide Certificate', time: '1-2 Days', type: 'Digital / Physical' },
          { name: 'Character Certificate', time: '1-2 Days', type: 'Official Seal' },
          { name: 'Transcript Issuance', time: '3-4 Days', type: 'Grading Sheet' },
          { name: 'No Dues Certificate', time: 'Instant-1 Day', type: 'Accounts & Library' },
        ].map((item) => (
          <div key={item.name} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
            <p className="text-[10px] text-teal-700 font-semibold mt-0.5">Est. {item.time}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{item.type}</p>
          </div>
        ))}
      </div>

      {/* Application List */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
          My Applications ({applications.length})
        </h2>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-xs">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-sm text-slate-900">No applications submitted yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Need a Bonafide Certificate for scholarship or a Character Certificate for campus placement? Submit an application online.
            </p>
            <button
              onClick={() => setApplyModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
            >
              Apply Online
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {app.applicationNumber}
                    </span>
                    <Badge status={app.status} />
                    {app.urgency === 'urgent' && (
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
                        Urgent
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Applied: {new Date(app.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Requested Document</span>
                    <span className="font-bold text-slate-900 text-sm">{app.documentType}</span>
                    <span className="text-slate-500 block text-[11px] mt-0.5 capitalize">Delivery: {app.deliveryMethod.replace('_', ' ')}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Application Purpose</span>
                    <span className="text-slate-700 font-medium">{app.purpose}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Review Remarks</span>
                    <span className="text-slate-700 italic">
                      {app.reviewRemarks || app.rejectionReason || 'Under administrative queue verification.'}
                    </span>
                  </div>
                </div>

                {/* Lifecycle Step Tracker */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-600 mb-4 overflow-x-auto">
                  {['Submitted', 'Under Review', 'Approved', 'Ready for Collection', 'Completed'].map((step, idx) => {
                    const statusOrder = ['Submitted', 'Under Review', 'Approved', 'Ready for Collection', 'Completed'];
                    const currentIdx = statusOrder.indexOf(app.status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = app.status === step;

                    return (
                      <div key={step} className="flex items-center gap-1.5 shrink-0 px-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            isDone ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className={`font-medium ${isCurrent ? 'text-teal-700 font-bold' : ''}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions: Download / QR Collection Pass */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Digitally certified with cryptographic QR security</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {['Ready for Collection', 'Completed', 'Approved'].includes(app.status) && (
                      <a
                        href={cadApi.downloadCertificateUrl(app.applicationNumber)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Certificate (PDF)
                      </a>
                    )}

                    {app.deliveryMethod === 'physical_collection' && (
                      <button
                        onClick={() => setSelectedQRPass(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-600" />
                        Collection QR Pass
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New CAD Application Modal */}
      <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="Apply for CAD Document / Certificate" maxWidth="max-w-lg">
        <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Document Category</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="Bonafide Certificate">Bonafide Certificate</option>
              <option value="Character Certificate">Character Certificate</option>
              <option value="No Dues Certificate">No Dues Certificate</option>
              <option value="Transcript">Official Transcript of Grades</option>
              <option value="College ID Card Related Requests">College ID Card Replacement / Update</option>
              <option value="Migration Certificate">Migration Certificate</option>
              <option value="Other Administrative Certificates">Other Administrative Certificate</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              >
                <option value="standard">Standard (1-3 Days)</option>
                <option value="urgent">Urgent Priority (Same Day / 24h)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Delivery Preference</label>
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
              >
                <option value="digital_download">Digital Download (Instant PDF)</option>
                <option value="physical_collection">Physical Collection at Counter 2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Purpose / Justification</label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. State Merit Scholarship Portal submission / Passport Application / Internship Verification"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Upload Supporting Documents (Optional)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-[11px] text-slate-500">PDF, JPG, or PNG up to 10MB (Gradesheets, Fee Receipt, ID)</p>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-2 text-xs text-slate-500"
              />
              {files.length > 0 && (
                <p className="mt-2 text-[11px] font-semibold text-teal-700">{files.length} file(s) attached</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit to CAD Desk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Collection QR Pass Modal */}
      {selectedQRPass && (
        <QRModal
          isOpen={!!selectedQRPass}
          onClose={() => setSelectedQRPass(null)}
          title={`CAD Collection Pass: ${selectedQRPass.applicationNumber}`}
          qrValue={selectedQRPass.collectionQrCode}
          tokenDetails={{
            tokenNumber: selectedQRPass.applicationNumber,
            serviceType: selectedQRPass.documentType,
            counterNumber: 'Counter 2 (CAD)',
            bookedDate: selectedQRPass.collectionDate || 'Pick-up Ready',
            timeSlot: selectedQRPass.collectionTimeSlot || '09:00 AM - 04:30 PM',
          }}
        />
      )}
    </div>
  );
};

