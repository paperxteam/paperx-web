import React, { useState } from 'react';
import { 
  FileText, HardDrive, FileCheck, Search, Filter, Trash2, Download, 
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Cpu, Layers, BarChart3,
  Share2, Eye, ExternalLink
} from 'lucide-react';
import { shareOrOpenFullFile } from '../../utils/fileShare';

interface DocumentsViewProps {
  systemStats: any;
  showFeedback: (type: 'success' | 'error', text: string) => void;
}

const INITIAL_DOCS = [
  { id: 'doc_101', name: 'Invoice_Aug_2026.pdf', user: 'paperx.team@gmail.com', type: 'Text → PDF', sizeKB: 450, status: 'Completed', downloads: 14, timestamp: Date.now() - 3600000 },
  { id: 'doc_102', name: 'Scanned_Receipt_441.pdf', user: 'user.demo@example.com', type: 'Image → PDF', sizeKB: 1280, status: 'Completed', downloads: 3, timestamp: Date.now() - 7200000 },
  { id: 'doc_103', name: 'Project_Proposal_Draft.pdf', user: 'enterprise.client@corp.com', type: 'PDF Merge', sizeKB: 3400, status: 'Completed', downloads: 28, timestamp: Date.now() - 14400000 },
  { id: 'doc_104', name: 'Raw_Notes_OCR.pdf', user: 'student.free@univ.edu', type: 'OCR Scan', sizeKB: 890, status: 'Failed', downloads: 0, timestamp: Date.now() - 28800000 },
  { id: 'doc_105', name: 'Identity_Document.pdf', user: 'client.mumbai@gmail.com', type: 'PDF Compress', sizeKB: 210, status: 'Completed', downloads: 5, timestamp: Date.now() - 43200000 },
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({ systemStats, showFeedback }) => {
  const [docsList, setDocsList] = useState(INITIAL_DOCS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredDocs = docsList.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const generateMockPdfDataUrl = (docName: string, docId: string, docType: string) => {
    // Generate a minimal valid PDF data URL
    const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 120 >> stream
BT
/F1 20 Tf
50 720 Td
(PaperX Processed Document: ${docName}) Tj
0 -30 Td
/F1 12 Tf
(ID: ${docId} | Operation: ${docType}) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000405 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
479
%%EOF`;
    return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(pdfContent)))}`;
  };

  const handleShareDoc = async (docItem: typeof INITIAL_DOCS[0]) => {
    await shareOrOpenFullFile({
      id: docItem.id,
      name: docItem.name,
      size: `${docItem.sizeKB} KB`,
      type: 'PDF',
      timestamp: docItem.timestamp,
      action: docItem.type,
      dataUrl: generateMockPdfDataUrl(docItem.name, docItem.id, docItem.type)
    }, {
      onSuccess: (msg) => showFeedback('success', msg),
      onError: (msg) => showFeedback('error', msg)
    });
  };

  const handleDownloadDoc = (docId: string, docName: string) => {
    try {
      const docItem = docsList.find(d => d.id === docId);
      const dataUrl = generateMockPdfDataUrl(docName, docId, docItem?.type || 'PDF Processing');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = docName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Update download count
      setDocsList(prev => prev.map(d => d.id === docId ? { ...d, downloads: d.downloads + 1 } : d));
      showFeedback('success', `Downloaded "${docName}" successfully.`);
    } catch (e) {
      console.error('Download error:', e);
      showFeedback('error', `Failed to download "${docName}".`);
    }
  };

  const handleDeleteDoc = (docId: string, docName: string) => {
    if (window.confirm(`Delete document "${docName}" permanently from Cloud Storage?`)) {
      setDocsList(prev => prev.filter(d => d.id !== docId));
      showFeedback('success', `Document ${docName} deleted and storage freed.`);
    }
  };

  const handleReprocessDoc = (docId: string) => {
    setDocsList(prev => prev.map(d => d.id === docId ? { ...d, status: 'Completed' } : d));
    showFeedback('success', `Document conversion re-processed successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="text-orange-500" size={24} />
            Documents, PDF Engine & Storage Monitoring
          </h3>
          <p className="text-xs text-stone-400">
            Real-time document pipeline monitoring, conversion telemetry & storage quotas
          </p>
        </div>
      </div>

      {/* PDF Engine Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400">Total PDF Conversions</span>
            <FileCheck className="text-orange-500" size={18} />
          </div>
          <p className="text-2xl font-black text-white mt-2">1,280</p>
          <p className="text-[11px] text-emerald-400 mt-1">99.4% Success Rate</p>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400">Avg Processing Time</span>
            <Cpu className="text-blue-500" size={18} />
          </div>
          <p className="text-2xl font-black text-white mt-2">1.2 sec</p>
          <p className="text-[11px] text-stone-400 mt-1">High-speed rendering engine</p>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400">Cloud Storage Used</span>
            <HardDrive className="text-emerald-500" size={18} />
          </div>
          <p className="text-2xl font-black text-white mt-2">{systemStats.storageUsedMB} MB</p>
          <p className="text-[11px] text-stone-400 mt-1">Firestore & Firebase Storage sync</p>
        </div>

        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400">Failed Conversions</span>
            <XCircle className="text-red-500" size={18} />
          </div>
          <p className="text-2xl font-black text-red-400 mt-2">1</p>
          <p className="text-[11px] text-stone-400 mt-1">Needs re-try or OCR check</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-stone-400" size={16} />
          <input 
            type="text"
            placeholder="Search document name or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2"
          >
            <option value="ALL">All Tools</option>
            <option value="Text → PDF">Text → PDF</option>
            <option value="Image → PDF">Image → PDF</option>
            <option value="PDF Merge">PDF Merge</option>
            <option value="OCR Scan">OCR Scan</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2"
          >
            <option value="ALL">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-950/80 text-[11px] font-extrabold text-stone-400 uppercase tracking-wider border-b border-stone-800">
                <th className="p-4">Document</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Operation</th>
                <th className="p-4">Size</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 text-xs">
              {filteredDocs.map((docItem) => (
                <tr key={docItem.id} className="hover:bg-stone-800/30 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{docItem.name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">{docItem.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-stone-300 font-mono text-[11px]">{docItem.user}</td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-stone-800 text-stone-200 rounded-md text-[10px] font-bold">
                      {docItem.type}
                    </span>
                  </td>

                  <td className="p-4 text-stone-300 font-mono">{docItem.sizeKB} KB</td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      docItem.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {docItem.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Share Full File Across All Platforms */}
                      <button
                        onClick={() => handleShareDoc(docItem)}
                        title="Share full file across all platforms (WhatsApp, Telegram, AirDrop, QR, etc.)"
                        className="px-2.5 py-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all flex items-center gap-1 font-bold text-xs cursor-pointer shadow-xs active:scale-95"
                      >
                        <Share2 size={14} />
                        <span className="text-[11px]">Share</span>
                      </button>

                      {/* Download Full File */}
                      <button
                        onClick={() => handleDownloadDoc(docItem.id, docItem.name)}
                        title="Download file"
                        className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800 rounded-lg transition cursor-pointer"
                      >
                        <Download size={15} />
                      </button>

                      {/* Reprocess if Failed */}
                      {docItem.status === 'Failed' && (
                        <button
                          onClick={() => handleReprocessDoc(docItem.id)}
                          title="Re-process failed document"
                          className="p-1.5 text-blue-400 hover:bg-blue-500/10 border border-stone-800 rounded-lg transition cursor-pointer"
                        >
                          <RefreshCw size={15} />
                        </button>
                      )}

                      {/* Delete File */}
                      <button
                        onClick={() => handleDeleteDoc(docItem.id, docItem.name)}
                        title="Delete file permanently"
                        className="p-1.5 text-red-400 hover:bg-red-500/10 border border-stone-800 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
