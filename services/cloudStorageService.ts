import { getOrRequestGoogleDriveToken, getCachedGoogleDriveToken } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';

export type CloudSource = 'device' | 'google-drive' | 'dropbox';

export interface PaperXFile extends File {
  source: CloudSource;
  providerFileId?: string;
  providerDownloadUrl?: string;
}

export interface CloudFileMetadata {
  name: string;
  size: number;
  mimeType: string;
  source: CloudSource;
  providerFileId: string;
  downloadUrl?: string;
}

export interface CloudProviderConfig {
  google: {
    enabled: boolean;
    clientId: string;
    scopes: string[];
  };
  dropbox: {
    enabled: boolean;
    appKey: string;
    hasSecret: boolean;
  };
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

/**
 * Fetch server configuration status for cloud providers
 */
export async function getCloudConfig(): Promise<CloudProviderConfig> {
  try {
    const res = await fetch('/api/cloud/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[CloudConfig] Failed to fetch server config, using defaults:', err);
  }

  return {
    google: {
      enabled: !!firebaseConfig.oAuthClientId,
      clientId: firebaseConfig.oAuthClientId || '',
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    },
    dropbox: {
      enabled: false,
      appKey: '',
      hasSecret: false
    }
  };
}

/**
 * Validates any imported cloud file against standard PaperX requirements
 */
export function validateImportedFile(
  file: File,
  allowedMimeTypes?: string[]
): { valid: boolean; error?: string } {
  if (!file || !file.name) {
    return { valid: false, error: 'Invalid file received.' };
  }

  if (file.size === 0) {
    return { valid: false, error: `The selected file "${file.name}" is empty (0 bytes).` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `"${file.name}" exceeds the 100MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).` };
  }

  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    const fileMime = (file.type || '').toLowerCase();
    const fileName = file.name.toLowerCase();

    const matches = allowedMimeTypes.some((allowed) => {
      const target = allowed.trim().toLowerCase();
      if (target.startsWith('.')) {
        return fileName.endsWith(target);
      }
      if (target.endsWith('/*')) {
        const prefix = target.replace('/*', '');
        return fileMime.startsWith(prefix);
      }
      return fileMime === target;
    });

    if (!matches) {
      return { valid: false, error: `This file type isn't supported by PaperX (${file.name}).` };
    }
  }

  return { valid: true };
}

/**
 * Creates a standard PaperX file instance with source and metadata tags
 */
export function createPaperXFile(
  blob: Blob,
  fileName: string,
  mimeType: string,
  source: CloudSource,
  providerFileId?: string
): PaperXFile {
  const file = new File([blob], fileName, {
    type: mimeType || 'application/octet-stream',
    lastModified: Date.now()
  }) as PaperXFile;

  file.source = source;
  file.providerFileId = providerFileId;
  return file;
}

// ============================================================================
// GOOGLE DRIVE INTEGRATION (Real OAuth + Google Picker + Drive v3 API)
// ============================================================================

let isGapiLoaded = false;
let gapiLoadPromise: Promise<void> | null = null;

