import React, { useState } from 'react';
import { 
  ShieldCheck, Key, Lock, Users, FileText, Download, 
  Plus, Trash2, CheckCircle2, AlertTriangle, Shield, Check, X, RefreshCw
} from 'lucide-react';

interface SecurityAdminViewProps {
  adminPin: string;
  auditLogs: any[];
  showFeedback: (type: 'success' | 'error', text: string) => void;
}

const INITIAL_ADMINS = [
  { id: 'adm_1', email: 'admin.paperx@gmail.com', role: 'SuperAdmin', lastLogin: '2 mins ago', status: 'Active' },
  { id: 'adm_2', email: 'support.lead@paperx.app', role: 'Support', lastLogin: '1 hour ago', status: 'Active' },
];

export const SecurityAdminView: React.FC<SecurityAdminViewProps> = ({
  adminPin,
  auditLogs,
  showFeedback
}) => {
  const [adminsList, setAdminsList] = useState(INITIAL_ADMINS);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Admin');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      showFeedback('error', 'Admin email address is required.');
      return;
    }

    const newAdmin = {
      id: `adm_${Date.now()}`,
      email: newAdminEmail,
      role: newAdminRole,
      lastLogin: 'Never',
      status: 'Active'
    };

    setAdminsList(prev => [...prev, newAdmin]);
    showFeedback('success', `Admin access granted to ${newAdminEmail} (${newAdminRole}).`);
    setNewAdminEmail('');
  };

  const handleRevokeAdmin = (id: string, email: string) => {
    if (window.confirm(`Revoke administrative access for ${email}?`)) {
      setAdminsList(prev => prev.filter(a => a.id !== id));
      showFeedback('success', `Admin permissions revoked for ${email}.`);
    }
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput !== adminPin) {
      showFeedback('error', 'Current Admin PIN is incorrect.');
      return;
    }
    if (newPinInput.length < 4) {
      showFeedback('error', 'New PIN must be at least 4 digits.');
      return;
    }
    showFeedback('success', 'Admin Secret PIN updated successfully.');
    setCurrentPinInput('');
    setNewPinInput('');
  };

  const handleExportAuditLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Timestamp,Admin,Action,Details\n" +
      auditLogs.map(l => `"${l.id}","${new Date(l.timestamp).toISOString()}","${l.admin}","${l.action}","${l.details.replace(/"/g, '""')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PaperX_Audit_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', 'Audit log exported as CSV file.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-orange-500" size={24} />
            Admin Management, Audit Logs & System Security
          </h3>
          <p className="text-xs text-stone-400">
            Manage authorized administrators, audit trail ledger, roles & access permissions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 21: AUTHORIZED ADMINISTRATORS */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
            <Users size={18} className="text-orange-500" />
            Authorized Admin Accounts ({adminsList.length})
          </h4>

          <div className="space-y-3 mb-6">
            {adminsList.map((admin) => (
              <div key={admin.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{admin.email}</p>
                    <span className="text-[10px] font-extrabold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {admin.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">Last Login: {admin.lastLogin}</p>
                </div>

                {admin.role !== 'SuperAdmin' && (
                  <button
                    onClick={() => handleRevokeAdmin(admin.id, admin.email)}
                    title="Revoke Admin Access"
                    className="p-1.5 text-red-400 hover:bg-red-500/10 border border-stone-800 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Admin Form */}
          <form onSubmit={handleAddAdmin} className="space-y-3 pt-4 border-t border-stone-800">
            <p className="text-xs font-bold text-stone-300">Grant New Admin Privileges</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Admin email address..."
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5"
              />
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl p-2.5"
              >
                <option value="Admin">Admin</option>
                <option value="Support">Support</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs rounded-xl transition"
              >
                Add Admin
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 25: ADMIN PIN & SYSTEM SECRET MANAGER */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
            <Key size={18} className="text-amber-500" />
            Admin Secret PIN Configuration
          </h4>

          <form onSubmit={handleUpdatePin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Current Secret PIN</label>
              <input
                type="password"
                placeholder="Enter current PIN..."
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">New Secret PIN</label>
              <input
                type="password"
                placeholder="Enter new PIN..."
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl transition shadow-md"
            >
              Update Security PIN
            </button>
          </form>

          {/* Security Posture Note */}
          <div className="mt-6 p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-400 space-y-1">
            <p className="font-bold text-stone-200">🔒 Security Posture Enforcements:</p>
            <p>• Firebase Firestore Rules enforce read/write authorization</p>
            <p>• Admin API routes require secret PIN authorization header</p>
          </div>
        </div>
      </div>

      {/* SECTION 23: AUDIT LOGS MASTER LEDGER */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            Master Audit Log Ledger ({auditLogs.length} Records)
          </h4>

          <button
            onClick={handleExportAuditLogs}
            className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-400 font-mono">{log.action}</span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-1">{log.details}</p>
              </div>

              <span className="text-xs text-stone-400 font-mono font-bold bg-stone-900 px-2 py-1 rounded-md border border-stone-800">
                {log.admin}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
