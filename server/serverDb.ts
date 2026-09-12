import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const PROJECT_ID = firebaseConfig.projectId;
const API_KEY = firebaseConfig.apiKey;
const DB_ID = (firebaseConfig as any).firestoreDatabaseId || '(default)';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents`;

let adminDb: Firestore | null = null;

function handleAdminError(err: any) {
  if (adminDb) {
    adminDb = null;
    console.log(`[ServerDB] Admin SDK switched off (using authorized REST fallback): ${err.message || err}`);
  }
}

try {
  const apps = getApps();
  const adminApp = apps.length === 0
    ? initializeApp({ projectId: PROJECT_ID })
    : getApp();
  adminDb = getFirestore(adminApp, DB_ID);
  console.log(`[ServerDB] Firebase Admin SDK initialized successfully for database: ${DB_ID}`);
} catch (err: any) {
  console.warn('[ServerDB] Failed to initialize Firebase Admin SDK, using REST fallbacks:', err.message);
}

/**
 * Timeout wrapper helper to prevent Firebase Admin SDK from hanging indefinitely on credential resolution issues.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout of ${timeoutMs}ms exceeded`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Convert plain JS object to Firestore REST API format
 */
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'object' && item !== null) {
              return { mapValue: { fields: toFirestoreFields(item) } };
            }
            return { stringValue: String(item) };
          })
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

/**
 * Convert Firestore REST API fields to plain JS object
 */
function fromFirestoreFields(fields: Record<string, any> = {}): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [key, valObj] of Object.entries(fields)) {
    if ('stringValue' in valObj) obj[key] = valObj.stringValue;
    else if ('integerValue' in valObj) obj[key] = parseInt(valObj.integerValue, 10);
    else if ('doubleValue' in valObj) obj[key] = parseFloat(valObj.doubleValue);
    else if ('booleanValue' in valObj) obj[key] = valObj.booleanValue;
    else if ('nullValue' in valObj) obj[key] = null;
    else if ('arrayValue' in valObj) {
      obj[key] = (valObj.arrayValue.values || []).map((v: any) => {
        if ('mapValue' in v) return fromFirestoreFields(v.mapValue.fields);
        if ('stringValue' in v) return v.stringValue;
        if ('integerValue' in v) return parseInt(v.integerValue, 10);
        if ('booleanValue' in v) return v.booleanValue;
        return v;
      });
    } else if ('mapValue' in valObj) {
      obj[key] = fromFirestoreFields(valObj.mapValue.fields);
    }
  }
  return obj;
}

import fs from "node:fs";
import path from "node:path";

// In-memory server cache as fallback store
export const inMemoryServerCache = new Map<string, Map<string, any>>();

function getCacheFilePath(colName: string): string {
  return path.join(process.cwd(), 'server', `cache_${colName}.json`);
}

export function saveColToDisk(colName: string) {
  try {
    const colMap = getColMap(colName);
    const obj: Record<string, any> = {};
    for (const [id, val] of colMap.entries()) {
      obj[id] = val;
    }
    const filePath = getCacheFilePath(colName);
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[ServerDB] Failed to save cache for '${colName}' to disk:`, err);
  }
}

function getColMap(colName: string): Map<string, any> {
  if (!inMemoryServerCache.has(colName)) {
    const colMap = new Map<string, any>();
    inMemoryServerCache.set(colName, colMap);
    
    // Load from disk if file exists
    try {
      const filePath = getCacheFilePath(colName);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        for (const [id, val] of Object.entries(data)) {
          colMap.set(id, val);
        }
        console.log(`[ServerDB] Loaded cache for '${colName}' from disk (${colMap.size} documents)`);
      }
    } catch (err) {
      console.warn(`[ServerDB] Failed to load cache for '${colName}':`, err);
    }
  }
  return inMemoryServerCache.get(colName)!;
}

/**
 * Fetch a document by ID with Admin SDK, REST API, and in-memory store fallback
 */
export async function getServerDoc(colName: string, docId: string): Promise<any | null> {
  if (adminDb) {
    try {
      const snap = await withTimeout(adminDb.collection(colName).doc(docId).get(), 1500);
      if (snap.exists) {
        const doc = { ...snap.data(), id: snap.id };
        getColMap(colName).set(docId, doc);
        saveColToDisk(colName);
        return doc;
      }
      return null;
    } catch (adminErr: any) {
      handleAdminError(adminErr);
    }
  }

  // REST Fallback
  try {
    const res = await fetch(`${BASE_URL}/${colName}/${encodeURIComponent(docId)}?key=${API_KEY}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`REST returned status ${res.status}`);
    const data = await res.json();
    const doc = { ...fromFirestoreFields(data.fields), id: docId };
    getColMap(colName).set(docId, doc);
    saveColToDisk(colName);
    return doc;
  } catch (restErr: any) {
    const cached = getColMap(colName).get(docId);
    if (cached) return { ...cached, id: docId };
    return null;
  }
}

