import React, { useState, useEffect } from 'react';
import { cadApi } from '../../api/campusApis';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/StatCard';
import { FileCheck, Search, Download, RefreshCw, Eye } from 'lucide-react';

export const AdminCadRequests = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadData = async () => {
    try {
      const res = await cadApi.getAllApplications({ documentType: typeFilter, search: searchTerm });
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
    loadData();
  }, [typeFilter, searchTerm]);

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">CAD Document Requests Oversight</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus-wide registry of certificate applications, transcripts, verification timelines, and digital downloads
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ref number (e.g. CAD-APP-2026-0041) or student name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none font-medium"
        >
          <option value="">All Document Types</option>
          <option value="Bonafide Certificate">Bonafide Certificate</option>
          <option value="Character Certificate">Character Certificate</option>
          <option value="Transcript">Transcript of Grades</option>
          <option value="No Dues Certificate">No Dues Certificate</option>
          <option value="College ID Card Related Requests">ID Card Requests</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-slate-900 mb-4">Document Applications ({applications.length})</h3>

        {applications.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No CAD applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ref Number</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Roll Number</th>
                  <th className="py-3 px-4 font-semibold">Document</th>
                  <th className="py-3 px-4 font-semibold">Delivery Mode</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">PDF Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{app.studentDetails?.name || app.student?.name || 'Student'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{app.studentDetails?.rollNumber || app.student?.studentDetails?.rollNumber || 'CS2023089'}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{app.documentType}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{app.deliveryMethod?.replace('_', ' ')}</td>
                    <td className="py-3 px-4"><Badge status={app.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {['Ready for Collection', 'Completed', 'Approved'].includes(app.status) && (
                        <a
                          href={cadApi.downloadCertificateUrl(app.applicationNumber)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] border border-teal-200 transition-colors"
                        >
                          <Download className="w-3 h-3" /> Download
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

