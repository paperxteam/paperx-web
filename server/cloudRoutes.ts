import express from "express";
import type { Request, Response } from "express";
import firebaseConfig from "../firebase-applet-config.json";

const router = express.Router();

/**
 * Public Provider Configuration Status
 * Returns ONLY non-secret client/app IDs and feature availability status.
 * Never exposes client secrets, private keys, or refresh tokens.
 */
router.get("/config", (req: Request, res: Response) => {
  const googleClientId = firebaseConfig.oAuthClientId || process.env.GOOGLE_CLIENT_ID || "";
  const dropboxAppKey = process.env.DROPBOX_APP_KEY || "";

  res.json({
    google: {
      enabled: !!googleClientId,
      clientId: googleClientId,
      scopes: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.metadata.readonly"
      ]
    },
    dropbox: {
      enabled: !!dropboxAppKey,
      appKey: dropboxAppKey,
      hasSecret: !!process.env.DROPBOX_APP_SECRET
    }
  });
});

/**
 * Helper to determine canonical origin & callback URL
 */
function getCallbackUrl(req: Request, provider: "dropbox"): string {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  return `${protocol}://${host}/api/cloud/${provider}/callback`;
}

// ============================================================================
// DROPBOX OAUTH & API ROUTES
// ============================================================================

/**
 * GET /api/cloud/dropbox/auth-url
 * Returns authorization URL for Dropbox OAuth 2.0 PKCE / Authorization Code Flow
 */
router.get("/dropbox/auth-url", (req: Request, res: Response) => {
  const appKey = process.env.DROPBOX_APP_KEY;
  if (!appKey) {
    return res.status(400).json({
      error: "Dropbox is not configured on this server.",
      missingConfig: ["DROPBOX_APP_KEY"],
      guidance: "Please set the DROPBOX_APP_KEY environment variable in AI Studio settings."
    });
  }

  const redirectUri = (req.query.redirectUri as string) || getCallbackUrl(req, "dropbox");
  const params = new URLSearchParams({
    client_id: appKey,
    response_type: "code",
    redirect_uri: redirectUri,
    token_access_type: "offline"
  });

  const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  res.json({ authUrl, redirectUri });
});

/**
 * GET /api/cloud/dropbox/callback
 * Handles OAuth callback and exchanges code for access token using client secret
 */
router.get("/dropbox/callback", async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || "User cancelled Dropbox authorization";
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Dropbox Authorization</title></head>
        <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;">
          <div style="text-align:center;padding:2rem;background:#fff;border-radius:1rem;box-shadow:0 10px 25px rgba(0,0,0,0.05);max-width:400px;">
            <h3 style="color:#dc2626;margin-top:0;">Authorization Cancelled</h3>
            <p style="color:#6b7280;font-size:14px;">${escapeHtml(errorMsg)}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'DROPBOX_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                setTimeout(() => window.close(), 1200);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;

  if (!appKey || !appSecret) {
    return res.status(500).send("Dropbox server configuration error: DROPBOX_APP_SECRET is not configured.");
  }

  try {
    const redirectUri = getCallbackUrl(req, "dropbox");
    const body = new URLSearchParams({
      code: code as string,
      grant_type: "authorization_code",
      client_id: appKey,
      client_secret: appSecret,
      redirect_uri: redirectUri
    });

    const tokenRes = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || "Token exchange failed");
    }

    // Deliver token securely back to the parent window through postMessage and close popup immediately
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Dropbox Connected</title></head>
        <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;">
          <div style="text-align:center;padding:2rem;background:#fff;border-radius:1rem;box-shadow:0 10px 25px rgba(0,0,0,0.05);max-width:400px;">
            <h3 style="color:#16a34a;margin-top:0;">Dropbox Connected!</h3>
            <p style="color:#6b7280;font-size:14px;">Closing window and returning to PaperX...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'DROPBOX_AUTH_SUCCESS',
                  token: ${JSON.stringify(data.access_token)},
                  accountId: ${JSON.stringify(data.account_id || '')}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`Failed to exchange Dropbox authorization code: ${escapeHtml(err.message)}`);
  }
});

/**
 * POST /api/cloud/dropbox/list
 * List files in user's Dropbox folder using their real access token
 */
