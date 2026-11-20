import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/StatCard';
import { CreditCard, Search, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

export const AdminPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadData = async () => {
    try {
      const res = await paymentApi.getAllTransactions({ feeCategory: categoryFilter, search: searchTerm });
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, searchTerm]);

  const totalRevenue = transactions
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fee Transactions & Revenue Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit gateway payments, counter cash collections, and download official electronic receipts
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Revenue Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">Total Settled Collections</span>
          <h2 className="text-3xl font-black mt-1">₹{totalRevenue.toLocaleString('en-IN')}</h2>
          <p className="text-xs text-slate-400 mt-1">Verified transactions processed through campus ERP</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
          <CreditCard className="w-6 h-6" />
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by receipt number (RCP-...), student roll, or transaction ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none font-medium"
        >
          <option value="">All Categories</option>
          <option value="Tuition Fee">Tuition Fee</option>
          <option value="Examination Fee">Examination Fee</option>
          <option value="Library Fee">Library Fee</option>
          <option value="Hostel & Mess Fee">Hostel Fee</option>
          <option value="CAD Document Processing Fee">CAD Processing Fee</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">Payment Transactions ({transactions.length})</h3>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No payment transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Receipt Number</th>
                  <th className="py-3 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Roll Number</th>
                  <th className="py-3 px-4 font-semibold">Fee Category</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Mode</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.receiptNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{t.transactionId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{t.studentName || t.student?.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{t.studentRollNumber || 'N/A'}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{t.feeCategory}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{t.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-600">{t.paymentMethod}</td>
                    <td className="py-3 px-4"><Badge status={t.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {t.status === 'success' && (
                        <a
                          href={paymentApi.downloadReceiptUrl(t.receiptNumber)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-colors"
                        >
                          <Download className="w-3 h-3 text-teal-700" /> Receipt
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
  );
};

