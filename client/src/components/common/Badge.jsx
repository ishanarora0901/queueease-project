import React from 'react';

export const Badge = ({ status, className = '' }) => {
  const getStyle = (s) => {
    switch (s?.toLowerCase()) {
      // Counter & Staff availability
      case 'open':
      case 'available':
      case 'active':
      case 'confirmed':
      case 'approved':
      case 'success':
      case 'ready for collection':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'calling':
      case 'serving':
      case 'under review':
      case 'in progress':
      case 'urgent':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'waiting':
      case 'pending':
      case 'submitted':
      case 'pending documents':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'lunch_break':
      case 'lunch break':
      case 'temporarily_unavailable':
      case 'temporarily unavailable':
      case 'busy':
        return 'bg-orange-50 text-orange-700 border-orange-200';

      case 'closed':
      case 'staff_absent':
      case 'staff absent':
      case 'on_leave':
      case 'on leave':
      case 'absent':
      case 'holiday':
      case 'maintenance':
      case 'rejected':
      case 'cancelled':
      case 'failed':
      case 'suspended':
      case 'no_show':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-200';

      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const formatText = (text) => {
    if (!text) return 'Unknown';
    return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle(
        status
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {formatText(status)}
    </span>
  );
};

