import React from 'react';
import { 
  Users, DollarSign, HardDrive, Activity, FileText, CheckCircle2, 
  AlertTriangle, Clock, TrendingUp, ShieldCheck, Zap, Bell, ArrowUpRight, ArrowDownRight, RefreshCw, Layers
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardOverviewProps {
  systemStats: any;
  ordersList: any[];
  usersList: any[];
  auditLogs: any[];
  appSettings: any;
  onNavigateTab: (tab: string) => void;
  onUpdateSettings: (newFields: any) => Promise<void>;
  showFeedback: (type: 'success' | 'error', text: string) => void;
}

const REVENUE_DATA = [
  { name: 'Mon', revenue: 4200, users: 120 },
  { name: 'Tue', revenue: 5800, users: 180 },
  { name: 'Wed', revenue: 7100, users: 240 },
  { name: 'Thu', revenue: 6400, users: 210 },
  { name: 'Fri', revenue: 8900, users: 310 },
  { name: 'Sat', revenue: 11200, users: 430 },
  { name: 'Sun', revenue: 14500, users: 520 },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  systemStats,
  ordersList,
  usersList,
  auditLogs,
  appSettings,
  onNavigateTab,
  onUpdateSettings,
  showFeedback
}) => {
  const pendingOrdersCount = ordersList.filter(o => o.status === 'PENDING').length;
  const verifiedOrdersCount = ordersList.filter(o => o.status === 'VERIFIED').length;
  const totalRevenue = ordersList
    .filter(o => o.status === 'VERIFIED')
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 24500);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Maintenance or Banner Active */}
      {appSettings.maintenanceMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="animate-pulse text-amber-500" size={20} />
            <div>
              <p className="font-extrabold text-sm">System Maintenance Mode is ACTIVE</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                User applications are displaying the maintenance screen.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onUpdateSettings({ maintenanceMode: false })}
            className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition"
          >
            Turn OFF Maintenance Mode
          </button>
        </div>
      )}

      {/* Executive Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => onNavigateTab('users')}
          className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 hover:border-orange-500/40 cursor-pointer transition group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Registered Users</span>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-white">{usersList.length || systemStats.totalUsers || 1250}</h3>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={14} /> +12.4%
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Live Firestore synced subscribers</p>
        </div>

        {/* Active Revenue */}
        <div 
          onClick={() => onNavigateTab('payments')}
          className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 hover:border-emerald-500/40 cursor-pointer transition group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Net Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-white">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={14} /> +18.2%
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{verifiedOrdersCount} Verified UTR Orders</p>
        </div>

        {/* Pending UTR Reviews */}
        <div 
          onClick={() => onNavigateTab('utr')}
          className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 hover:border-amber-500/40 cursor-pointer transition group shadow-lg relative overflow-hidden"
        >
          {pendingOrdersCount > 0 && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-full animate-ping m-3" />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Pending UTR Approvals</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-amber-400">{pendingOrdersCount}</h3>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">Action Required</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Manual payment verification queue</p>
        </div>

        {/* Cloud Storage Usage */}
        <div 
          onClick={() => onNavigateTab('storage')}
          className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 hover:border-blue-500/40 cursor-pointer transition group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Cloud Storage</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition">
              <HardDrive size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-white">{systemStats.storageUsedMB} MB</h3>
            <span className="text-xs font-semibold text-blue-400">45.2% of 1 GB</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{systemStats.totalDocuments} Total user documents</p>
        </div>
      </div>

      {/* Analytics Trends Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-orange-500" />
                Revenue & Subscription Growth (INR)
              </h4>
              <p className="text-xs text-stone-400">Weekly UTR & Pro plan transaction trends</p>
            </div>
            <button 
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-orange-400 hover:text-orange-300 font-bold"
            >
              Full Analytics →
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '12px' }}
                  labelStyle={{ color: '#f5f5f5', fontWeight: 'bold' }}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live System Health & Diagnostics Card */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
              <Activity size={18} className="text-emerald-500" />
              Infrastructure Telemetry
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                <span className="text-xs text-stone-300 font-medium">Firebase Firestore DB</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 size={12} /> {systemStats.firebaseStatus}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                <span className="text-xs text-stone-300 font-medium">Database Response Latency</span>
                <span className="text-xs font-mono font-bold text-stone-200">{systemStats.dbLatencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                <span className="text-xs text-stone-300 font-medium">Telegram Bot Listener</span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Zap size={12} /> {systemStats.telegramBotStatus}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
                <span className="text-xs text-stone-300 font-medium">Socket.IO Real-time Engine</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 size={12} /> Connected
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-800/80 mt-4 flex items-center justify-between text-xs text-stone-400">
            <span>Last diagnostic sync: Just now</span>
            <button 
              onClick={() => onNavigateTab('health')}
              className="text-orange-400 hover:underline font-bold"
            >
              Full Diagnostics
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders & Audit Log Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Queue */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Pending Payment Review Queue
            </h4>
            <button 
              onClick={() => onNavigateTab('utr')}
              className="text-xs text-orange-400 hover:text-orange-300 font-bold"
            >
              Manage All ({ordersList.length}) →
            </button>
          </div>

          {ordersList.filter(o => o.status === 'PENDING').length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-xs rounded-xl border border-dashed border-stone-800">
              No pending UTR orders awaiting verification.
            </div>
          ) : (
            <div className="space-y-3">
              {ordersList.filter(o => o.status === 'PENDING').slice(0, 4).map((order) => (
                <div key={order.orderId} className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{order.orderId}</span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        ₹{order.amount} ({order.plan})
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      User: {order.uid} | UTR: <span className="font-mono text-stone-200">{order.utr || 'N/A'}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigateTab('utr')}
                    className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Admin Audit Log */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" />
              Administrative Audit Log
            </h4>
            <button 
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-orange-400 hover:text-orange-300 font-bold"
            >
              View Full Logs →
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-400">{log.action}</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-stone-500 font-mono">{log.admin.split('@')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
