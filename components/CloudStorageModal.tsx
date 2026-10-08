import React, { useState, useEffect } from 'react';
import { 
  X, Loader2, AlertCircle, CheckCircle2, 
  Key, ShieldCheck
} from 'lucide-react';
import { 
  CloudSource, 
  getCloudConfig, 
  pickAndImportFromGoogleDrive, 
  pickAndImportFromDropbox, 
  CloudProviderConfig
} from '../services/cloudStorageService';
import { 
  GoogleDriveAnimatedIcon, 
  DropboxAnimatedIcon
} from './CloudBrandIcons';
import { auth } from '../services/firebase';

export { GoogleDriveAnimatedIcon, DropboxAnimatedIcon };

export type CloudProvider = 'google-drive' | 'dropbox';

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesImported: (files: File[]) => void;
  initialProvider?: CloudProvider;
  fileType?: 'image' | 'word' | 'all';
}

export const CloudStorageModal: React.FC<CloudStorageModalProps> = ({
  isOpen,
  onClose,
  onFilesImported,
  initialProvider = 'google-drive',
  fileType = 'all'
}) => {
  const [activeProvider, setActiveProvider] = useState<CloudProvider>(initialProvider);
  const [config, setConfig] = useState<CloudProviderConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialProvider) {
      setActiveProvider(initialProvider);
    }
  }, [initialProvider]);

  // Load provider configuration on modal open
  useEffect(() => {
    if (isOpen) {
      setLoadingConfig(true);
      setErrorMessage(null);
      getCloudConfig()
        .then((cfg) => setConfig(cfg))
        .catch(() => setErrorMessage('Unable to connect to cloud services.'))
        .finally(() => setLoadingConfig(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allowedMimeTypes = fileType === 'image'
    ? ['image/jpeg', 'image/png', 'image/webp']
    : fileType === 'word'
    ? [
        '.doc', 
        '.docx', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    : undefined;

  // Handle Google Drive
  const handleLaunchGoogleDrive = async () => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setLoadingMessage('Opening Google Drive Picker...');

      const files = await pickAndImportFromGoogleDrive({
        allowedMimeTypes,
        viewMode: fileType === 'image' ? 'images' : 'all'
      });

      if (files && files.length > 0) {
        onFilesImported(files);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to import file from Google Drive.');
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  // Handle Dropbox
  const handleLaunchDropbox = async () => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      setLoadingMessage('Connecting to Dropbox...');

      const files = await pickAndImportFromDropbox({
        allowedMimeTypes,
        extensions: fileType === 'image' 
          ? ['.jpg', '.jpeg', '.png', '.webp'] 
          : fileType === 'word' 
          ? ['.doc', '.docx'] 
          : undefined
      });

      if (files && files.length > 0) {
        onFilesImported(files);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to import file from Dropbox.');
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.run.app';
  const currentUserEmail = auth.currentUser?.email;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeProvider === 'google-drive' && <GoogleDriveAnimatedIcon className="w-6 h-6" />}
            {activeProvider === 'dropbox' && <DropboxAnimatedIcon className="w-6 h-6" />}
            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-white tracking-tight">
                Import from {activeProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Real account file importer • Maximum 100MB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100 dark:bg-stone-800/60 m-4 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => { setActiveProvider('google-drive'); setErrorMessage(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeProvider === 'google-drive'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <GoogleDriveAnimatedIcon className="w-4 h-4" />
            <span>Google Drive</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveProvider('dropbox'); setErrorMessage(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeProvider === 'dropbox'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <DropboxAnimatedIcon className="w-4 h-4" />
            <span>Dropbox</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 pt-1 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Loading Indicator */}
          {actionLoading && (
            <div className="p-6 bg-stone-50 dark:bg-stone-800/40 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-stone-900 dark:text-white" />
              <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {loadingMessage || 'Processing cloud request...'}
              </p>
              <p className="text-[11px] text-stone-400">
                Please wait while PaperX connects securely with your account
              </p>
            </div>
          )}

          {/* Tab 1: GOOGLE DRIVE */}
          {!actionLoading && activeProvider === 'google-drive' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    Google Drive Integration Ready
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                    {currentUserEmail ? `Signed in as ${currentUserEmail}` : 'Ready to browse and import your Google Drive files'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1.5 bg-stone-50 dark:bg-stone-800/30 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
                <div className="font-semibold text-stone-800 dark:text-stone-200">Supported Google formats:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>Native documents (PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX, TXT, CSV)</li>
                  <li>Google Docs (automatically exported to Word .docx)</li>
                  <li>Google Sheets (automatically exported to Excel .xlsx)</li>
                  <li>Google Slides (automatically exported to PowerPoint .pptx)</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleLaunchGoogleDrive}
                className="w-full py-3 px-4 bg-stone-900 dark:bg-white text-white dark:text-black hover:opacity-90 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <GoogleDriveAnimatedIcon className="w-5 h-5" />
                <span>Select File from Google Drive</span>
              </button>
            </div>
          )}

          {/* Tab 2: DROPBOX */}
          {!actionLoading && activeProvider === 'dropbox' && (
            <div className="space-y-4">
              {config?.dropbox.enabled ? (
                <>
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/50 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-blue-900 dark:text-blue-200">
                        Dropbox App Configured
                      </div>
                      <div className="text-blue-700 dark:text-blue-400 text-[11px] mt-0.5">
                        App Key is active. Click below to select files from your Dropbox account.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchDropbox}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                  >
                    <DropboxAnimatedIcon className="w-5 h-5" />
                    <span>Select File from Dropbox</span>
                  </button>
                </>
              ) : (
                <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-xs">
                    <Key size={16} className="text-amber-500" />
                    <span>Dropbox Setup Required</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    To enable real file importing from Dropbox, configure your Dropbox API credentials:
                  </p>
                  <div className="bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] font-mono space-y-1 text-stone-700 dark:text-stone-300">
                    <div>1. Open <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noreferrer" className="text-blue-500 underline">Dropbox App Console</a></div>
                    <div>2. Add Environment Variable: <span className="font-bold text-black dark:text-white">DROPBOX_APP_KEY</span></div>
                    <div>3. Add Chooser/OAuth Domain: <span className="font-bold text-black dark:text-white">{currentHost}</span></div>
                    <div>4. Add Redirect URI: <span className="font-bold text-black dark:text-white">{currentHost}/api/cloud/dropbox/callback</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Official APIs only • Zero mock data</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
