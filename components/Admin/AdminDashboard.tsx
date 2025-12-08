import React, { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, CheckCircle, XCircle, LogOut, Ban, Check } from 'lucide-react';
import { GlassCard } from '../UIComponents';
import { getAdminStats, getAllUsers, getPaymentRequests, processPayment, logout, toggleUserSuspension } from '../../services/backend';
import { User, PaymentRequest, AppTab } from '../../types';

interface AdminDashboardProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, totalRevenue: 0, newUsers: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);

  const refreshData = () => {
    // Force a fresh read from localStorage
    setStats(getAdminStats());
    setUsers(getAllUsers());
    setPayments([...getPaymentRequests()]); // Spread to ensure new array reference
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]); // Refresh when tab changes

  const handlePaymentAction = (id: string, action: 'approved' | 'rejected') => {
    // Removed blocking window.confirm to prevent UI freeze/state sync issues
    console.log(`Processing payment ${id} as ${action}`);
    processPayment(id, action);
    
    // Small timeout to ensure LocalStorage write completes before read
    setTimeout(() => {
        refreshData();
    }, 50);
  };

  const handleSuspendToggle = (id: string) => {
    toggleUserSuspension(id);
    // Small timeout to ensure LocalStorage write completes before read
    setTimeout(() => {
        refreshData();
    }, 50);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
        <h1 className="text-xl font-bold text-slate-800 mb-8 px-2">Admin Panel</h1>
        
        <nav className="space-y-1 flex-1">
          <button 
            onClick={() => setActiveTab(AppTab.ADMIN_STATS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === AppTab.ADMIN_STATS ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <TrendingUp size={18} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.ADMIN_USERS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === AppTab.ADMIN_USERS ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={18} /> Students
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.ADMIN_PAYMENTS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${activeTab === AppTab.ADMIN_PAYMENTS ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CreditCard size={18} /> Payments
          </button>
        </nav>

        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        
        {/* STATS VIEW */}
        {activeTab === AppTab.ADMIN_STATS && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Overview</h2>
            <div className="grid grid-cols-4 gap-6">
              <GlassCard className="p-6">
                <div className="text-slate-500 text-xs font-bold uppercase mb-2">Total Students</div>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="text-slate-500 text-xs font-bold uppercase mb-2">Premium Members</div>
                <div className="text-3xl font-bold text-green-600">{stats.premiumUsers}</div>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="text-slate-500 text-xs font-bold uppercase mb-2">Total Revenue</div>
                <div className="text-3xl font-bold text-blue-600">৳{stats.totalRevenue}</div>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="text-slate-500 text-xs font-bold uppercase mb-2">New Users (7d)</div>
                <div className="text-3xl font-bold text-purple-600">+{stats.newUsers}</div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* USERS VIEW */}
        {activeTab === AppTab.ADMIN_USERS && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Student Management</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">College</th>
                    <th className="p-4 font-semibold">Class</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-slate-500">{u.email}</td>
                      <td className="p-4 text-slate-500">{u.collegeName}</td>
                      <td className="p-4 text-slate-500">{u.class}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {u.suspended ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                              <Ban size={12} /> Suspended
                            </span>
                          ) : u.isPremium ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Premium</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Free</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                         <button 
                            onClick={() => handleSuspendToggle(u.id)}
                            className={`p-2 rounded-lg font-medium text-xs transition-colors border ${
                              u.suspended 
                                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            }`}
                         >
                           {u.suspended ? <span className="flex items-center gap-1"><Check size={14} /> Activate</span> : <span className="flex items-center gap-1"><Ban size={14} /> Suspend</span>}
                         </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                     <tr><td colSpan={6} className="p-8 text-center text-slate-500">No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENTS VIEW */}
        {activeTab === AppTab.ADMIN_PAYMENTS && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Payment Requests</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Plan</th>
                    <th className="p-4 font-semibold">Amount</th>
                    <th className="p-4 font-semibold">Trx ID</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-medium">{p.userName}</div>
                        <div className="text-xs text-slate-400">{p.userEmail}</div>
                      </td>
                      <td className="p-4 text-slate-600">{p.plan === '1_month' ? '1 Month' : '3 Months'}</td>
                      <td className="p-4 font-bold">৳{p.amount}</td>
                      <td className="p-4 font-mono text-slate-600">{p.transactionId}</td>
                      <td className="p-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize
                           ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                             p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                           {p.status}
                         </span>
                      </td>
                      <td className="p-4 text-right">
                        {p.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handlePaymentAction(p.id, 'approved')}
                              className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handlePaymentAction(p.id, 'rejected')}
                              className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No payment requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};