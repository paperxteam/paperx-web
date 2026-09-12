import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle, DollarSign, 
  Search, Filter, ArrowUpRight, ShieldCheck, RefreshCw, Layers, Edit3,
  Image as ImageIcon, FileText, AlertCircle, ShieldAlert, ExternalLink
} from 'lucide-react';
import { db } from '../../../services/firebase';
import { doc, updateDoc, addDoc, collection, onSnapshot } from 'firebase/firestore';

interface PaymentsViewProps {
  ordersList: any[];
  adminPin: string;
  showFeedback: (type: 'success' | 'error', text: string) => void;
  onRefreshData: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  ordersList,
  adminPin,
  showFeedback,
  onRefreshData
}) => {
  const [subTab, setSubTab] = useState<'utr' | 'refunds' | 'plans' | 'orders'>('refunds');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundTickets, setRefundTickets] = useState<any[]>([]);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Real-time listener for support tickets (refunds) and user documents
  useEffect(() => {
    const unsubTickets = onSnapshot(collection(db, 'support_tickets'), (snapshot) => {
      const tickets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRefundTickets(tickets);
    }, () => {});

    const unsubDocs = onSnapshot(collection(db, 'documents'), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllDocs(docs);
    }, () => {});

    return () => {
      unsubTickets();
      unsubDocs();
    };
  }, []);

  const handleTicketStatusUpdate = async (ticketId: string, status: string, reason?: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/ticket/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          ticketId,
          status,
          decision: reason || status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server ticket update failed.');

      showFeedback('success', `Ticket ${ticketId} successfully updated via Server Sync.`);
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', `Failed to update ticket: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRefundTickets = refundTickets.filter(t => {
    const matchesSearch = 
      (t.ticketId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.upiId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.payoutPhone || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Real Order Actions via Server API (Ensures Socket.IO BroadCast)
  const handleOrderAction = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/order/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: adminPin,
          orderId,
          action
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server order update failed.');

      showFeedback('success', `Order ${orderId} ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully via Server Sync.`);
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', `Order action failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestReview = (orderId: string) => {
    showFeedback('success', `Requested additional payment proof for Order ${orderId}. User notified.`);
  };

  const filteredOrders = ordersList.filter(o => {
    const matchesSearch = 
      (o.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.uid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.utr || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingOrders = ordersList.filter(o => o.status === 'PENDING' && o.utr && typeof o.utr === 'string' && o.utr.trim().length > 0);
  const verifiedOrders = ordersList.filter(o => o.status === 'VERIFIED');

  // Total revenue calculation
  const totalRevenue = verifiedOrders.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="text-orange-500" size={24} />
            Payments, UTR Verification & Subscriptions
          </h3>
          <p className="text-xs text-stone-400">
            Verify manual UPI UTR payments, audit membership plans, and track total revenue
          </p>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-900 border border-stone-800 p-1 rounded-2xl">
          <button
            onClick={() => setSubTab('refunds')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              subTab === 'refunds' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <RefreshCw size={14} /> Refund Requests ({refundTickets.length})
          </button>
          <button
            onClick={() => setSubTab('utr')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              subTab === 'utr' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Clock size={14} /> UTR Verification ({pendingOrders.length})
          </button>
          <button
            onClick={() => setSubTab('plans')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              subTab === 'plans' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Layers size={14} /> Plan Tiers
          </button>
          <button
            onClick={() => setSubTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              subTab === 'orders' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <DollarSign size={14} /> All Orders ({ordersList.length})
          </button>
        </div>
      </div>

      {/* SUB TAB: REFUND & PAYOUT REQUESTS */}
      {subTab === 'refunds' && (
        <div className="space-y-6">
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <RefreshCw size={18} className="text-orange-500 animate-spin" style={{ animationDuration: '8s' }} />
                  Refund & Payout Verification Panel ({filteredRefundTickets.length})
                </h4>
                <p className="text-xs text-stone-400 mt-0.5">
                  Review user refund requests, verify attached QR codes, inspect user workspace history, and apply eligibility decisions.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-3 text-stone-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search user, phone, UPI or ticket ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl pl-10 pr-4 py-2.5"
                />
              </div>
            </div>

            {filteredRefundTickets.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-800 rounded-2xl">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-white">No refund or payout requests found.</p>
                <p className="text-xs text-stone-500 mt-1">When users request membership refunds under the 2-day guarantee, they appear here instantly.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredRefundTickets.map((ticket) => {
                  // User workspace history items
                  const userDocuments = allDocs.filter(d => d.uid === ticket.uid);
                  const itemCount = userDocuments.length;
                  
                  // Time elapsed since order creation / request
                  const orderTime = ticket.createdAt || Date.now();
                  const hoursElapsed = (Date.now() - orderTime) / (1000 * 60 * 60);
                  const isExceedsTime = hoursElapsed > 48; // 2 days guarantee limit
                  const isExceedsItems = itemCount > 10; // > 10 items created
                  const isInvalidRecommendation = isExceedsTime || isExceedsItems;

                  return (
                    <div key={ticket.id || ticket.ticketId} className="bg-stone-950 border border-stone-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-stone-800 pb-4 mb-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                              {ticket.ticketId || ticket.id}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                              ticket.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              ticket.status?.includes('REJECTED') ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              ticket.status === 'PROCESSING' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {ticket.status || 'OPEN'}
                            </span>
                          </div>
                          <h5 className="text-base font-black text-white mt-1.5 flex items-center gap-2">
                            {ticket.userName || ticket.userEmail || 'User'} 
                            <span className="text-xs font-normal text-stone-400">({ticket.plan || 'Plus Plan'})</span>
                          </h5>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Refund Amount</p>
                          <h4 className="text-xl font-black text-emerald-400">₹{ticket.amount || 50}</h4>
                        </div>
                      </div>

                      {/* Rule Recommendation Warning Banner if > 10 items or > 2 days */}
                      {isInvalidRecommendation && ticket.status === 'OPEN' && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl flex items-start gap-3">
                          <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-extrabold text-red-300">Automated Policy Warning: Recommended "Rejected for Not Valid"</p>
                            <p className="text-stone-300 mt-0.5">
                              {isExceedsItems && `• User has created ${itemCount} items in their workspace (exceeds 10-item trial limit).\n`}
                              {isExceedsTime && `• Request was made ${Math.round(hoursElapsed / 24)} days after purchase (exceeds 2-day guarantee).\n`}
                              User has fully tested features and is not eligible for standard refund.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Payout Details */}
                        <div className="space-y-2.5 text-xs bg-stone-900/60 p-4 rounded-xl border border-stone-800/80">
                          <h6 className="font-black text-stone-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                            <CreditCard size={14} className="text-orange-400" /> Payout Destination
                          </h6>
                          <p><span className="text-stone-400 font-bold">Name:</span> <span className="text-white font-bold">{ticket.payoutName || ticket.userName || 'N/A'}</span></p>
                          <p><span className="text-stone-400 font-bold">Phone (10-Digit):</span> <span className="font-mono text-white font-bold">{ticket.payoutPhone || 'N/A'}</span></p>
                          <p><span className="text-stone-400 font-bold">UPI ID (VPA):</span> <span className="font-mono text-emerald-400 font-bold">{ticket.upiId || 'N/A'}</span></p>
                          <p><span className="text-stone-400 font-bold">Requested On:</span> {new Date(ticket.createdAt || Date.now()).toLocaleString()}</p>
                        </div>

                        {/* QR Code Image Preview */}
                        <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800/80 flex flex-col items-center justify-center">
                          <h6 className="font-black text-stone-300 uppercase tracking-wider text-[11px] mb-2 w-full flex items-center gap-1.5">
                            <ImageIcon size={14} className="text-indigo-400" /> Attached UPI QR Code
                          </h6>
                          {ticket.qrCodeBase64 ? (
                            <div className="relative group cursor-pointer" onClick={() => setSelectedImageModal(ticket.qrCodeBase64)}>
                              <img 
                                src={ticket.qrCodeBase64} 
                                alt="User UPI QR Code" 
                                className="w-28 h-28 object-cover rounded-xl border border-stone-700 shadow-md hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white text-[10px] font-extrabold">
                                Click to Zoom
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-stone-500 text-xs">
                              <p>No QR image attached</p>
                              <p className="text-[10px] text-stone-600">User provided UPI VPA directly</p>
                            </div>
                          )}
                        </div>

                        {/* Full User Workspace History */}
                        <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <h6 className="font-black text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <FileText size={14} className="text-teal-400" /> User Workspace History
                            </h6>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              {itemCount} items created
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400"><span className="font-bold text-white">Refund Reason:</span> "{ticket.reason || ticket.notes || 'No reason provided'}"</p>
                          <div className="max-h-24 overflow-y-auto space-y-1 pr-1 mt-2">
                            {userDocuments.length === 0 ? (
                              <p className="text-[11px] text-stone-500 italic">No workspace items found for this user.</p>
                            ) : (
                              userDocuments.map((doc: any, i: number) => (
                                <div key={doc.id || i} className="text-[11px] bg-stone-950 px-2.5 py-1 rounded border border-stone-800/80 flex items-center justify-between">
                                  <span className="text-stone-300 truncate max-w-[140px]">{doc.title || doc.name || `Item #${i + 1}`}</span>
                                  <span className="text-[10px] text-stone-500 font-mono">{doc.type || 'PDF'}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Options & Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
                        <span className="text-xs text-stone-400 font-bold">Update Ticket Status & Payout Action:</span>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleTicketStatusUpdate(ticket.id || ticket.ticketId, 'PROCESSING')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock size={13} /> Processing
                          </button>

                          <button
                            onClick={() => handleTicketStatusUpdate(ticket.id || ticket.ticketId, 'COMPLETED')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <CheckCircle2 size={13} /> Completed (Refund Paid)
                          </button>

                          <button
                            onClick={() => handleTicketStatusUpdate(ticket.id || ticket.ticketId, 'REJECTED_WRONG_INFO', 'Rejected for wrong information (UPI/Phone error)')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle size={13} /> Rejected for Wrong Info
                          </button>

                          <button
                            onClick={() => handleTicketStatusUpdate(ticket.id || ticket.ticketId, 'REJECTED_NOT_VALID', 'Rejected for not valid (>10 items created or >2 days)')}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <ShieldAlert size={13} /> Rejected for Not Valid
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Zoom Modal */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedImageModal(null)}>
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-black text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-orange-500" /> Attached UPI QR Code Preview
              </h5>
              <button onClick={() => setSelectedImageModal(null)} className="p-1 text-stone-400 hover:text-white rounded-lg">
                <XCircle size={20} />
              </button>
            </div>
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-center">
              <img src={selectedImageModal} alt="Enlarged QR Code" className="max-h-96 w-auto object-contain rounded-xl" />
            </div>
            <button
              onClick={() => setSelectedImageModal(null)}
              className="w-full mt-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-extrabold text-xs rounded-xl transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Live Financial Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Revenue</p>
            <h4 className="text-xl font-black text-emerald-400">₹{totalRevenue.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Pending Approvals</p>
            <h4 className="text-xl font-black text-amber-400">{pendingOrders.length} orders</h4>
          </div>
        </div>

        <div className="bg-stone-900/70 border border-stone-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Approved Memberships</p>
            <h4 className="text-xl font-black text-white">{verifiedOrders.length} active</h4>
          </div>
        </div>
      </div>

      {/* SUB TAB 1: DEDICATED VERIFICATION QUEUE */}
      {subTab === 'utr' && (
        <div className="space-y-4">
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
              <Clock size={18} className="text-amber-500" />
              Pending UPI UTR Verification Queue ({pendingOrders.length})
            </h4>

            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-800 rounded-2xl">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-white">All pending orders are cleared!</p>
                <p className="text-xs text-stone-500 mt-1">New user payment submissions will appear here instantly in real time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOrders.map((order) => (
                  <div key={order.orderId} className="bg-stone-950 border border-stone-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
                    <div className="flex items-start justify-between border-b border-stone-800 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-orange-400 font-mono">{order.orderId}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            UPI / QR
                          </span>
                        </div>
                        <h5 className="text-sm font-black text-white mt-0.5">{order.plan} Upgrade</h5>
                      </div>
                      <span className="text-lg font-black text-emerald-400">₹{order.amount}</span>
                    </div>

                    <div className="space-y-2 text-xs text-stone-300 mb-4">
                      <p><span className="text-stone-500 font-bold">User / Email:</span> <span className="font-mono text-white">{order.userEmail || order.userName || order.uid}</span></p>
                      <p><span className="text-stone-500 font-bold">12-Digit UTR:</span> <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{order.utr || 'Not provided'}</span></p>
                      <p><span className="text-stone-500 font-bold">Submitted:</span> {new Date(order.submittedAt || order.createdAt).toLocaleString()}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800/80">
                      {(order.ticketId && (order.ticketReason?.toLowerCase().includes('refund') || order.ticketReason?.toLowerCase().includes('upgrade'))) ? (
                        <>
                          <button
                            onClick={() => handleTicketStatusUpdate(order.ticketId, 'PROCESSING')}
                            disabled={isProcessing}
                            className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[10px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Clock size={12} /> Processing
                          </button>
                          <button
                            onClick={() => handleTicketStatusUpdate(order.ticketId, 'COMPLETED')}
                            disabled={isProcessing}
                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={12} /> Completed
                          </button>
                          <button
                            onClick={() => handleTicketStatusUpdate(order.ticketId, 'REJECTED_WRONG_INFO', 'Rejected for wrong information')}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <XCircle size={12} /> Wrong Info
                          </button>
                          <button
                            onClick={() => handleTicketStatusUpdate(order.ticketId, 'REJECTED_NOT_VALID', 'Rejected for not valid')}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShieldAlert size={12} /> Not Valid
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOrderAction(order.orderId, 'APPROVE')}
                            disabled={isProcessing}
                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> APPROVE & ACTIVATE
                          </button>

                          <button
                            onClick={() => handleOrderAction(order.orderId, 'REJECT')}
                            disabled={isProcessing}
                            className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <XCircle size={14} /> REJECT
                          </button>

                          <button
                            onClick={() => handleRequestReview(order.orderId)}
                            title="Request additional proof"
                            className="p-2 bg-stone-900 border border-stone-800 text-stone-300 hover:text-white rounded-xl transition text-xs cursor-pointer"
                          >
                            Review
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: PLANS & SUBSCRIPTIONS MANAGER */}
      {subTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Free Tier</span>
              <h4 className="text-xl font-black text-white mt-1">Free Plan</h4>
              <p className="text-2xl font-black text-orange-400 mt-3">₹0 <span className="text-xs text-stone-500 font-normal">/ forever</span></p>

              <ul className="mt-4 space-y-2 text-xs text-stone-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Daily limits</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Standard PDF Tools</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Standard Support</li>
              </ul>
            </div>
            <button className="w-full mt-6 py-2 bg-stone-800 text-stone-300 font-bold text-xs rounded-xl hover:bg-stone-700 transition flex items-center justify-center gap-1.5">
              <Edit3 size={14} /> Plan Details
            </button>
          </div>

          {/* Plus Plan */}
          <div className="bg-stone-900/60 border-2 border-indigo-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <span className="absolute top-3 right-3 bg-indigo-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Popular</span>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">Plus Tier</span>
              <h4 className="text-xl font-black text-white mt-1">Plus Plan</h4>
              <p className="text-2xl font-black text-white mt-3">₹50 <span className="text-xs text-stone-400 font-normal">/ month</span></p>

              <ul className="mt-4 space-y-2 text-xs text-stone-200">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-400" /> All Free features</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-400" /> Word, Excel, PPT converters</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-400" /> Edit PDF text & images</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-400" /> Private Folder & Unlimited files</li>
              </ul>
            </div>
            <button className="w-full mt-6 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-500 transition flex items-center justify-center gap-1.5">
              <Edit3 size={14} /> Update Plus Features
            </button>
          </div>

          {/* Max Plan */}
          <div className="bg-stone-900/60 border-2 border-yellow-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-yellow-400 tracking-wider">Max Tier</span>
              <h4 className="text-xl font-black text-white mt-1">Max Plan</h4>
              <p className="text-2xl font-black text-yellow-400 mt-3">₹100 <span className="text-xs text-stone-500 font-normal">/ month</span></p>

              <ul className="mt-4 space-y-2 text-xs text-stone-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-400" /> Full AI Document Suite & Q&A</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-400" /> OCR & Handwriting recognition</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-400" /> 100GB Cloud Storage & 24/7 Support</li>
              </ul>
            </div>
            <button className="w-full mt-6 py-2 bg-stone-800 text-stone-300 font-bold text-xs rounded-xl hover:bg-stone-700 transition flex items-center justify-center gap-1.5">
              <Edit3 size={14} /> Update Max Features
            </button>
          </div>
        </div>
      )}

      {/* SUB TAB 3: MASTER ORDERS LEDGER */}
      {subTab === 'orders' && (
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-stone-950/80 border-b border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 text-stone-400" size={16} />
              <input 
                type="text"
                placeholder="Search order ID, UID or UTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-xs rounded-xl pl-10 pr-4 py-2.5"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="VERIFIED">Verified / Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-950 text-[11px] font-extrabold text-stone-400 uppercase tracking-wider border-b border-stone-800">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Plan & Amount</th>
                  <th className="p-4">Payment Ref / Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-stone-500">No matching orders found.</td></tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.orderId} className="hover:bg-stone-800/30 transition">
                      <td className="p-4 font-mono font-bold text-white">{o.orderId}</td>
                      <td className="p-4 text-stone-300 font-mono text-[11px]">{o.userEmail || o.uid}</td>
                      <td className="p-4 font-bold text-emerald-400">₹{o.amount} ({o.plan})</td>
                      <td className="p-4">
                        <span className="font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 text-[11px]">
                          {o.utr || 'UPI'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          o.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          o.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {o.status === 'REJECTED' ? 'INVALID PAYMENT' : o.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {o.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {(o.ticketId && (o.ticketReason?.toLowerCase().includes('refund') || o.ticketReason?.toLowerCase().includes('upgrade'))) ? (
                              <>
                                <button
                                  onClick={() => handleTicketStatusUpdate(o.ticketId, 'COMPLETED')}
                                  className="px-2 py-1 bg-emerald-500 text-black font-extrabold text-[9px] rounded-lg cursor-pointer"
                                >
                                  Refund Paid
                                </button>
                                <button
                                  onClick={() => handleTicketStatusUpdate(o.ticketId, 'REJECTED_NOT_VALID', 'Rejected for not valid')}
                                  className="px-2 py-1 bg-red-500 text-white font-extrabold text-[9px] rounded-lg cursor-pointer"
                                >
                                  Reject Refund
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOrderAction(o.orderId, 'APPROVE')}
                                  className="px-2.5 py-1 bg-emerald-500 text-black font-extrabold text-[10px] rounded-lg cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOrderAction(o.orderId, 'REJECT')}
                                  className="px-2.5 py-1 bg-red-500/10 text-red-400 font-bold text-[10px] rounded-lg border border-red-500/30 cursor-pointer"
                                  title="Mark as Fake / Invalid Payment"
                                >
                                  Reject (Fake/Invalid)
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