function loadGooglePickerApi(): Promise<void> {
  if (isGapiLoaded && (window as any).google?.picker) {
    return Promise.resolve();
  }
  if (gapiLoadPromise) return gapiLoadPromise;

  gapiLoadPromise = new Promise<void>((resolve, reject) => {
    // Check if gapi script is already in document
    const existingScript = document.getElementById('google-api-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-api-script';
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const gapi = (window as any).gapi;
        if (!gapi) {
          reject(new Error('Google API client failed to initialize.'));
          return;
        }
        gapi.load('picker', () => {
          isGapiLoaded = true;
          resolve();
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google Picker scripts. Please check your internet connection.'));
      document.body.appendChild(script);
    } else {
      const gapi = (window as any).gapi;
      if (gapi?.load) {
        gapi.load('picker', () => {
          isGapiLoaded = true;
          resolve();
        });
      } else {
        existingScript.addEventListener('load', () => {
          (window as any).gapi.load('picker', () => {
            isGapiLoaded = true;
            resolve();
          });
        });
      }
    }
  });

  return gapiLoadPromise;
}

export interface GoogleDriveImportOptions {
  allowedMimeTypes?: string[];
  viewMode?: 'docs' | 'images' | 'all';
}

/**
 * Triggers Real Google Drive Picker and exports/downloads the selected file
 */
export async function pickAndImportFromGoogleDrive(
  options: GoogleDriveImportOptions = {}
): Promise<PaperXFile[]> {
  // Step 1: Ensure user is authenticated with Google and we have a valid access token with drive scopes
  let accessToken: string;
  try {
    accessToken = await getOrRequestGoogleDriveToken();
  } catch (err: any) {
    if (err.message?.includes('cancelled')) {
      throw new Error('Google Drive authorization was cancelled.');
    }
    throw new Error(err.message || 'Unable to connect to Google Drive.');
  }

  // Step 2: Ensure Google Picker library is ready
  await loadGooglePickerApi();

  const google = (window as any).google;
  if (!google?.picker) {
    throw new Error('Google Picker is currently unavailable. Please refresh and try again.');
  }

  return new Promise<PaperXFile[]>((resolve, reject) => {
    let resolved = false;

    // Ancestor origin safe check for iframe environments
    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const docsView = new google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    // Apply view filters if specified
    if (options.viewMode === 'images') {
      docsView.setMimeTypes('image/png,image/jpeg,image/webp,image/gif');
    }

    const pickerCallback = async (data: any) => {
      if (data.action === google.picker.Action.CANCEL) {
        if (!resolved) {
          resolved = true;
          resolve([]);
        }
        return;
      }

      if (data.action === google.picker.Action.PICKED) {
        if (resolved) return;
        resolved = true;

        try {
          const pickedDocs = data.docs || [];
          if (pickedDocs.length === 0) {
            resolve([]);
            return;
          }

          const importedFiles: PaperXFile[] = [];

          for (const doc of pickedDocs) {
            const fileId = doc.id;
            const originalName = doc.name || 'drive_file';
            const originalMime = doc.mimeType || '';

            // Handle Google-native workspace docs (Docs, Sheets, Slides)
            let exportMimeType: string | undefined = undefined;
            let targetFileName = originalName;

            if (originalMime === 'application/vnd.google-apps.document') {
              exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              if (!targetFileName.endsWith('.docx')) targetFileName += '.docx';
            } else if (originalMime === 'application/vnd.google-apps.spreadsheet') {
              exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
              if (!targetFileName.endsWith('.xlsx')) targetFileName += '.xlsx';
            } else if (originalMime === 'application/vnd.google-apps.presentation') {
              exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
              if (!targetFileName.endsWith('.pptx')) targetFileName += '.pptx';
            } else if (originalMime.startsWith('application/vnd.google-apps.')) {
              throw new Error(`The selected Google document type (${originalName}) cannot be converted.`);
            }

            // Download file content via server-side streaming proxy or direct API
            let blob: Blob;
            try {
              let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
              if (exportMimeType) {
                downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
              }

              const res = await fetch(downloadUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });

              if (!res.ok) {
                // If direct browser request is blocked by CORS, fallback to server streaming proxy
                const serverProxyRes = await fetch('/api/cloud/google-drive/download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    accessToken,
                    fileId,
                    exportMimeType,
                    fileName: targetFileName
                  })
                });

                if (!serverProxyRes.ok) {
                  const errJson = await serverProxyRes.json().catch(() => ({}));
                  throw new Error(errJson.error || 'Unable to download the selected file.');
                }
                blob = await serverProxyRes.blob();
              } else {
                blob = await res.blob();
              }
            } catch (dlErr: any) {
              throw new Error(dlErr.message || 'Unable to download the selected file.');
            }

            const finalMime = exportMimeType || blob.type || originalMime;
            const paperXFile = createPaperXFile(blob, targetFileName, finalMime, 'google-drive', fileId);

            // Validation
            const validation = validateImportedFile(paperXFile, options.allowedMimeTypes);
            if (!validation.valid) {
              throw new Error(validation.error || 'File validation failed.');
            }

            importedFiles.push(paperXFile);
          }

          resolve(importedFiles);
        } catch (err: any) {
          reject(err);
        }
      }
    };

    try {
      const pickerBuilder = new google.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(accessToken)
        .setCallback(pickerCallback)
        .setOrigin(pickerOrigin);

      // Support multi-select if available
      try {
        pickerBuilder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
      } catch (_) {}

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    } catch (err: any) {
      reject(new Error(`Failed to launch Google Drive picker: ${err.message}`));
    }
  });
}

// ============================================================================
// DROPBOX INTEGRATION (Official Chooser & OAuth API)
// ============================================================================

let isDropboxScriptLoaded = false;

function loadDropboxChooserScript(appKey: string): Promise<void> {
  if ((window as any).Dropbox) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('dropboxjs');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Dropbox Chooser script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'dropboxjs';
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
    script.setAttribute('data-app-key', appKey);
    script.async = true;
    script.onload = () => {
      isDropboxScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Dropbox Chooser. Please check your internet connection.'));
    document.body.appendChild(script);
  });
}

/**
 * Triggers Real Dropbox Chooser or OAuth flow
 */
export async function pickAndImportFromDropbox(
  options: { allowedMimeTypes?: string[]; extensions?: string[] } = {}
): Promise<PaperXFile[]> {
  const config = await getCloudConfig();

  if (!config.dropbox.enabled || !config.dropbox.appKey) {
    throw new Error(
      'Dropbox is not yet configured. Please set the DROPBOX_APP_KEY environment variable in AI Studio settings to enable Dropbox importing.'
    );
  }

  // Load official Dropbox Chooser dropin script
  await loadDropboxChooserScript(config.dropbox.appKey);

  const Dropbox = (window as any).Dropbox;
  if (!Dropbox?.choose) {
    throw new Error('Dropbox Chooser is not initialized. Please try again.');
  }

  return new Promise<PaperXFile[]>((resolve, reject) => {
    Dropbox.choose({
      success: async (files: any[]) => {
        try {
          if (!files || files.length === 0) {
            resolve([]);
            return;
          }

          const importedFiles: PaperXFile[] = [];

          for (const item of files) {
            const fileName = item.name;
            const fileUrl = item.link;

            // Fetch the file through the server-side proxy to guarantee CORS and SSL headers
            const fetchRes = await fetch('/api/cloud/dropbox/fetch-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: fileUrl, filename: fileName })
            });

            if (!fetchRes.ok) {
              const errJson = await fetchRes.json().catch(() => ({}));
              throw new Error(errJson.error || 'Unable to download the selected file.');
            }

            const blob = await fetchRes.blob();
            const mimeType = blob.type || 'application/octet-stream';
            const paperXFile = createPaperXFile(blob, fileName, mimeType, 'dropbox', item.id);

            const validation = validateImportedFile(paperXFile, options.allowedMimeTypes);
            if (!validation.valid) {
              throw new Error(validation.error || 'File validation failed.');
            }

            importedFiles.push(paperXFile);
          }

          resolve(importedFiles);
        } catch (err: any) {
          reject(err);
        }
      },
      cancel: () => {
        resolve([]);
      },
      linkType: 'direct',
      multiselect: true,
      extensions: options.extensions
    });
  });
}