/**
 * Fetch all documents in a collection with Admin SDK, REST API, and in-memory store fallback
 */
export async function getServerDocs(colName: string): Promise<any[]> {
  if (adminDb) {
    try {
      const snap = await withTimeout(adminDb.collection(colName).get(), 1500);
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      const colMap = getColMap(colName);
      for (const d of docs) colMap.set(d.id, d);
      saveColToDisk(colName);
      return docs;
    } catch (adminErr: any) {
      handleAdminError(adminErr);
    }
  }

  // REST Fallback
  try {
    const res = await fetch(`${BASE_URL}/${colName}?key=${API_KEY}&pageSize=100`);
    if (!res.ok) throw new Error(`REST returned status ${res.status}`);
    const data = await res.json();
    if (!data.documents) {
      return Array.from(getColMap(colName).entries()).map(([id, val]) => ({ ...val, id }));
    }
    const docs = data.documents.map((d: any) => {
      const nameParts = d.name.split('/');
      const docId = nameParts[nameParts.length - 1];
      return { ...fromFirestoreFields(d.fields), id: docId };
    });
    const colMap = getColMap(colName);
    for (const d of docs) colMap.set(d.id, d);
    saveColToDisk(colName);
    return docs;
  } catch (restErr: any) {
    return Array.from(getColMap(colName).entries()).map(([id, val]) => ({ ...val, id }));
  }
}

/**
 * Set/Overwrite a document with Admin SDK, REST API, and in-memory store fallback
 */
