import React from 'react';
import { ShieldCheck, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-sm">
                QE
              </div>
              <span className="text-white font-bold text-base tracking-tight">QueueEase</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Skip the Wait, Manage Your Campus Services Smartly. Enterprise digital campus queue management, staff availability, and CAD services.
            </p>
            <div className="flex items-center gap-1.5 text-teal-400 font-medium text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Campus Infrastructure</span>
            </div>
          </div>

          {/* Quick Services */}
          <div>
            <h4 className="text-slate-100 font-semibold mb-3 uppercase tracking-wider text-[11px]">Core Services</h4>
            <ul className="space-y-2">
              <li><Link to="/student/queue" className="hover:text-white transition-colors">Smart Queue Tokens</Link></li>
              <li><Link to="/student/appointments" className="hover:text-white transition-colors">Teacher Availability</Link></li>
              <li><Link to="/student/cad" className="hover:text-white transition-colors">CAD Document Requests</Link></li>
              <li><Link to="/student/payments" className="hover:text-white transition-colors">Online Fee Counter</Link></li>
            </ul>
          </div>

          {/* Administrative Hours */}
          <div>
            <h4 className="text-slate-100 font-semibold mb-3 uppercase tracking-wider text-[11px]">Operating Hours</h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Mon – Fri: 09:00 AM – 05:00 PM</span>
              </li>
              <li className="text-slate-500 pl-5.5">Lunch: 01:00 PM – 02:00 PM</li>
              <li className="text-slate-500 pl-5.5">Saturday: Selected Services (10:00 AM – 01:00 PM)</li>
              <li className="text-slate-500 pl-5.5">Sunday & University Holidays: Closed</li>
            </ul>
          </div>

          {/* Helpdesk */}
          <div>
            <h4 className="text-slate-100 font-semibold mb-3 uppercase tracking-wider text-[11px]">Campus Helpdesk</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Main Admin Block, Ground Floor</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>011-2345-6780 (Queue Helpline)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@queueease.edu</span>
              </li>
              <li className="pt-1">
                <Link to="/admin/login" className="text-slate-400 hover:text-teal-400 inline-flex items-center gap-1 font-medium">
                  → Administrator Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <p>© {new Date().getFullYear()} QueueEase – Smart Campus Service Management System. All rights reserved.</p>
          <p className="font-mono text-[11px]">Apex Institute of Technology & Science Campus ERP</p>
        </div>
      </div>
    </footer>
  );
};

