import { Platform } from 'react-native';
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ──────────────────────────────────────────────────────────────────────────────
// SYSTEM SYNC  — storage-first, Supabase as async backup
//
// Why storage-first?
//   The admin is a mock user (admin-id-0000) with no real Supabase session.
//   Native APKs do not have localStorage, so we persist with AsyncStorage
//   and still mirror to Supabase when possible.
//
// Strategy:
//   READ  → app storage first, fall back to Supabase if app storage is empty
//   WRITE → always write app storage immediately + attempt Supabase in background
// ──────────────────────────────────────────────────────────────────────────────

const LS_KEYS = {
  moderators: '__sys_moderators__',
  requests:   '__sys_requests__',
  users:      '__sys_users__',
};

// ── Persistent storage helpers ────────────────────────────────────────────────
async function storageGet(key, defaultValue = []) {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    }
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

async function storageSet(key, value) {
  try {
    const serialized = JSON.stringify(value);
    if (Platform.OS === 'web') {
      localStorage.setItem(key, serialized);
      return;
    }
    await AsyncStorage.setItem(key, serialized);
  } catch (e) {
    console.warn('persistent storage write failed:', e);
  }
}

// ── Supabase helpers (best-effort, never throw) ───────────────────────────────
async function sbRead(title, defaultData = []) {
  try {
    const { data, error } = await supabase
      .from('propiedades')
      .select('descripcion')
      .eq('titulo', title)
      .limit(1);
    if (error || !data?.length) return null;
    return JSON.parse(data[0].descripcion);
  } catch {
    return null;
  }
}

async function sbWrite(title, payload) {
  try {
    const { data } = await supabase
      .from('propiedades')
      .select('id')
      .eq('titulo', title)
      .limit(1);

    const serialized = JSON.stringify(payload);

    if (data?.length) {
      await supabase
        .from('propiedades')
        .update({ descripcion: serialized })
        .eq('id', data[0].id);
    } else {
      await supabase.from('propiedades').insert({
        titulo: title,
        descripcion: serialized,
        precio: 0, recamaras: 0, banos: 0, m2: 0, cocheras: 0,
        tipo: 'Venta', ubicacion: 'System Settings',
        lat: '0', lng: '0', imagenes: [],
      });
    }
  } catch {
    // Silently ignore — localStorage already has the data
  }
}

// ── Generic read: localStorage → Supabase fallback ───────────────────────────
async function readSystem(lsKey, sbTitle, defaultData = []) {
  const cached = await storageGet(lsKey, null);
  if (cached !== null) return cached;

  // Cache miss → try Supabase, then populate persistent storage
  const fromSb = await sbRead(sbTitle, defaultData);
  const result = fromSb ?? defaultData;
  await storageSet(lsKey, result);
  return result;
}

// ── Generic write: localStorage immediately + Supabase in background ──────────
async function writeSystem(lsKey, sbTitle, payload) {
  await storageSet(lsKey, payload);
  // Fire-and-forget Supabase sync (don't await — never blocks UI)
  sbWrite(sbTitle, payload).catch(() => {});
}

// ── Moderators ────────────────────────────────────────────────────────────────
export async function fetchModerators() {
  return readSystem(LS_KEYS.moderators, '__system_moderators__', []);
}

export async function saveModerators(moderatorIds) {
  await writeSystem(LS_KEYS.moderators, '__system_moderators__', moderatorIds);
}

// ── Requests ──────────────────────────────────────────────────────────────────
export async function fetchRequests() {
  return readSystem(LS_KEYS.requests, '__system_requests__', []);
}

export async function saveRequests(requests) {
  await writeSystem(LS_KEYS.requests, '__system_requests__', requests);
}

export async function submitRequest(req) {
  const list = await fetchRequests();
  await saveRequests([req, ...list]);
}

export async function updateRequestStatus(reqId, status) {
  const list = await fetchRequests();
  await saveRequests(list.map(r => r.id === reqId ? { ...r, status } : r));
}

// ── User Registry ─────────────────────────────────────────────────────────────
export async function fetchUsers() {
  return readSystem(LS_KEYS.users, '__system_users__', []);
}

export async function saveUsers(users) {
  await writeSystem(LS_KEYS.users, '__system_users__', users);
}

export async function upsertUser(userRecord) {
  const list = await fetchUsers();
  const idx = list.findIndex(u => u.id === userRecord.id);
  const newList = idx >= 0
    ? list.map((u, i) => i === idx ? { ...u, ...userRecord } : u)
    : [userRecord, ...list];
  await saveUsers(newList);
}

// ── Force sync FROM Supabase → localStorage (admin can call this manually) ────
// Useful for importing data from another device/browser into this session.
export async function forceSyncFromSupabase() {
  const [mods, reqs, users] = await Promise.all([
    sbRead('__system_moderators__', []),
    sbRead('__system_requests__',   []),
    sbRead('__system_users__',      []),
  ]);
  if (mods  !== null) await storageSet(LS_KEYS.moderators, mods);
  if (reqs  !== null) await storageSet(LS_KEYS.requests,   reqs);
  if (users !== null) await storageSet(LS_KEYS.users,       users);
  return { mods: mods ?? [], reqs: reqs ?? [], users: users ?? [] };
}
