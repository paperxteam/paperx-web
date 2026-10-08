import React from 'react';

export const GoogleDriveAnimatedIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <img 
    src="/icons/google-drive-2026.webp" 
    alt="Google Drive" 
    className={`${className} object-contain transition-transform duration-300 hover:scale-110 hover:-rotate-3`} 
    onError={(e) => {
      // Fallback to svg if webp fails
      (e.currentTarget as HTMLImageElement).src = '/icons/google-drive-2026.svg';
    }}
  />
);

export const DropboxAnimatedIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <img 
    src="/icons/dropbox-2026.png" 
    alt="Dropbox" 
    className={`${className} object-contain transition-transform duration-300 hover:scale-110 hover:-translate-y-0.5`} 
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).src = '/icons/dropbox-2026.svg';
    }}
  />
);
