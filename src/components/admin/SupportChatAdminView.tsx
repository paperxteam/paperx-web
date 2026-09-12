import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, Send, User, CheckCircle2, AlertTriangle, 
  Search, RefreshCw, Clock, Shield, Check, Trash2, MessageCircle,
  Zap, Lock, Unlock, CreditCard, ExternalLink, Sparkles, Copy,
  CheckCheck, ArrowRight, CornerDownLeft, Brain, HelpCircle,
  ChevronDown, ChevronUp, Bot, FileText, Crown, BookOpen, Layers,
  FileCheck, ShieldAlert, LogOut, Globe, AlertCircle, Eye
} from 'lucide-react';
import { db } from '../../../services/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, arrayUnion, getDoc } from 'firebase/firestore';

interface SupportChatAdminViewProps {
  showFeedback: (type: 'success' | 'error', text: string) => void;
}

interface AdminResolution {
  suggestedAnswer: string;
  category: string;
  questionType: string;
  userIntentSummary: string;
  urgency: 'High' | 'Medium' | 'Normal';
  keyPoints: string[];
  recommendedAction: string;
  directToolGuide?: {
    toolName: string;
    actionSteps: string[];
    deepLinkUrl?: string;
  };
  quickActionOptions?: {
    label: string;
    text: string;
  }[];
  alternativeDrafts: string[];
}

