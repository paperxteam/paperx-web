import React, { useState, useEffect } from "react";
import { X, Shield, CheckCircle, XCircle, Bell, Sparkles, RefreshCw, Flag, Settings, CreditCard, QrCode, AlertCircle, LifeBuoy, AlertTriangle, MessageSquare } from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'branding'>('orders');

  // Rejection modal state
  const [rejectModalOrder, setRejectModalOrder] = useState<any | null>(null);
  const [rejectionReasonOption, setRejectionReasonOption] = useState<string>(
    "No matching transaction credit or funds were received in merchant account"
  );
  const [customRejectionReason, setCustomRejectionReason] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Branding / Theme settings state
  const [bannerText, setBannerText] = useState("");
  const [bannerActive, setBannerActive] = useState(false);
  const [themePreset, setThemePreset] = useState("default");
  const [announcementBadge, setAnnouncementBadge] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setOrders(data.orders);
        // Load settings
        const settingsRes = await fetch("/api/admin/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setBannerText(settingsData.settings.bannerText);
          setBannerActive(settingsData.settings.bannerActive);
          setThemePreset(settingsData.settings.themePreset);
          setAnnouncementBadge(settingsData.settings.announcementBadge);
        }
      } else {
        setError(data.error || "Invalid PIN");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderAction = async (orderId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) => {
    try {
      const res = await fetch("/api/admin/order/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, orderId, action, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        setRejectModalOrder(null);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalOrder || isRejecting) return;
    setIsRejecting(true);
    try {
      const finalReason = rejectionReasonOption === 'Custom Reason'
        ? (customRejectionReason.trim() || 'No matching transaction credit or funds were received in merchant account')
        : rejectionReasonOption;

      await handleOrderAction(rejectModalOrder.orderId, 'REJECT', finalReason);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          bannerText,
          bannerActive,
          themePreset,
          announcementBadge,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("UI Branding & Themes updated successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Shield className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">PaperX Team Control Panel</h2>
              <p className="text-xs text-emerald-200">Private system control, UTR verifications & seasonal UI customizer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center my-auto">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Enter PaperX Team PIN</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">Secure authentication required for PaperX Team access.</p>
            
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN (default: 1234)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-center text-lg tracking-widest font-mono"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-rose-600 text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-700/20"
              >
                {loading ? "Authenticating..." : "Access PaperX Team Panel"}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sub-nav tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell className="w-4 h-4" />
                Live Orders & Verifications ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('branding')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'branding'
                    ? 'border-emerald-700 text-emerald-800 bg-white rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flag className="w-4 h-4" />
                UI Themes & Festival Banners (e.g. Independence Day)
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {activeTab === 'orders' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">Recent Payment Orders (UPI & Card)</h3>
                      <p className="text-xs text-slate-500">Review card submissions & UTR numbers and approve membership access</p>
                    </div>
                    <button
                      onClick={fetchOrders}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <p className="text-slate-500 text-sm">No payment orders recorded yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {orders.map((order) => (
                        <div
                          key={order.orderId}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-sm">{order.orderId}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  order.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : order.status === 'EXPIRED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800 animate-pulse'
                                }`}
                              >
                                {order.status === 'PENDING' ? 'WAITING APPROVAL' : order.status === 'REJECTED' ? 'INVALID PAYMENT' : order.status}
                              </span>

                              {order.method === 'CARD' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <CreditCard className="w-3 h-3 text-amber-700" />
                                  Card Payment
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                  <QrCode className="w-3 h-3 text-teal-700" />
                                  UPI / QR
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                              <span>User: <strong className="text-slate-800">{order.userName || order.userEmail || order.uid}</strong></span>
                              <span>Plan: <strong className="text-slate-800">{order.plan}</strong></span>
                              <span>Amount: <strong className="text-emerald-700 font-bold">₹{order.amount}</strong></span>
                              {order.method === 'CARD' ? (
                                <>
                                  {order.cardHolder && <span>Holder: <strong className="text-slate-800">{order.cardHolder}</strong></span>}
                                  {order.cardLast4 && <span>Card: <strong className="font-mono text-slate-800">•••• {order.cardLast4}</strong></span>}
                                </>
                              ) : (
                                order.utr && <span>UTR: <strong className="font-mono text-emerald-700">{order.utr}</strong></span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400">
                              Submitted: {new Date(order.submittedAt || order.createdAt).toLocaleString()}
                            </div>

                            {order.status === 'REJECTED' && order.rejectionReason && (
                              <div className="mt-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                                <span><strong>Rejection Reason:</strong> {order.rejectionReason}</span>
                              </div>
                            )}

                            {order.ticketId && (
                              <div className="mt-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <LifeBuoy className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span><strong>Ticket #{order.ticketId}:</strong> Customer raised dispute</span>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-200 text-amber-900 border border-amber-300">
                                  {order.ticketStatus || 'OPEN'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto">
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleOrderAction(order.orderId, 'APPROVE')}
                                  className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve & Unlock
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectModalOrder(order);
                                    setRejectionReasonOption("No matching transaction credit or funds were received in merchant account");
                                    setCustomRejectionReason("");
                                  }}
                                  className="flex-1 md:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                                  title="Reject with custom or standard reason"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject...
                                </button>
                              </>
                            )}

                            {order.status === 'REJECTED' && (
                              <button
                                onClick={() => handleOrderAction(order.orderId, 'APPROVE')}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                                title="Approve order after ticket dispute review"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Re-Approve Order
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveBranding} className="space-y-6 max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Live UI Themes & Festival Banners</h3>
                    <p className="text-xs text-slate-500">
                      Customize app announcements, festive headers (like Independence Day, Diwali), and seasonal badges instantly for all users without redeploying code.
                    </p>
                  </div>

                  {successMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      {successMsg}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Announcement Banner Text</label>
                      <input
                        type="text"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="e.g. 🇮🇳 Happy Independence Day! Get 50% off Plus Plan today!"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        id="bannerActive"
                        checked={bannerActive}
                        onChange={(e) => setBannerActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="bannerActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Enable Announcement Banner on App Header
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Seasonal Theme Preset</label>
                      <select
                        value={themePreset}
                        onChange={(e) => setThemePreset(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                      >
                        <option value="default">Default Clean Theme</option>
                        <option value="independence_day">🇮🇳 Independence Day (Tricolor Accent)</option>
                        <option value="festive">🪔 Diwali / Festive Mode (Gold & Crimson)</option>
                        <option value="dark_luxury">✨ Dark Luxury Mode</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">Header Announcement Badge</label>
                      <input
                        type="text"
                        value={announcementBadge}
                        onChange={(e) => setAnnouncementBadge(e.target.value)}
                        placeholder="e.g. ✨ PaperX Cloud v2.5"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl transition-all shadow-md shadow-emerald-700/20 text-sm flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Save & Apply UI Settings Live
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Rejection Reason Modal Overlay */}
        {rejectModalOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Reject Payment</h4>
                    <p className="text-[11px] text-slate-500">Order: {rejectModalOrder.orderId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRejectModalOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl my-3 border border-slate-200">
                <div>User: <strong className="text-slate-800">{rejectModalOrder.userName || rejectModalOrder.userEmail}</strong></div>
                <div>Plan: <strong className="text-slate-800">{rejectModalOrder.plan}</strong> • Amount: <strong className="text-emerald-700 font-bold">₹{rejectModalOrder.amount}</strong></div>
                {rejectModalOrder.utr && <div>UTR: <strong className="font-mono text-slate-800">{rejectModalOrder.utr}</strong></div>}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Rejection Reason (shown directly in customer app):
                </label>
                <div className="space-y-2">
                  {[
                    "No matching transaction credit or funds were received in merchant account",
                    "Invalid 12-digit UTR: Transaction record not found",
                    "Payment was failed / reversed by bank gateway",
                    "Amount mismatch: Incorrect amount transferred",
                    "Duplicate UTR: This payment reference is already used",
                    "Custom Reason"
                  ].map((option) => (
                    <label
                      key={option}
                      onClick={() => setRejectionReasonOption(option)}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        rejectionReasonOption === option
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="adminRejectionReason"
                        checked={rejectionReasonOption === option}
                        onChange={() => setRejectionReasonOption(option)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {rejectionReasonOption === 'Custom Reason' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Type Custom Rejection Note:
                    </label>
                    <textarea
                      rows={2}
                      value={customRejectionReason}
                      onChange={(e) => setCustomRejectionReason(e.target.value)}
                      placeholder="Explain to user why verification could not be approved..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isRejecting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isRejecting ? "Rejecting..." : "Confirm Rejection & Alert App"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
