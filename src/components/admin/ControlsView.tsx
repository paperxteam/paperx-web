import React, { useState } from 'react';
import { 
  Sliders, AlertTriangle, ToggleLeft, ToggleRight, ShieldAlert, 
  Lock, Unlock, Cpu, Zap, Download, RefreshCw, Layers, CheckCircle2
} from 'lucide-react';

interface ControlsViewProps {
  appSettings: any;
  onUpdateSettings: (newFields: any) => Promise<void>;
  showFeedback: (type: 'success' | 'error', text: string) => void;
}

export const ControlsView: React.FC<ControlsViewProps> = ({
  appSettings,
  onUpdateSettings,
  showFeedback
}) => {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(appSettings.maintenanceMode || false);
  const [apkUrl, setApkUrl] = useState<string>(appSettings.apkUrl || 'https://paperx.app/downloads/paperx-v2.1.apk');
  const [minAppVersion, setMinAppVersion] = useState<string>(appSettings.minAppVersion || '2.0.0');
  const [allowRegistration, setAllowRegistration] = useState<boolean>(appSettings.allowRegistration !== false);

  const [featureFlags, setFeatureFlags] = useState(appSettings.featureFlags || {
    aiAssistant: true,
    pdfTools: true,
    qrScanner: true,
    proSubscriptions: true,
    ocrScanner: true,
    cloudSync: true,
    directApkDownload: true
  });

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceMode;
    if (nextState && !window.confirm("ARE YOU SURE? Enabling Maintenance Mode will display the offline maintenance screen to ALL users immediately.")) {
      return;
    }
    setMaintenanceMode(nextState);
    await onUpdateSettings({ maintenanceMode: nextState });
    showFeedback('success', `Maintenance mode set to ${nextState ? 'ACTIVE' : 'OFF'}.`);
  };

  const handleToggleFeature = async (key: string) => {
    const updated = { ...featureFlags, [key]: !featureFlags[key] };
    setFeatureFlags(updated);
    await onUpdateSettings({ featureFlags: updated });
    showFeedback('success', `Feature flag "${key}" set to ${updated[key] ? 'ENABLED' : 'DISABLED'}.`);
  };

  const handleSaveAppControls = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      apkUrl,
      minAppVersion,
      allowRegistration,
      featureFlags
    });
    showFeedback('success', 'App Controls & Distribution settings saved.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sliders className="text-orange-500" size={24} />
            App Control, Feature Flags & Maintenance
          </h3>
          <p className="text-xs text-stone-400">
            Emergency kill-switches, feature toggles, APK distribution & version management
          </p>
        </div>
      </div>

      {/* SECTION 15: EMERGENCY MAINTENANCE MODE */}
      <div className={`p-6 rounded-3xl border transition shadow-2xl ${
        maintenanceMode 
          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300' 
          : 'bg-stone-900/60 border-stone-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${maintenanceMode ? 'bg-amber-500 text-black' : 'bg-stone-800 text-amber-500'}`}>
              <ShieldAlert size={28} />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Emergency Maintenance Mode</h4>
              <p className="text-xs text-stone-400 mt-1 max-w-xl">
                When enabled, normal user access is immediately suspended, and all client applications will render an interactive maintenance offline splash.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleMaintenance}
            className={`px-6 py-3 rounded-2xl font-black text-xs transition shadow-xl flex items-center gap-2 shrink-0 ${
              maintenanceMode 
                ? 'bg-amber-500 text-black hover:bg-amber-400' 
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
            }`}
          >
            {maintenanceMode ? <Lock size={16} /> : <Unlock size={16} />}
            {maintenanceMode ? 'DISABLE MAINTENANCE' : 'ACTIVATE MAINTENANCE'}
          </button>
        </div>
      </div>

      {/* SECTION 14: GRANULAR FEATURE FLAGS */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
          <Zap size={18} className="text-orange-500" />
          Live Application Feature Flags
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(featureFlags).map(([flagKey, isEnabled]) => (
            <div key={flagKey} className="p-4 bg-stone-950 border border-stone-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-white capitalize">{flagKey.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">{isEnabled ? 'Feature is Active' : 'Feature Disabled'}</p>
              </div>

              <button
                onClick={() => handleToggleFeature(flagKey)}
                className={`p-1.5 rounded-xl transition ${
                  isEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-stone-600 bg-stone-900'
                }`}
              >
                {isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 13: APP DISTRIBUTION & REGISTRATION CONTROLS */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <h4 className="text-sm font-extrabold text-white flex items-center gap-2 mb-4">
          <Download size={18} className="text-blue-500" />
          App Distribution & Registration Controls
        </h4>

        <form onSubmit={handleSaveAppControls} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Direct APK Download URL</label>
            <input
              type="text"
              value={apkUrl}
              onChange={(e) => setApkUrl(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">Minimum Required App Version</label>
            <input
              type="text"
              value={minAppVersion}
              onChange={(e) => setMinAppVersion(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl p-2.5 font-mono"
            />
          </div>

          <div className="md:col-span-2 pt-2 flex items-center justify-between">
            <label className="text-xs font-bold text-stone-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="rounded bg-stone-950 border-stone-800 text-orange-500 focus:ring-0"
              />
              Allow New User Registrations (Sign Ups)
            </label>

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs rounded-xl transition shadow-md"
            >
              Save Control Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