export const SupportChatAdminView: React.FC<SupportChatAdminViewProps> = ({ showFeedback }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'payment' | 'ocr' | 'translate'>('all');
  const [isSending, setIsSending] = useState(false);
  const [targetUserData, setTargetUserData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Resolution & Intelligence states
  const [aiResolution, setAiResolution] = useState<AdminResolution | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiTone, setAiTone] = useState<'professional' | 'detailed' | 'concise'>('professional');
  const [customAiQuery, setCustomAiQuery] = useState('');
  const [isAiBoxExpanded, setIsAiBoxExpanded] = useState(true);
  const [isUserControlExpanded, setIsUserControlExpanded] = useState(true);
  const [isKnowledgeDrawerOpen, setIsKnowledgeDrawerOpen] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);
  const [isSettingPlan, setIsSettingPlan] = useState(false);
  const lastFetchedQueryRef = useRef<string>('');

  // Subscribe to all live support chats from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'support_chats'), (snapshot) => {
      const chatList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      chatList.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setChats(chatList);
      if (chatList.length > 0 && !selectedChatId) {
        setSelectedChatId(chatList[0].id);
      }
    }, (err) => {
      console.warn("Firestore support_chats snapshot error:", err);
    });

    return () => unsubscribe();
  }, [selectedChatId]);

  const activeChat = chats.find(c => c.id === selectedChatId);

  // Fetch target user metadata whenever active chat changes
  useEffect(() => {
    if (!activeChat) {
      setTargetUserData(null);
      return;
    }
    const uid = activeChat.userId || activeChat.id;
    const fetchUser = async () => {
      try {
        const uRef = doc(db, 'users', uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          setTargetUserData({ id: uSnap.id, ...uSnap.data() });
        } else {
          setTargetUserData(null);
        }
      } catch (e) {
        setTargetUserData(null);
      }
    };
    fetchUser();
  }, [selectedChatId, activeChat]);

  // Extract the latest user query from the active chat
  const getLatestUserQuery = useCallback((): string => {
    if (!activeChat?.messages || !Array.isArray(activeChat.messages)) {
      return activeChat?.lastMessage || '';
    }
    for (let i = activeChat.messages.length - 1; i >= 0; i--) {
      const m = activeChat.messages[i];
      if (m.sender === 'user' && m.text && m.text.trim()) {
        return m.text.trim();
      }
    }
    return activeChat.lastMessage || '';
  }, [activeChat]);

  // Fetch AI suggestion & question intent analysis
  const fetchAiSuggestion = useCallback(async (queryText: string, tone = aiTone) => {
    if (!queryText || queryText.trim().length === 0) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/admin/support/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          userEmail: activeChat?.userEmail || targetUserData?.email,
          userName: activeChat?.userName || targetUserData?.name,
          userPlan: targetUserData?.plan || 'Free Tier',
          tone
        })
      });
      const data = await res.json();
      if (data.success && data.resolution) {
        setAiResolution(data.resolution);
      }
    } catch (e) {
      console.warn("Failed to fetch AI suggested resolution:", e);
    } finally {
      setIsGeneratingAi(false);
    }
  }, [activeChat, targetUserData, aiTone]);

  // Auto-generate AI answer when active chat changes or a new query arrives
  useEffect(() => {
    if (!activeChat) {
      setAiResolution(null);
      return;
    }
    const latestQuery = getLatestUserQuery();
    if (latestQuery && latestQuery !== lastFetchedQueryRef.current) {
      lastFetchedQueryRef.current = latestQuery;
      fetchAiSuggestion(latestQuery);
    }
  }, [activeChat?.id, activeChat?.messages?.length, getLatestUserQuery, fetchAiSuggestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSendReply = async (textToSend?: string) => {
    const content = (textToSend || replyText).trim();
    if (!content || !selectedChatId) return;

    setIsSending(true);
    if (!textToSend) setReplyText('');

    try {
      const chatRef = doc(db, 'support_chats', selectedChatId);
      const newMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'admin',
        senderName: 'PaperX Official Support',
        text: content,
        timestamp: Date.now()
      };

      await updateDoc(chatRef, {
        messages: arrayUnion(newMsg),
        lastMessage: content,
        updatedAt: Date.now(),
        status: 'active',
        unreadByUser: true,
        unreadByAdmin: false
      });

      showFeedback('success', 'Reply sent to user instantly!');
    } catch (err: any) {
      try {
        const chatRef = doc(db, 'support_chats', selectedChatId);
        await setDoc(chatRef, {
          messages: [{
            id: `msg_${Date.now()}`,
            sender: 'admin',
            senderName: 'PaperX Official Support',
            text: content,
            timestamp: Date.now()
          }],
          lastMessage: content,
          updatedAt: Date.now(),
          status: 'active',
          unreadByUser: true,
          unreadByAdmin: false
        }, { merge: true });
        showFeedback('success', 'Reply delivered.');
      } catch (e2: any) {
        showFeedback('error', `Failed to send reply: ${e2.message}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAndResolve = async (textToSend: string) => {
    if (!selectedChatId || !textToSend.trim()) return;
    await handleSendReply(textToSend);
    try {
      const now = Date.now();
      const chatRef = doc(db, 'support_chats', selectedChatId);
      const sysMsg = {
        id: `msg_sys_${now}`,
        sender: 'system',
        senderName: 'System Notice',
        text: '🔒 Support conversation resolved & closed by administrator.',
        timestamp: now,
        isSystemNotice: true
      };
      await updateDoc(chatRef, {
        status: 'closed',
        closedReason: 'admin_resolved',
        closedAt: now,
        messages: arrayUnion(sysMsg),
        updatedAt: now
      });
      showFeedback('success', 'Answer sent and ticket marked as resolved!');
    } catch (err: any) {
      console.warn("Auto-resolve note:", err);
    }
  };

  const handleCopyAiAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2000);
    showFeedback('success', 'Answer copied to clipboard');
  };

  const handleToggleChatStatus = async () => {
    if (!selectedChatId || !activeChat) return;
    const isCurrentlyClosed = activeChat.status === 'closed';
    const nextStatus = isCurrentlyClosed ? 'active' : 'closed';
    const now = Date.now();
    try {
      const chatRef = doc(db, 'support_chats', selectedChatId);
      const sysMsg = {
        id: `msg_sys_${now}`,
        sender: 'system',
        senderName: 'System Notice',
        text: isCurrentlyClosed 
          ? '🟢 Support conversation reopened by admin.' 
          : '🔒 Support conversation resolved & closed by admin.',
        timestamp: now,
        isSystemNotice: true
      };

      await updateDoc(chatRef, {
        status: nextStatus,
        closedReason: isCurrentlyClosed ? null : 'admin_resolved',
        closedAt: isCurrentlyClosed ? null : now,
        messages: arrayUnion(sysMsg),
        updatedAt: now
      });
      showFeedback('success', `Chat thread ${isCurrentlyClosed ? 'reopened' : 'closed'}.`);
    } catch (err: any) {
      showFeedback('error', `Failed to update chat status: ${err.message}`);
    }
  };

  // Full User Control: Set Membership & Plan Tier
  const handleSetUserMembership = async (newPlan: string, validityDays?: number) => {
    const uid = targetUserData?.id || activeChat?.userId;
    if (!uid) {
      showFeedback('error', 'User identifier not found.');
      return;
    }

    setIsSettingPlan(true);
    try {
      const isPro = newPlan !== 'Free Plan' && newPlan !== 'Basic Plan';
      const tier = newPlan.toLowerCase().includes('max') ? 'max' : (newPlan.toLowerCase().includes('plus') ? 'plus' : 'free');
      const expiresAt = validityDays 
        ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString() 
        : (isPro ? 'LIFETIME' : null);

      const updatePayload: any = {
        plan: newPlan,
        purchasedPlan: newPlan,
        activePlanMode: newPlan,
        isPro: isPro,
        membershipTier: tier,
        maxProjects: isPro ? 9999 : 5,
        updatedAt: new Date().toISOString()
      };
      if (expiresAt) {
        updatePayload.planExpiresAt = expiresAt;
      }

      await updateDoc(doc(db, 'users', uid), updatePayload);
      setTargetUserData((prev: any) => ({ ...prev, ...updatePayload }));

      // Send instant confirmation notification in user's support chat
      const now = Date.now();
      const planNotice = {
        id: `msg_plan_${now}`,
        sender: 'admin',
        senderName: 'PaperX Official Support',
        text: isPro 
          ? `🎉 Great news! Your membership plan has been set to **${newPlan}** by PaperX Support. All premium features (Neural OCR, Unlimited PDF Translation, 500MB upload limits, VIP queues) are now active on your account!`
          : `ℹ️ Your account membership plan has been updated to **${newPlan}**.`,
        timestamp: now
      };

      if (selectedChatId) {
        await updateDoc(doc(db, 'support_chats', selectedChatId), {
          messages: arrayUnion(planNotice),
          lastMessage: planNotice.text,
          updatedAt: now,
          unreadByUser: true
        });
      }

      showFeedback('success', `User membership updated to ${newPlan}!`);
    } catch (err: any) {
      showFeedback('error', `Failed to update membership: ${err.message}`);
    } finally {
      setIsSettingPlan(false);
    }
  };

  // Full User Control: Toggle Block / Disable Account
  const handleToggleUserBlock = async () => {
    if (!targetUserData?.id) return;
    const isCurrentlyBlocked = targetUserData.status === 'DISABLED' || targetUserData.isBlocked === true;
    const nextStatus = isCurrentlyBlocked ? 'ACTIVE' : 'DISABLED';
    try {
      await updateDoc(doc(db, 'users', targetUserData.id), {
        status: nextStatus,
        isBlocked: !isCurrentlyBlocked,
        updatedAt: new Date().toISOString()
      });
      setTargetUserData((prev: any) => ({ ...prev, status: nextStatus, isBlocked: !isCurrentlyBlocked }));
      showFeedback('success', `User ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully.`);
    } catch (err: any) {
      showFeedback('error', `Action failed: ${err.message}`);
    }
  };

  // Full User Control: Force Logout / Terminate Sessions
  const handleForceLogoutUser = async () => {
    if (!targetUserData?.id) return;
    try {
      await updateDoc(doc(db, 'users', targetUserData.id), {
        forceLogout: true,
        forceReLogin: true,
        updatedAt: new Date().toISOString()
      });
      showFeedback('success', `Forced logout applied for ${targetUserData.name || targetUserData.email || targetUserData.id}.`);
    } catch (err: any) {
      showFeedback('error', `Force logout failed: ${err.message}`);
    }
  };

  // Full User Control: Reset Storage Quota
  const handleResetUserQuota = async () => {
    if (!targetUserData?.id) return;
    try {
      await updateDoc(doc(db, 'users', targetUserData.id), {
        storageUsed: 0,
        conversionsThisMonth: 0,
        updatedAt: new Date().toISOString()
      });
      setTargetUserData((prev: any) => ({ ...prev, storageUsed: 0, conversionsThisMonth: 0 }));
      showFeedback('success', 'User storage and usage quota reset to 0.');
    } catch (err: any) {
      showFeedback('error', `Quota reset failed: ${err.message}`);
    }
  };

  const handleDeleteChatThread = async () => {
    if (!selectedChatId) return;
    try {
      await deleteDoc(doc(db, 'support_chats', selectedChatId));
      showFeedback('success', 'Chat thread deleted.');
      setSelectedChatId(null);
    } catch (err: any) {
      showFeedback('error', `Failed to delete: ${err.message}`);
    }
  };

  // Official Verified Knowledge Guides for 1-click insertion
  const knowledgeBaseGuides = [
    {
      title: "🔍 OCR & Text Extraction Guide",
      category: "OCR",
      text: `**How to Extract Text from Scanned PDFs & Images with PaperX OCR:**\n1. Open **OCR & Text Extract** from the tools menu.\n2. Upload your scanned PDF, JPG, PNG, or TIFF document.\n3. Choose your document language (40+ supported with automatic script detection).\n4. Select output format: **Editable Word (.docx)**, **Searchable PDF**, or **Clean Text (.txt)**.\n5. Click **Extract Text** to process through the Neural OCR engine.`
    },
    {
      title: "🌐 PDF & Document Translation Guide",
      category: "Translation",
      text: `**How to Translate PDF Documents Accurately:**\n1. Select the **Translate PDF** tool from the navigation bar.\n2. Upload your PDF document.\n3. Select your source and target language (40+ global languages supported).\n4. Enable **Preserve Formatting & Layout** to keep all headers, tables, columns, and graphics intact.\n5. Click **Translate Document** to generate a translated PDF ready for download.`
    },
    {
      title: "💳 Payment & UPI Settlement Policy",
      category: "Billing",
      text: `**Payment Verification & Settlement Details:**\n• UPI settlements take 5-20 minutes depending on the banking gateway.\n• If your money was debited, please provide your **12-digit UTR transaction number** and bank name here in this chat.\n• Our administrator will immediately cross-match with our banking ledger and upgrade your account to Plus/Max plan with lifetime access!`
    },
    {
      title: "📦 File Size & Page Limits Advice",
      category: "Limits",
      text: `**Document Processing Limits & Recommendations:**\n• **Free Tier:** Up to 50MB per file, 100 pages per conversion.\n• **Plus Plan:** Up to 250MB per file, unlimited pages, priority queue.\n• **Max VIP:** Up to 500MB per file, parallel batch processing.\n\n*Tip:* If your file exceeds 50MB on Free Tier, use our **Split PDF** or **Compress PDF** tool first, or upgrade to Plus for instant large file processing.`
    },
    {
      title: "🔐 PDF Password & Security Guide",
      category: "Security",
      text: `**PaperX Document Security & Encryption:**\n• All files processed through PaperX use TLS 1.3 in-transit and AES-256 encryption at rest.\n• Use **Protect PDF** to add military-grade password encryption, or **Unlock PDF** to remove passwords.\n• Files are automatically purged from processing clusters immediately after download.`
    }
  ];

  // Helper to color-code question types
  const getQuestionTypeBadge = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('ocr') || t.includes('extract')) {
      return { label: 'OCR & Text Extraction', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: <Search size={13} className="text-emerald-400" /> };
    }
    if (t.includes('translat')) {
      return { label: 'Document Translation', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: <Globe size={13} className="text-sky-400" /> };
    }
    if (t.includes('pay') || t.includes('utr') || t.includes('bill') || t.includes('money')) {
      return { label: 'Payment & UTR Settlement', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: <CreditCard size={13} className="text-amber-400" /> };
    }
    if (t.includes('limit') || t.includes('size') || t.includes('quota') || t.includes('page')) {
      return { label: 'File Limits & Quota', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: <Layers size={13} className="text-purple-400" /> };
    }
    if (t.includes('convert') || t.includes('merge') || t.includes('split') || t.includes('format')) {
      return { label: 'Format Conversion', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: <FileCheck size={13} className="text-blue-400" /> };
    }
    if (t.includes('compress')) {
      return { label: 'PDF Compression', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: <Zap size={13} className="text-cyan-400" /> };
    }
    if (t.includes('secur') || t.includes('sign') || t.includes('protect') || t.includes('lock')) {
      return { label: 'Security & Signature', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: <Lock size={13} className="text-rose-400" /> };
    }
    if (t.includes('account') || t.includes('login') || t.includes('block')) {
      return { label: 'Account & Access', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: <User size={13} className="text-orange-400" /> };
    }
    return { label: type || 'General Inquiry', bg: 'bg-stone-800 text-stone-300 border-stone-700', icon: <HelpCircle size={13} className="text-stone-400" /> };
  };

  const filteredChats = chats.filter(c => {
    const matchesSearch = 
      (c.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'unread') return c.unreadByAdmin === true;
    if (filterType === 'payment') return (c.lastMessage || '').toLowerCase().includes('payment') || (c.lastMessage || '').toLowerCase().includes('utr') || (c.lastMessage || '').toLowerCase().includes('stuck');
    if (filterType === 'ocr') return (c.lastMessage || '').toLowerCase().includes('ocr') || (c.lastMessage || '').toLowerCase().includes('extract') || (c.lastMessage || '').toLowerCase().includes('scan');
    if (filterType === 'translate') return (c.lastMessage || '').toLowerCase().includes('translat');
    return true;
  });

  const currentLatestQuery = getLatestUserQuery();
  const qTypeBadge = getQuestionTypeBadge(aiResolution?.questionType || aiResolution?.category);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 rounded-3xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Brain size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                  Support Command Center & AI Intelligence Desk
                </h3>
                <p className="text-xs text-stone-400">
                  Real-time question classification, deep accurate answers, and full administrative user control
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterType === 'all' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
            >
              All Threads ({chats.length})
            </button>
            <button 
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterType === 'unread' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
            >
              <AlertCircle size={13} className="text-amber-400" />
              Unread ({chats.filter(c => c.unreadByAdmin).length})
            </button>
            <button 
              onClick={() => setFilterType('payment')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterType === 'payment' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
            >
              <CreditCard size={13} className="text-amber-400" />
              Payment & UTR
            </button>
            <button 
              onClick={() => setFilterType('ocr')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterType === 'ocr' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
            >
              <Search size={13} className="text-emerald-400" />
              OCR
            </button>
            <button 
              onClick={() => setFilterType('translate')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${filterType === 'translate' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}`}
            >
              <Globe size={13} className="text-sky-400" />
              Translation
            </button>
          </div>
        </div>
      </div>

      {/* Main Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[780px]">
        {/* Left: Chat Threads List (4 Cols) */}
        <div className="lg:col-span-4 bg-stone-900/90 border border-stone-800 rounded-3xl flex flex-col overflow-hidden shadow-xl">
          {/* Search bar */}
          <div className="p-3.5 border-b border-stone-800/80 bg-stone-950/40">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-stone-500" size={14} />
              <input 
                type="text" 
                placeholder="Search user, email, UTR, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Threads Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-800/40 custom-scrollbar">
            {filteredChats.length === 0 ? (
              <div className="p-10 text-center text-stone-500 text-xs">
                <MessageCircle size={32} className="mx-auto mb-2 text-stone-600 animate-bounce" />
                No support chat threads matching query.
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;
                const hasUnread = chat.unreadByAdmin;
                const isClosed = chat.status === 'closed';

                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      if (hasUnread) {
                        try {
                          updateDoc(doc(db, 'support_chats', chat.id), { unreadByAdmin: false });
                        } catch (e) {}
                      }
                    }}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-to-r from-orange-500/15 via-stone-800/90 to-stone-800/40 border-l-4 border-l-orange-500 text-white' 
                        : 'hover:bg-stone-800/50 text-stone-300'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 text-xs font-black">
                        {(chat.userName || chat.userEmail || 'U').charAt(0).toUpperCase()}
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-stone-900 animate-ping" />
                      )}
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-stone-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-black truncate text-white">
                          {chat.userName || chat.userEmail || chat.id}
                        </span>
                        <span className="text-[10px] text-stone-500 shrink-0 font-mono">
                          {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-400 truncate font-sans">
                        {chat.lastMessage || 'Support conversation started'}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {isClosed ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                            🔒 Closed
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            🟢 Live
                          </span>
                        )}

                        {chat.userEmail && (
                          <span className="text-[9px] font-mono text-stone-400 truncate max-w-[130px]">
                            {chat.userEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Resolution & Command Suite (8 Cols) */}
        <div className="lg:col-span-8 bg-stone-900/90 border border-stone-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
          {activeChat ? (
            <>
              {/* Active Chat Header with User Identification */}
              <div className="p-4 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black shrink-0">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white truncate">
                        {activeChat.userName || targetUserData?.name || 'Customer'}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        targetUserData?.isPro 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                          : 'bg-stone-800 text-stone-400 border-stone-700'
                      }`}>
                        {targetUserData?.plan || (targetUserData?.isPro ? 'Pro Member' : 'Free Tier')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                      <span>Email: {activeChat.userEmail || targetUserData?.email || 'N/A'}</span>
                      <span>•</span>
                      <span className="truncate">UID: {activeChat.userId || activeChat.id}</span>
                    </div>
                  </div>
                </div>

                {/* Top Action Tools */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsKnowledgeDrawerOpen(!isKnowledgeDrawerOpen)}
                    className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl border border-stone-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Open Knowledge Base Guide Browser"
                  >
                    <BookOpen size={13} className="text-orange-400" />
                    <span className="hidden sm:inline">Official Guides</span>
                  </button>

                  <button
                    onClick={handleToggleChatStatus}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                      activeChat.status === 'closed'
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                    }`}
                  >
                    {activeChat.status === 'closed' ? <Unlock size={13} /> : <Lock size={13} />}
                    {activeChat.status === 'closed' ? 'Reopen' : 'Close Ticket'}
                  </button>

                  <button
                    onClick={handleDeleteChatThread}
                    className="p-1.5 bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 rounded-xl border border-stone-700 transition cursor-pointer"
                    title="Delete Chat Thread"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* 🌟 1. QUESTION TYPE CLASSIFICATION & INTENT DIAGNOSIS BANNER */}
              <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-stone-800 p-3.5 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={12} className="text-orange-400" />
                      Detected Question Type:
                    </span>
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm ${qTypeBadge.bg}`}>
                      {qTypeBadge.icon}
                      {aiResolution?.questionType || qTypeBadge.label}
                    </span>
                    {aiResolution?.urgency && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                        aiResolution.urgency === 'High'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                          : aiResolution.urgency === 'Medium'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        Urgency: {aiResolution.urgency.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Tone Selectors */}
                    <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800 text-[10px] font-bold">
                      <button 
                        onClick={() => { setAiTone('professional'); fetchAiSuggestion(currentLatestQuery, 'professional'); }}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${aiTone === 'professional' ? 'bg-orange-500 text-black' : 'text-stone-400 hover:text-white'}`}
                      >
                        Professional
                      </button>
                      <button 
                        onClick={() => { setAiTone('detailed'); fetchAiSuggestion(currentLatestQuery, 'detailed'); }}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${aiTone === 'detailed' ? 'bg-orange-500 text-black' : 'text-stone-400 hover:text-white'}`}
                      >
                        Detailed
                      </button>
                      <button 
                        onClick={() => { setAiTone('concise'); fetchAiSuggestion(currentLatestQuery, 'concise'); }}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${aiTone === 'concise' ? 'bg-orange-500 text-black' : 'text-stone-400 hover:text-white'}`}
                      >
                        Concise
                      </button>
                    </div>

                    <button
                      onClick={() => fetchAiSuggestion(currentLatestQuery)}
                      disabled={isGeneratingAi}
                      className="p-1.5 bg-stone-800 hover:bg-stone-700 text-orange-400 rounded-lg border border-stone-700 transition cursor-pointer"
                      title="Re-analyze Question & Regenerate Solution"
                    >
                      <RefreshCw size={13} className={isGeneratingAi ? 'animate-spin' : ''} />
                    </button>

                    <button
                      onClick={() => setIsAiBoxExpanded(!isAiBoxExpanded)}
                      className="p-1.5 text-stone-400 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      {isAiBoxExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* User Intent Summary */}
                {aiResolution?.userIntentSummary && (
                  <div className="mt-2 text-[11px] text-stone-300 flex items-center gap-2 bg-stone-950/80 px-3 py-1.5 rounded-xl border border-stone-800/80">
                    <strong className="text-orange-400 shrink-0 font-bold">Diagnosed Issue:</strong>
                    <span className="italic text-stone-200">{aiResolution.userIntentSummary}</span>
                  </div>
                )}
              </div>

              {/* 🌟 2. ACCURATE ANSWER & PERFECT HELP SUITE */}
              {isAiBoxExpanded && (
                <div className="bg-gradient-to-b from-orange-950/30 via-stone-900 to-stone-900/90 border-b border-orange-500/20 p-4 space-y-3.5 shrink-0">
                  {isGeneratingAi ? (
                    <div className="p-6 bg-stone-950/80 border border-orange-500/20 rounded-2xl flex items-center justify-center gap-3 text-xs text-orange-300">
                      <Sparkles size={18} className="animate-spin text-orange-400" />
                      Analyzing inquiry and formulating 100% accurate step-by-step resolution...
                    </div>
                  ) : aiResolution ? (
                    <div className="bg-stone-950/90 border border-orange-500/30 rounded-2xl p-4 space-y-3 shadow-inner">
                      {/* Suggested Answer Body */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-orange-400" />
                            Accurate Step-by-Step Answer (Ready to Send)
                          </span>
                          <span className="text-[10px] font-mono text-stone-500">
                            Tone: {aiTone.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-stone-100 whitespace-pre-wrap leading-relaxed font-sans bg-stone-900/60 p-3 rounded-xl border border-stone-800/90">
                          {aiResolution.suggestedAnswer}
                        </div>
                      </div>

                      {/* Direct Tool Guide Card */}
                      {aiResolution.directToolGuide && (
                        <div className="bg-stone-900/80 border border-orange-500/20 p-3 rounded-xl text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-orange-300 flex items-center gap-1">
                              <Zap size={13} className="text-amber-400" />
                              Official Tool Procedure: {aiResolution.directToolGuide.toolName}
                            </span>
                            <button
                              onClick={() => {
                                const guideText = `**Guide for ${aiResolution.directToolGuide?.toolName}:**\n` + aiResolution.directToolGuide?.actionSteps.join('\n');
                                setReplyText(guideText);
                              }}
                              className="text-[10px] font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                            >
                              Insert in Reply Box
                            </button>
                          </div>
                          <ul className="space-y-0.5 text-stone-300 pl-1">
                            {aiResolution.directToolGuide.actionSteps.map((step, sIdx) => (
                              <li key={sIdx} className="text-stone-300">• {step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Admin Action */}
                      {aiResolution.recommendedAction && (
                        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-300">
                          <Brain size={15} className="shrink-0 mt-0.5 text-amber-400" />
                          <div>
                            <strong className="font-bold text-amber-200">Recommended Admin Action: </strong>
                            {aiResolution.recommendedAction}
                          </div>
                        </div>
                      )}

                      {/* Quick Action Presets */}
                      {aiResolution.quickActionOptions && aiResolution.quickActionOptions.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] font-bold text-stone-500 uppercase">1-Click Presets:</span>
                          {aiResolution.quickActionOptions.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleSendReply(opt.text)}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-[10px] font-semibold text-stone-200 rounded-lg border border-stone-700 transition cursor-pointer flex items-center gap-1"
                              title={opt.text}
                            >
                              <Send size={10} className="text-orange-400" />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Main Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
                        {/* Alternative Drafts */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-stone-500 uppercase">Alternate Drafts:</span>
                          {aiResolution.alternativeDrafts?.map((alt, idx) => (
                            <button
                              key={idx}
                              onClick={() => setReplyText(alt)}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-300 rounded-md border border-stone-700 transition cursor-pointer truncate max-w-[150px]"
                              title={alt}
                            >
                              Option {idx + 1}
                            </button>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleCopyAiAnswer(aiResolution.suggestedAnswer)}
                            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold rounded-xl border border-stone-700 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedAi ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            {copiedAi ? 'Copied' : 'Copy'}
                          </button>

                          <button
                            onClick={() => setReplyText(aiResolution.suggestedAnswer)}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-orange-400 text-xs font-bold rounded-xl border border-orange-500/30 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CornerDownLeft size={13} /> Insert in Reply
                          </button>

                          <button
                            onClick={() => handleSendAndResolve(aiResolution.suggestedAnswer)}
                            disabled={isSending}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={13} /> Send & Mark Resolved
                          </button>

                          <button
                            onClick={() => handleSendReply(aiResolution.suggestedAnswer)}
                            disabled={isSending}
                            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-black text-xs font-black rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send size={13} /> Send to User
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-stone-950/50 border border-stone-800 rounded-2xl text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                      <span>Click to analyze question and formulate solution:</span>
                      <button
                        onClick={() => fetchAiSuggestion(currentLatestQuery || 'General Support Help')}
                        className="px-3 py-1 bg-orange-500 text-black font-bold rounded-xl text-xs hover:bg-orange-400 transition cursor-pointer"
                      >
                        Generate Resolution
                      </button>
                    </div>
                  )}

                  {/* Custom Ask AI */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customAiQuery.trim()) {
                        fetchAiSuggestion(customAiQuery.trim());
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <input 
                      type="text" 
                      placeholder="Ask PaperX Intelligence regarding this customer or document issue..."
                      value={customAiQuery}
                      onChange={(e) => setCustomAiQuery(e.target.value)}
                      className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={!customAiQuery.trim() || isGeneratingAi}
                      className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-orange-400 text-xs font-bold rounded-xl border border-stone-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Sparkles size={13} /> Ask AI
                    </button>
                  </form>
                </div>
              )}

              {/* 🌟 3. FULL USER CONTROL & MEMBERSHIP DOCK */}
              <div className="bg-stone-950/90 border-b border-stone-800 p-3 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={12} className="text-orange-400" />
                    Full User Control & Moderation Suite
                  </span>
                  <button
                    onClick={() => setIsUserControlExpanded(!isUserControlExpanded)}
                    className="text-[10px] text-stone-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isUserControlExpanded ? 'Collapse' : 'Expand Controls'}
                    {isUserControlExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {isUserControlExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Membership & Plan Quota Tier Controls */}
                    <div className="bg-stone-900/90 border border-stone-800/90 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          <Crown size={14} className="text-amber-400" /> Plan & Limits
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          Current: <strong className="text-amber-300">{targetUserData?.plan || 'Free Tier'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleSetUserMembership('Plus Plan', 30)}
                          disabled={isSettingPlan}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Grant Plus Plan (30 Days)"
                        >
                          <Crown size={12} /> Plus (30D)
                        </button>

                        <button
                          onClick={() => handleSetUserMembership('Max Plan', 30)}
                          disabled={isSettingPlan}
                          className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Grant Max VIP Plan (30 Days)"
                        >
                          <Zap size={12} /> Max (30D)
                        </button>

                        <button
                          onClick={() => handleSetUserMembership('Max Plan')}
                          disabled={isSettingPlan}
                          className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Grant Lifetime Unlimited Access"
                        >
                          ♾️ Lifetime Max
                        </button>

                        <button
                          onClick={() => handleSetUserMembership('Free Plan')}
                          disabled={isSettingPlan}
                          className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Reset to Free Tier"
                        >
                          Reset Free
                        </button>
                      </div>
                    </div>

                    {/* Security, Moderation & Quota Controls */}
                    <div className="bg-stone-900/90 border border-stone-800/90 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          <ShieldAlert size={14} className="text-rose-400" /> Account Security & Session
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">
                          Status: <strong className={targetUserData?.status === 'DISABLED' ? 'text-rose-400' : 'text-emerald-400'}>{targetUserData?.status || 'ACTIVE'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={handleToggleUserBlock}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                            targetUserData?.status === 'DISABLED'
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {targetUserData?.status === 'DISABLED' ? <Unlock size={12} /> : <Lock size={12} />}
                          {targetUserData?.status === 'DISABLED' ? 'Unblock User' : 'Block User'}
                        </button>

                        <button
                          onClick={handleForceLogoutUser}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Force immediate logout on user's device"
                        >
                          <LogOut size={12} className="text-amber-400" /> Force Re-login
                        </button>

                        <button
                          onClick={handleResetUserQuota}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Reset conversions and storage quota"
                        >
                          <RefreshCw size={12} className="text-blue-400" /> Reset Quota
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Knowledge Base Modal / Drawer */}
              {isKnowledgeDrawerOpen && (
                <div className="bg-stone-950 border-b border-orange-500/30 p-4 space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                      <BookOpen size={14} className="text-orange-400" />
                      PaperX Official Knowledge Base & Instant Insertion Desk
                    </h5>
                    <button 
                      onClick={() => setIsKnowledgeDrawerOpen(false)}
                      className="text-stone-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {knowledgeBaseGuides.map((guide, gIdx) => (
                      <div key={gIdx} className="bg-stone-900 p-2.5 rounded-xl border border-stone-800 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-black text-orange-400">{guide.title}</div>
                          <p className="text-[10px] text-stone-400 line-clamp-2">{guide.text}</p>
                        </div>
                        <div className="flex items-center gap-1 pt-1">
                          <button
                            onClick={() => setReplyText(guide.text)}
                            className="flex-1 py-1 bg-stone-800 hover:bg-stone-700 text-[10px] font-bold text-stone-300 rounded-lg transition cursor-pointer"
                          >
                            Insert
                          </button>
                          <button
                            onClick={() => handleSendReply(guide.text)}
                            className="flex-1 py-1 bg-orange-500 hover:bg-orange-400 text-[10px] font-black text-black rounded-lg transition cursor-pointer"
                          >
                            Send Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Message Logs Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-stone-950/40">
                {(!activeChat.messages || activeChat.messages.length === 0) ? (
                  <div className="text-center py-12 text-stone-500 text-xs">
                    Start conversation by typing below or sending the AI suggested resolution above.
                  </div>
                ) : (
                  activeChat.messages.map((msg: any, idx: number) => {
                    const isAdmin = msg.sender === 'admin';
                    const isBot = msg.sender === 'bot';
                    const isSystem = msg.sender === 'system' || msg.isSystemNotice;

                    if (isSystem) {
                      return (
                        <div key={msg.id || idx} className="flex justify-center my-2">
                          <span className="px-3.5 py-1 rounded-full bg-stone-800/90 border border-stone-700 text-[10px] text-stone-300 font-mono shadow-sm">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={msg.id || idx}
                        className={`flex flex-col ${isAdmin ? 'items-end' : (isBot ? 'items-start' : 'items-start')}`}
                      >
                        <div className={`max-w-[85%] rounded-3xl p-4 text-xs shadow-lg ${
                          isAdmin 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-semibold rounded-br-none' 
                            : isBot 
                              ? 'bg-stone-900 border border-orange-500/40 text-stone-100 rounded-bl-none'
                              : 'bg-stone-800 text-stone-100 border border-stone-700/80 rounded-bl-none'
                        }`}>
                          <div className={`text-[10px] font-black mb-1.5 flex items-center gap-1.5 ${isAdmin ? 'text-black opacity-90' : (isBot ? 'text-orange-400' : 'text-stone-400')}`}>
                            {isBot && <Bot size={13} className="text-orange-400" />}
                            {isAdmin && <Shield size={13} />}
                            {!isAdmin && !isBot && <User size={13} />}
                            {msg.senderName || (isAdmin ? 'PaperX Administrator' : (isBot ? 'PaperX AI Support' : 'Customer'))}
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</p>
                          <div className={`text-[9px] mt-2 text-right font-mono ${isAdmin ? 'text-black opacity-70' : 'text-stone-500'}`}>
                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form Bar */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="p-3.5 bg-stone-950/90 border-t border-stone-800 flex items-center gap-2 shrink-0">
                <input 
                  type="text" 
                  placeholder="Type instant answer or resolution to send to user..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Send size={15} /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500 text-xs">
              <MessageSquare size={40} className="text-stone-600 mb-3 animate-pulse" />
              <p className="font-bold text-stone-400 text-sm mb-1">Select a Support Thread</p>
              Choose a customer conversation from the left to view question classification, AI answers, and full user controls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