router.post("/dropbox/list", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader?.replace("Bearer ", "") || req.body.token)?.trim();
  const folderPath = req.body.path || "";

  if (!token) {
    return res.status(401).json({ error: "Dropbox access token is required." });
  }

  try {
    const listRes = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: folderPath,
        recursive: false,
        include_media_info: true,
        include_deleted: false
      })
    });

    const data = await listRes.json();
    if (!listRes.ok) {
      if (listRes.status === 401) {
        return res.status(401).json({ error: "Dropbox session expired. Please reconnect your account." });
      }
      return res.status(listRes.status).json({ error: data.error_summary || "Unable to list files from Dropbox." });
    }

    const entries = (data.entries || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      path: item.path_display || item.path_lower,
      isFolder: item[".tag"] === "folder",
      size: item.size || 0,
      clientModified: item.client_modified,
      serverModified: item.server_modified
    }));

    res.json({ entries, cursor: data.cursor, hasMore: data.has_more });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to query Dropbox files." });
  }
});

/**
 * POST /api/cloud/dropbox/download
 * Download selected file content directly from Dropbox Content API
 */
router.post("/dropbox/download", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader?.replace("Bearer ", "") || req.body.token)?.trim();
  const filePath = req.body.path;

  if (!token) {
    return res.status(401).json({ error: "Dropbox access token is required." });
  }
  if (!filePath) {
    return res.status(400).json({ error: "File path or ID is required." });
  }

  try {
    const downloadRes = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: filePath })
      }
    });

    if (!downloadRes.ok) {
      if (downloadRes.status === 401) {
        return res.status(401).json({ error: "Dropbox session expired. Please reconnect." });
      }
      return res.status(downloadRes.status).json({ error: "Unable to download the selected Dropbox file." });
    }

    const metadataHeader = downloadRes.headers.get("dropbox-api-result");
    let filename = "dropbox_file";
    if (metadataHeader) {
      try {
        const meta = JSON.parse(metadataHeader);
        if (meta.name) filename = meta.name;
      } catch (_) {}
    }

    const contentType = downloadRes.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);

    const arrayBuffer = await downloadRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unable to download the selected file." });
  }
});

/**
 * POST /api/cloud/dropbox/fetch-link
 * Securely streams files chosen via official Dropbox Chooser direct link
 */
router.post("/dropbox/fetch-link", async (req: Request, res: Response) => {
  const { url, filename } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Valid Dropbox file URL is required." });
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("dropbox.com") && !parsed.hostname.endsWith("dropboxusercontent.com")) {
      return res.status(400).json({ error: "Invalid Dropbox URL origin." });
    }

    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: "Unable to download the selected file." });
    }

    const contentType = fetchRes.headers.get("content-type") || "application/octet-stream";
    const finalName = filename || parsed.pathname.split("/").pop() || "dropbox_imported_file";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(finalName)}"`);

    const arrayBuffer = await fetchRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve Dropbox file." });
  }
});

// ============================================================================
// GOOGLE DRIVE STREAMING / EXPORT PROXY
// ============================================================================

/**
 * POST /api/cloud/google-drive/download
 * Secure streaming for Google Drive files and Google Docs/Sheets/Slides export
 */
router.post("/google-drive/download", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const accessToken = (authHeader?.replace("Bearer ", "") || req.body.accessToken)?.trim();
  const { fileId, exportMimeType, fileName } = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: "Google Drive authorization token is required." });
  }
  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    let driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    if (exportMimeType) {
      driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
    }

    const driveRes = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!driveRes.ok) {
      if (driveRes.status === 401) {
        return res.status(401).json({ error: "Google Drive session expired. Please reconnect." });
      }
      if (driveRes.status === 403) {
        return res.status(403).json({ error: "Unable to access this file. Please check your permission." });
      }
      if (driveRes.status === 404) {
        return res.status(404).json({ error: "File not found in Google Drive." });
      }
      return res.status(driveRes.status).json({ error: "Unable to download the selected file from Google Drive." });
    }

    const contentType = driveRes.headers.get("content-type") || exportMimeType || "application/octet-stream";
    const finalName = fileName || (exportMimeType?.includes("word") ? "document.docx" : exportMimeType?.includes("sheet") ? "sheet.xlsx" : exportMimeType?.includes("presentation") ? "presentation.pptx" : "drive_file");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(finalName)}"`);

    const arrayBuffer = await driveRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unable to download the selected file." });
  }
});

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default router;
