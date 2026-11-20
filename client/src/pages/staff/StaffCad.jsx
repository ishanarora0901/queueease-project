import React, { useState, useEffect } from 'react';
import { cadApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { QRScannerModal } from '../../components/common/QRScannerModal';
import { LoadingSpinner } from '../../components/common/StatCard';
import {
  FileText,
  CheckCircle2,
  XCircle,
  QrCode,
  Download,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
} from 'lucide-react';

export const StaffCad = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Review Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // QR Scanner modal for verifying physical document pick-up
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const loadApplications = async () => {
    try {
      const res = await cadApi.getAllApplications({ status: statusFilter });
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
  }, [statusFilter]);

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status === 'Submitted' ? 'Under Review' : 'Approved');
    setReviewRemarks(app.reviewRemarks || '');
    setRejectionReason(app.rejectionReason || '');
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setUpdating(true);
    try {
      const res = await cadApi.updateApplicationStatus(selectedApp._id, {
        status: newStatus,
        reviewRemarks,
        rejectionReason: newStatus === 'Rejected' ? rejectionReason : '',
      });

      if (res.data.success) {
        setSelectedApp(null);
        loadApplications();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && applications.length === 0) {
    return <LoadingSpinner text="Connecting to CAD Registry..." />;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">CAD Document Verification Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review bonafide letters, transcripts, character certificates, and verify physical pickups via QR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            Verify Collection QR
          </button>
          <button
            onClick={loadApplications}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
        {[
          { label: 'All Requests', val: '' },
          { label: 'Submitted', val: 'Submitted' },
          { label: 'Under Review', val: 'Under Review' },
          { label: 'Approved / Ready', val: 'Ready for Collection' },
          { label: 'Completed', val: 'Completed' },
          { label: 'Rejected', val: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.val)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              statusFilter === tab.val
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">CAD Queue Records ({applications.length})</h3>

        {applications.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No applications matching current filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Application Ref</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Roll Number</th>
                  <th className="py-3 px-4 font-semibold">Document Type</th>
                  <th className="py-3 px-4 font-semibold">Purpose</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{app.studentDetails?.name || app.student?.name || 'Student'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{app.studentDetails?.rollNumber || app.student?.studentDetails?.rollNumber || 'N/A'}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{app.documentType}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{app.purpose}</td>
                    <td className="py-3 px-4"><Badge status={app.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(app)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review / Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Review CAD Application: ${selectedApp.applicationNumber}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900">{selectedApp.studentDetails?.name || selectedApp.student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Roll No:</span>
                <span className="font-mono text-slate-800">{selectedApp.studentDetails?.rollNumber || selectedApp.student?.studentDetails?.rollNumber || 'CS2023089'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested Document:</span>
                <span className="font-bold text-teal-800">{selectedApp.documentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purpose:</span>
                <span className="text-slate-700">{selectedApp.purpose}</span>
              </div>
            </div>

            {/* Status change select */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Update Status To</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Ready for Collection">Ready for Collection / Download</option>
                <option value="Completed">Completed (Handed Over)</option>
                <option value="Pending Documents">Pending Additional Documents</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {newStatus === 'Rejected' ? (
              <div>
                <label className="block font-semibold text-rose-700 mb-1">Reason for Rejection</label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete supporting documents or fee dues pending"
                  className="w-full px-3 py-2 rounded-lg border border-rose-300 text-sm focus:outline-none"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verification Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g. All academic clearance verified. Certificate stamped."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Apply Status Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Scanner Modal for Collection verification */}
      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        mode="cad"
        onVerified={() => {
          loadApplications();
        }}
      />
    </div>
  );
};

