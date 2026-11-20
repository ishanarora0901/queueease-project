import React, { useState } from 'react';
import { Modal } from './Modal';
import { QrCode, Search, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { queueApi } from '../../api/queueApi';
import { cadApi } from '../../api/campusApis';

export const QRScannerModal = ({ isOpen, onClose, mode = 'token', onVerified }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === 'token') {
        const qrString = tokenInput.includes('QE-TOKEN:')
          ? tokenInput.trim()
          : `QE-TOKEN:${tokenInput.trim().toUpperCase()}`;
        const res = await queueApi.verifyTokenQR(qrString);
        if (res.data.success) {
          setResult({ type: 'token', data: res.data.token, message: res.data.message });
          if (onVerified) onVerified(res.data.token);
        }
      } else {
        const qrString = tokenInput.includes('QE-CAD-COLLECT:')
          ? tokenInput.trim()
          : `QE-CAD-COLLECT:${tokenInput.trim().toUpperCase()}`;
        const res = await cadApi.verifyCollectionQR(qrString);
        if (res.data.success) {
          setResult({ type: 'cad', data: res.data.application, message: res.data.message });
          if (onVerified) onVerified(res.data.application);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTokenInput('');
    setResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title={mode === 'token' ? 'Verify Student Queue Token (QR / ID)' : 'Verify Document Collection (QR / ID)'}
      maxWidth="max-w-md"
    >
      <div>
        <p className="text-xs text-slate-500 mb-4">
          Scan the student's digital QR pass or enter the reference number (e.g. <span className="font-semibold text-slate-700">CAD-042</span> or <span className="font-semibold text-slate-700">CAD-APP-2026-0041</span>).
        </p>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={mode === 'token' ? 'e.g. CAD-042 or paste QR string' : 'e.g. CAD-APP-2026-0041'}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
            <QrCode className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Verify Pass'}
            </button>
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Verification Success Box */}
        {result && (
          <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-left">
                <h4 className="font-bold text-emerald-900 text-sm">{result.message}</h4>
                {result.type === 'token' ? (
                  <div className="mt-2 space-y-1 text-emerald-800">
                    <p><span className="font-semibold">Token:</span> {result.data?.tokenNumber}</p>
                    <p><span className="font-semibold">Student:</span> {result.data?.studentDetails?.name || result.data?.student?.name}</p>
                    <p><span className="font-semibold">Roll No:</span> {result.data?.studentDetails?.rollNumber || result.data?.student?.studentDetails?.rollNumber || 'N/A'}</p>
                    <p><span className="font-semibold">Service:</span> {result.data?.serviceType}</p>
                    <p><span className="font-semibold">Status:</span> <span className="uppercase font-bold">{result.data?.status}</span></p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1 text-emerald-800">
                    <p><span className="font-semibold">Application:</span> {result.data?.applicationNumber}</p>
                    <p><span className="font-semibold">Document:</span> {result.data?.documentType}</p>
                    <p><span className="font-semibold">Student:</span> {result.data?.studentDetails?.name || result.data?.student?.name}</p>
                    <p><span className="font-semibold">Status:</span> <span className="uppercase font-bold text-emerald-700">{result.data?.status}</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Box */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

