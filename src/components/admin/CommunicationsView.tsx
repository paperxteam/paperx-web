import React, { useState, useEffect } from 'react';
import { 
  Bell, Megaphone, Send, FileText, CheckCircle2, AlertTriangle, 
  ToggleLeft, ToggleRight, Eye, RefreshCw, MessageSquare, Trash2,
  Sparkles, ExternalLink, ShieldAlert, Zap, Layers, User
} from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, onSnapshot, addDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';

interface CommunicationsViewProps {
  appSettings: any;
  adminPin: string;
  onUpdateSettings: (newFields: any) => Promise<void>;
  showFeedback: (type: 'success' | 'error', text: string) => void;
}

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({
  appSettings,
  adminPin,
  onUpdateSettings,
  showFeedback
}) => {
  // Announcement State
  const [bannerText, setBannerText] = useState(appSettings.bannerText || '');
  const [themePreset, setThemePreset] = useState(appSettings.themePreset || 'default');
  const [bannerActive, setBannerActive] = useState(appSettings.bannerActive || false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  // Notification Dispatcher State
  const [notifRecipient, setNotifRecipient] = useState('ALL');
  const [customUserEmail, setCustomUserEmail] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifPriority, setNotifPriority] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL');
  const [notifType, setNotifType] = useState<'CUSTOM_MESSAGE' | 'ANNOUNCEMENT' | 'OFFER' | 'SYSTEM_ALERT'>('CUSTOM_MESSAGE');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [isUrgentPopup, setIsUrgentPopup] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Real-time Notification History from Firestore
  const [sentHistory, setSentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Subscribe to real-time notifications in Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const notifs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((n: any) => !n.deleted)
        .sort((a: any, b: any) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
      
      setSentHistory(notifs);
      setIsLoadingHistory(false);
    }, (err) => {
      console.warn("Notifications listener note:", err);
      setIsLoadingHistory(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync state if appSettings changes from parent
  useEffect(() => {
    if (appSettings) {
      setBannerText(appSettings.bannerText || '');
      setThemePreset(appSettings.themePreset || 'default');
      setBannerActive(appSettings.bannerActive || false);
    }
  }, [appSettings]);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBanner(true);
    try {
      await onUpdateSettings({
        bannerText,
        themePreset,
        bannerActive
      });
      showFeedback('success', bannerActive ? 'Global Announcement Banner activated & broadcasted live!' : 'Global Announcement Banner hidden.');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update banner settings');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      showFeedback('error', 'Notification title and body are required.');
      return;
    }

    if (notifRecipient === 'CUSTOM' && !customUserEmail.trim()) {
      showFeedback('error', 'Please provide the target user email address.');
      return;
    }

    setIsSending(true);
    try {
      const now = Date.now();
      const newNotifPayload = {
        title: notifTitle.trim(),
        body: notifBody.trim(),
        recipient: notifRecipient === 'CUSTOM' ? 'CUSTOM' : notifRecipient,
        recipientEmail: notifRecipient === 'CUSTOM' ? customUserEmail.trim().toLowerCase() : '',
        priority: notifPriority,
        type: notifType,
        actionUrl: actionUrl.trim(),
        actionLabel: actionLabel.trim(),
        isUrgentPopup,
        sender: 'Official Support',
        senderName: 'Official Operations Desk',
        createdAt: now,
        timestamp: now,
        readBy: []
      };

      // Server broadcast endpoint (API handles Firestore write + Socket.IO emit)
      const res = await fetch('/api/admin/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          ...newNotifPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server dispatch failed.');

      showFeedback('success', `Custom notification broadcast dispatched to ${notifRecipient === 'CUSTOM' ? customUserEmail : notifRecipient} successfully!`);
      
      // Reset input fields
      setNotifTitle('');
      setNotifBody('');
      setActionUrl('');
      setActionLabel('');
      setIsUrgentPopup(false);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to dispatch notification.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteNotification = async (id: string, title: string) => {
    if (!window.confirm(`Delete notification "${title}"? It will no longer appear for users.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/notifications/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin, notifId: id })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }

      showFeedback('success', 'Notification removed from live feed.');
    } catch (err: any) {
      showFeedback('error', `Failed to delete: ${err.message}`);
    }
  };

  // Quick Templates
  const applyTemplate = (title: string, body: string, priority: 'NORMAL' | 'HIGH' | 'EMERGENCY', type: any, url = '', label = '') => {
    setNotifTitle(title);
    setNotifBody(body);
    setNotifPriority(priority);
    setNotifType(type);
    setActionUrl(url);
    setActionLabel(label);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Megaphone className="text-orange-500" size={24} />
            Notifications, Broadcasts & Custom Messages
          </h3>
          <p className="text-xs text-stone-400">
            Real-time live push messages, global announcement banners, and targeted user notices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION: GLOBAL ANNOUNCEMENT BANNER EDITOR */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3">
              <Megaphone size={18} className="text-amber-500" />
              Global App Announcement Banner
            </h4>
            <p className="text-[11px] text-stone-400 mb-4">
              Displayed prominently across the entire web application (Home, Dashboard, Tools & Modals).
            </p>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Banner Announcement Text</label>
                <textarea
                  rows={2}
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="e.g. 🇮🇳 Special Offer: Upgrade to PaperX Pro today for unlimited conversions!"
                  className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-3 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Theme Style</label>
                  <select
                    value={themePreset}
                    onChange={(e) => setThemePreset(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl p-2.5"
                  >
                    <option value="default">Default Tri-color Gradient</option>
                    <option value="independence_day">🇮🇳 Independence Day (Tri-color)</option>
                    <option value="festive">🎉 Festive Celebration (Amber Glow)</option>
                    <option value="dark_luxury">✨ Dark Luxury Obsidian</option>
                    <option value="emerald">🟢 Emerald Verified Green</option>
                    <option value="alert">⚠️ Urgent Alert (Crimson Amber)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">Banner State</label>
                  <button
                    type="button"
                    onClick={() => setBannerActive(!bannerActive)}
                    className={`w-full p-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition ${
                      bannerActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : 'bg-stone-950 text-stone-400 border-stone-800'
                    }`}
                  >
                    {bannerActive ? <ToggleRight className="text-emerald-500" size={20} /> : <ToggleLeft size={20} />}
                    {bannerActive ? 'Active (Visible)' : 'Hidden (Inactive)'}
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                  <Eye size={12} /> Live Preview in App:
                </span>
                <div className={`p-2 rounded-lg text-xs font-bold text-white text-center transition-all ${
                  bannerActive 
                    ? themePreset === 'independence_day' || themePreset === 'default'
                      ? 'bg-gradient-to-r from-[#FF671F] via-amber-500 to-[#046A38] text-white shadow-sm'
                      : themePreset === 'festive'
                      ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 text-black shadow-sm'
                      : themePreset === 'emerald'
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700 text-white'
                      : themePreset === 'alert'
                      ? 'bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white'
                      : 'bg-stone-900 border border-stone-700 text-white'
                    : 'bg-stone-900/40 text-stone-500 italic'
                }`}>
                  {bannerActive ? (bannerText || '✨ Live Announcement Active') : 'Banner is currently turned off.'}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingBanner}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                {isSavingBanner ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
                Publish & Broadcast Banner Live
              </button>
            </form>
          </div>
        </div>

        {/* SECTION: USER NOTIFICATION DISPATCHER */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Bell size={18} className="text-blue-500" />
              Targeted Custom Message & Notification Dispatcher
            </h4>
          </div>
          <p className="text-[11px] text-stone-400 mb-3">
            Pushes instant in-app toasts, notification center cards, and optional emergency alert modals.
          </p>

          {/* Quick Insert Templates */}
          <div className="mb-4">
            <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1.5 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" /> Quick Templates:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyTemplate('🎁 Exclusive 50% Upgrade Discount', 'Upgrade to PaperX Pro or Max tier today and get 50% extra storage + high-speed OCR extraction.', 'HIGH', 'OFFER', '#/pricing', 'View Plans')}
                className="text-[10px] font-bold px-2 py-1 bg-stone-950 hover:bg-stone-800 text-amber-300 border border-amber-500/20 rounded-lg transition"
              >
                🎁 Pro Discount
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('🚀 High-Speed Multi-Language OCR is Live', 'You can now extract editable text from images and PDF scans with over 40+ language models.', 'NORMAL', 'ANNOUNCEMENT', '#/ocr', 'Try OCR Tool')}
                className="text-[10px] font-bold px-2 py-1 bg-stone-950 hover:bg-stone-800 text-blue-300 border border-blue-500/20 rounded-lg transition"
              >
                🚀 New Feature
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('⚡ UTR Payment & Account Upgrade Confirmed', 'Your recent UPI UTR payment was verified by admin desk. Your Pro features are fully unlocked!', 'HIGH', 'CUSTOM_MESSAGE', '#/dashboard', 'Open Workspace')}
                className="text-[10px] font-bold px-2 py-1 bg-stone-950 hover:bg-stone-800 text-emerald-300 border border-emerald-500/20 rounded-lg transition"
              >
                ⚡ Payment Verified
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('⚠️ Scheduled Server Optimization Notice', 'We are performing 15-minute scheduled cloud engine maintenance tonight. Services will remain active.', 'EMERGENCY', 'SYSTEM_ALERT')}
                className="text-[10px] font-bold px-2 py-1 bg-stone-950 hover:bg-stone-800 text-red-300 border border-red-500/20 rounded-lg transition"
              >
                ⚠️ Maintenance Alert
              </button>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Target Audience</label>
                <select
                  value={notifRecipient}
                  onChange={(e) => setNotifRecipient(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl p-2.5"
                >
                  <option value="ALL">All Active Users</option>
                  <option value="PRO_USERS">PaperX Pro Subscribers</option>
                  <option value="FREE_USERS">Free Tier Users</option>
                  <option value="CUSTOM">Specific User Email</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Priority</label>
                <select
                  value={notifPriority}
                  onChange={(e) => setNotifPriority(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl p-2.5"
                >
                  <option value="NORMAL">Normal Notice</option>
                  <option value="HIGH">High Priority</option>
                  <option value="EMERGENCY">Emergency / Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Category</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl p-2.5"
                >
                  <option value="CUSTOM_MESSAGE">Direct Message</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="OFFER">Special Offer</option>
                  <option value="SYSTEM_ALERT">System Alert</option>
                </select>
              </div>
            </div>

            {notifRecipient === 'CUSTOM' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <label className="block text-xs font-bold text-blue-300 mb-1">Recipient User Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@gmail.com"
                  value={customUserEmail}
                  onChange={(e) => setCustomUserEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Message Title</label>
              <input
                type="text"
                required
                placeholder="e.g. PaperX Pro Upgrade Special"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">Message Details (Markdown supported)</label>
              <textarea
                rows={2}
                required
                placeholder="Write your custom message or instructions here..."
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Action Link (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. #/pricing or #/support"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Button Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Upgrade Now / Open Tool"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2"
                />
              </div>
            </div>

            {/* Urgent Modal Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-xl">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className={isUrgentPopup ? "text-amber-500" : "text-stone-500"} />
                <div>
                  <p className="text-xs font-bold text-stone-200">Show as Screen Pop-up Alert</p>
                  <p className="text-[10px] text-stone-400">Pops up immediately in the center of the user's screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUrgentPopup(!isUrgentPopup)}
                className={`p-1 rounded-lg border transition ${
                  isUrgentPopup ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-stone-900 text-stone-500 border-stone-800'
                }`}
              >
                {isUrgentPopup ? <ToggleRight size={22} className="text-amber-400" /> : <ToggleLeft size={22} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              Dispatch Live Notification to App
            </button>
          </form>
        </div>
      </div>

      {/* Real-time Notification Dispatch History */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-orange-500" />
            Live Notification & Custom Message Dispatch Log ({sentHistory.length})
          </h4>
          <span className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Synced with Firestore
          </span>
        </div>

        {isLoadingHistory ? (
          <div className="p-8 text-center text-stone-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-orange-500" />
            Loading live dispatch history...
          </div>
        ) : sentHistory.length === 0 ? (
          <div className="p-8 text-center bg-stone-950/60 border border-stone-800/60 rounded-xl">
            <Bell size={24} className="mx-auto text-stone-600 mb-2" />
            <p className="text-xs font-bold text-stone-400">No active custom messages or broadcasts yet.</p>
            <p className="text-[11px] text-stone-500 mt-1">Use the dispatcher above to send custom messages to users.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {sentHistory.map((n) => (
              <div 
                key={n.id} 
                className="p-4 bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-extrabold text-white">{n.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      n.priority === 'EMERGENCY'
                        ? 'bg-red-500/15 text-red-400 border-red-500/30'
                        : n.priority === 'HIGH'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-stone-800 text-stone-300 border-stone-700'
                    }`}>
                      {n.priority}
                    </span>
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                      To: {n.recipient === 'CUSTOM' ? (n.recipientEmail || 'Custom User') : n.recipient}
                    </span>
                    {n.isUrgentPopup && (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-md">
                        Pop-up Modal
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-300 mt-1.5 whitespace-pre-wrap leading-relaxed">{n.body}</p>
                  
                  {n.actionUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                        Action: {n.actionLabel || 'Link'} ({n.actionUrl})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                  <span className="text-[10px] text-stone-500 font-mono">
                    {new Date(n.createdAt || n.timestamp || Date.now()).toLocaleString()}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifTitle(n.title || '');
                        setNotifBody(n.body || '');
                        setNotifPriority(n.priority || 'NORMAL');
                        setNotifRecipient(n.recipient || 'ALL');
                        if (n.recipientEmail) setCustomUserEmail(n.recipientEmail);
                        setActionUrl(n.actionUrl || '');
                        setActionLabel(n.actionLabel || '');
                        setIsUrgentPopup(n.isUrgentPopup === true);
                      }}
                      title="Clone to form"
                      className="p-1.5 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-lg text-[10px] font-bold border border-stone-800 transition"
                    >
                      Clone
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(n.id, n.title)}
                      title="Delete notification"
                      className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

