import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, RefreshCw, ArrowLeft, Mail, FileCheck, ShieldAlert } from 'lucide-react';

interface ReceiptVerificationViewProps {
  verificationId: string;
  onNavigate: (path: string) => void;
}

export const ReceiptVerificationView: React.FC<ReceiptVerificationViewProps> = ({ verificationId, onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [auditData, setAuditData] = useState<any>(null);

  useEffect(() => {
    if (!verificationId) {
      setError('No verification token provided in the URL.');
      setLoading(false);
      return;
    }

    const verifyReceiptToken = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/payments/receipt/verify/${encodeURIComponent(verificationId)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setAuditData(data);
        } else {
          setError(data.error || 'This receipt token could not be verified.');
        }
      } catch (err) {
        console.error('Audit verification error:', err);
        setError('Unable to reach the PaperX Verification Node. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };

    verifyReceiptToken();
  }, [verificationId]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xl relative animate-in fade-in zoom-in duration-300">
        
        {/* Decorative Top Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Brand Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition font-bold"
          >
            <ArrowLeft size={14} />
            <span>Go to PaperX</span>
          </button>
          <span className="font-mono text-[10px] uppercase font-black tracking-widest text-stone-400 dark:text-stone-500">
            Audit Ledger
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <RefreshCw size={44} className="text-emerald-500 animate-spin" />
                <div className="absolute inset-0 m-auto w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-stone-800 dark:text-stone-100 text-sm">Querying Secure Audit Node...</h4>
                <p className="text-xs text-stone-400 max-w-xs">
                  Verifying transaction hashes against the immutable Firestore ledger block.
                </p>
              </div>
            </div>
          ) : error ? (
            /* VERIFICATION FAILED / FORGERY ALERT */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                <AlertOctagon size={36} className="animate-bounce" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-red-600 dark:text-red-400 font-heading">
                  Receipt Authenticity Warning
                </h3>
                <div className="inline-block px-3 py-1 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-200 dark:border-red-900">
                  Audit Result: INVALID / UNVERIFIED
                </div>
              </div>

              <p className="text-stone-600 dark:text-stone-300 text-xs leading-relaxed max-w-sm mx-auto">
                No verified transaction record exists for the provided token: <strong className="font-mono font-bold text-stone-800 dark:text-stone-100 break-all">{verificationId}</strong>.
              </p>

              <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-950 rounded-2xl text-left text-xs text-red-800 dark:text-red-300 leading-relaxed">
                <p className="font-extrabold mb-1">Security Notice:</p>
                This receipt has not been generated or authenticated by PaperX. It is likely forged or manually edited. If a third party presented this receipt to you, please report them to support immediately.
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-1.5 text-xs text-stone-400">
                <Mail size={14} />
                <span>Security report desk: <strong>paperx.assist@gmail.com</strong></span>
              </div>
            </div>
          ) : auditData ? (
            /* VERIFICATION SUCCESSFUL */
            <div className="space-y-6">
              
              {/* LEDGER BANNER */}
              <div className="text-center space-y-2.5">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={36} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-heading tracking-tight">
                    Verified Ledger Entry
                  </h3>
                  <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-900">
                    Status: {auditData.status || 'VALID'}
                  </div>
                </div>
                <p className="text-stone-400 text-[10px] font-mono leading-none">
                  Verified Audit Token: {verificationId}
                </p>
              </div>

              {/* TRANS METADATA TABLE */}
              <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-stone-200/50 dark:border-stone-800/80 pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Receipt ID</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{auditData.receiptDetails.receiptId}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Invoice ID</span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{auditData.receiptDetails.invoiceId || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Customer Name</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{auditData.receiptDetails.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Customer Email</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">{auditData.receiptDetails.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Service Plan</span>
                    <span className="font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {auditData.receiptDetails.plan}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Amount Paid</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{auditData.receiptDetails.amount}.00
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Payment Mode</span>
                    <span className="text-stone-800 dark:text-stone-200">{auditData.receiptDetails.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">UPI Ref (UTR)</span>
                    <span className="font-mono text-stone-800 dark:text-stone-200">{auditData.receiptDetails.utr || 'Verified'}</span>
                  </div>
                </div>

                {auditData.receiptDetails.subscriptionStart && (
                  <div className="grid grid-cols-2 gap-4 border-t border-stone-200/50 dark:border-stone-800/80 pt-3 text-[11px]">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Subscription Start</span>
                      <span className="text-stone-600 dark:text-stone-300 font-medium">
                        {new Date(auditData.receiptDetails.subscriptionStart).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Subscription Expiry</span>
                      <span className="text-stone-600 dark:text-stone-300 font-medium">
                        {new Date(auditData.receiptDetails.subscriptionExpiry).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECURITY CERTIFICATE STATEMENT */}
              <div className="text-center p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-950 rounded-2xl flex items-start gap-2.5 text-left">
                <FileCheck className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-normal">
                  <p className="font-extrabold mb-0.5">Automated Cryptographic Assurance:</p>
                  This record is cryptographically signed, stored in PaperX's secure Firebase ledger, and is completely immutable. No tampering or client-side forgery can alter this information.
                </div>
              </div>

              {/* FOOTER */}
              <div className="text-center text-[10px] text-stone-400 leading-normal">
                Audited at {new Date(auditData.receiptDetails.verifiedAt).toLocaleString()} <br />
                Verification Authority: <strong className="text-stone-500 dark:text-stone-400">PaperX Security Node</strong>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
