import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from './Modal';
import { Download, CheckCircle, ShieldCheck } from 'lucide-react';

export const QRModal = ({ isOpen, onClose, title = 'Digital Verification Pass', qrValue, tokenDetails }) => {
  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QueueEase-${tokenDetails?.tokenNumber || 'Pass'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        {/* Token Number Header */}
        <div className="w-full bg-slate-900 text-white rounded-xl py-3 px-4 mb-5">
          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">Active Token Pass</span>
          <h2 className="text-3xl font-extrabold tracking-wider mt-0.5">{tokenDetails?.tokenNumber || 'QE-PASS'}</h2>
          <p className="text-xs text-slate-300 mt-1">{tokenDetails?.serviceType || 'Campus Administrative Service'}</p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-inner inline-block">
          <QRCodeSVG
            id="qr-code-svg"
            value={qrValue || 'QUEUEEASE-OFFICIAL'}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Metadata info */}
        <div className="w-full bg-slate-50 rounded-xl p-3 mt-4 text-xs text-left text-slate-600 space-y-1.5 border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-400">Office / Dept:</span>
            <span className="font-semibold text-slate-800">
              {tokenDetails?.officeType === 'admission'
                ? '🏛️ Admission & Fee Office'
                : tokenDetails?.officeType === 'cad'
                ? '📑 CAD (Paperwork & Docs)'
                : tokenDetails?.department?.name || 'Campus Office'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Counter:</span>
            <span className="font-semibold text-slate-800">{tokenDetails?.counterDetails?.name || tokenDetails?.counter?.name || tokenDetails?.counterNumber || 'Counter'}</span>
          </div>

          {/* Student UID & Name if present */}
          {(tokenDetails?.uid || tokenDetails?.studentName) && (
            <div className="flex justify-between">
              <span className="text-slate-400">Student / UID:</span>
              <span className="font-semibold text-slate-800">
                {tokenDetails?.studentName} ({tokenDetails?.uid || 'UID'})
              </span>
            </div>
          )}

          {/* Class & Semester if present */}
          {(tokenDetails?.studentClass || tokenDetails?.semester) && (
            <div className="flex justify-between">
              <span className="text-slate-400">Class & Sem:</span>
              <span className="font-semibold text-slate-800">
                {tokenDetails?.studentClass} • {tokenDetails?.semester}
              </span>
            </div>
          )}

          {/* Total Fees if present */}
          {tokenDetails?.totalFees > 0 && (
            <div className="flex justify-between bg-teal-50 -mx-1 px-2 py-1 rounded text-teal-900 border border-teal-200">
              <span className="font-medium text-teal-700">Total Fees:</span>
              <span className="font-bold text-teal-800">
                ₹{Number(tokenDetails.totalFees).toLocaleString('en-IN')} ({tokenDetails?.paymentMode === 'online' ? 'Paid Online' : 'Pay at Counter'})
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-400">Date & Slot:</span>
            <span className="font-semibold text-slate-800">{tokenDetails?.bookedDate || 'Today'} ({tokenDetails?.timeSlot || 'Normal'})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Security Checksum:</span>
            <span className="font-mono text-teal-700">QE-VERIFIED-AUTH</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-teal-600 inline" />
          Present this QR code to the counter officer for instant check-in.
        </p>

        <div className="flex w-full gap-3 mt-5">
          <button
            onClick={downloadQR}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Save Image
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white transition-colors"
          >
            Close Pass
          </button>
        </div>
      </div>
    </Modal>
  );
};