export async function setServerDoc(colName: string, docId: string, data: Record<string, any>, merge: boolean = true): Promise<boolean> {
  const colMap = getColMap(colName);
  const existing = colMap.get(docId) || {};
  const updated = merge ? { ...existing, ...data, id: docId } : { ...data, id: docId };
  colMap.set(docId, updated);
  saveColToDisk(colName);

  if (adminDb) {
    try {
      await withTimeout(adminDb.collection(colName).doc(docId).set(data, { merge }), 1500);
      return true;
    } catch (adminErr: any) {
      handleAdminError(adminErr);
    }
  }

  // REST Fallback
  try {
    const fields = toFirestoreFields(data);
    const updateMask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const url = merge
      ? `${BASE_URL}/${colName}/${encodeURIComponent(docId)}?key=${API_KEY}&${updateMask}`
      : `${BASE_URL}/${colName}/${encodeURIComponent(docId)}?key=${API_KEY}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    return res.ok;
  } catch (restErr: any) {
    return true; // Gracefully updated in memory
  }
}

/**
 * Update document fields with Admin SDK and automatic REST fallback
 */
export async function updateServerDoc(colName: string, docId: string, data: Record<string, any>): Promise<boolean> {
  if (adminDb) {
    try {
      await withTimeout(adminDb.collection(colName).doc(docId).update(data), 2000);
      return true;
    } catch (adminErr: any) {
      handleAdminError(adminErr);
    }
  }
  return setServerDoc(colName, docId, data, true);
}

/**
 * Delete a document with Admin SDK and automatic REST fallback
 */
export async function deleteServerDoc(colName: string, docId: string): Promise<boolean> {
  const colMap = getColMap(colName);
  colMap.delete(docId);
  saveColToDisk(colName);

  if (adminDb) {
    try {
      await withTimeout(adminDb.collection(colName).doc(docId).delete(), 2000);
      return true;
    } catch (adminErr: any) {
      handleAdminError(adminErr);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/${colName}/${encodeURIComponent(docId)}?key=${API_KEY}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (restErr: any) {
    console.error(`[ServerDB] REST deleteDoc failed for ${colName}/${docId}:`, restErr.message || restErr);
    throw restErr;
  }
}

export const inMemorySupportChats = new Map<string, any>();

/**
 * Save support chat metadata and message in memory and Firestore
 */
export async function saveSupportChatDoc(data: {
  chatId: string;
  userId: string;
  userName: string;
  userEmail: string;
  query: string;
  lastMessage?: string;
  updatedAt?: number;
  status?: string;
}): Promise<void> {
  const now = data.updatedAt || Date.now();
  const existing = inMemorySupportChats.get(data.chatId) || await getServerDoc('support_chats', data.chatId) || { messages: [] };
  
  const userMessage = {
    id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
    sender: 'user',
    senderName: data.userName || 'User',
    text: data.query,
    timestamp: now
  };

  const currentMsgs = Array.isArray(existing.messages) ? [...existing.messages, userMessage] : [userMessage];

  const docData = {
    ...existing,
    chatId: data.chatId,
    userId: data.userId,
    userName: data.userName || existing.userName || 'User',
    userEmail: data.userEmail || existing.userEmail || 'Guest',
    messages: currentMsgs,
    lastMessage: data.query || data.lastMessage || 'Support Query',
    updatedAt: now,
    status: data.status || existing.status || 'active',
    lastUserActivity: now,
    unreadByAdmin: true,
    unreadByUser: false
  };

  inMemorySupportChats.set(data.chatId, docData);

  try {
    await setServerDoc('support_chats', data.chatId, docData, true);
  } catch (e: any) {
    console.warn(`[ServerDB] Firestore setDoc failed for support_chat/${data.chatId}, cached in-memory:`, e.message || e);
  }
}

/**
 * Get all support chats merging Firestore and in-memory store
 */
export async function getAllSupportChatDocs(): Promise<any[]> {
  const merged = new Map<string, any>();

  // 1. Add in-memory cached chats
  for (const [id, doc] of inMemorySupportChats.entries()) {
    merged.set(id, doc);
  }

  // 2. Fetch from Firestore
  try {
    const firestoreDocs = await getServerDocs('support_chats');
    for (const doc of firestoreDocs) {
      const docId = doc.chatId || doc.id;
      if (docId) {
        const existing = merged.get(docId);
        if (!existing || (doc.updatedAt && doc.updatedAt > (existing.updatedAt || 0))) {
          merged.set(docId, doc);
          inMemorySupportChats.set(docId, doc);
        }
      }
    }
  } catch (err: any) {
    console.warn("[ServerDB] Failed to fetch support chats from Firestore, using in-memory:", err.message);
  }

  return Array.from(merged.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/**
 * Push a message into support chat array with Admin SDK and automatic REST fallback
 */
export async function pushChatMessage(
  chatId: string,
  userId: string,
  message: { sender: string; senderName: string; text: string; id: string; timestamp: number }
): Promise<void> {
  const targetChatId = chatId;
  const targetUserId = userId.startsWith('user_') ? userId.replace('user_', '') : userId;

  // Update in-memory cache
  const existing = inMemorySupportChats.get(targetChatId) || await getServerDoc('support_chats', targetChatId) || { messages: [] };
  const currentMessages = Array.isArray(existing.messages) ? [...existing.messages] : [];
  currentMessages.push(message);

  const updatedDoc = {
    ...existing,
    chatId: targetChatId,
    userId: targetUserId || existing.userId || 'User',
    userName: existing.userName || 'User',
    userEmail: existing.userEmail || 'Guest',
    messages: currentMessages,
    lastMessage: message.text,
    updatedAt: Date.now(),
    unreadByUser: message.sender === 'admin',
    unreadByAdmin: message.sender === 'user'
  };
  inMemorySupportChats.set(targetChatId, updatedDoc);

  if (adminDb) {
    try {
      const chatRef = adminDb.collection('support_chats').doc(targetChatId);
      await withTimeout(chatRef.set({
        ...updatedDoc,
        messages: FieldValue.arrayUnion(message),
      }, { merge: true }), 1500);
      return;
    } catch (adminErr: any) {
      handleAdminError(adminErr);
    }
  }

  // REST fallback
  await setServerDoc('support_chats', targetChatId, updatedDoc, true);
}
