import { createSupabaseClient } from "./supabase-browser";

const SESSION_KEY = "tech_reports_auth_session";
const SESSION_EXPIRY_DAYS = 30;

interface StoredSession {
  token: string;
  username: string;
  isAdmin: boolean;
  expires: number;
}

export interface User {
  username: string;
  passwordHash: string;
  salt: string;
  isAdmin?: boolean;
}

function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession;
    if (s.expires < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function storeSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc("app_login", {
      p_username: username,
      p_password: password,
    });
    if (error || !data) {
      console.warn("[login] RPC error:", error?.message);
      return false;
    }
    const result = data as {
      ok: boolean;
      session_token?: string;
      username?: string;
      is_admin?: boolean;
      error?: string;
    };
    if (!result.ok) {
      console.warn("[login] Server error:", result.error);
      return false;
    }
    storeSession({
      token: result.session_token!,
      username: result.username!,
      isAdmin: !!result.is_admin,
      expires: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });
    return true;
  } catch (e) {
    console.error("[login] Fatal:", e);
    return false;
  }
}

export function logout(): void {
  const session = getStoredSession();
  if (session) {
    try {
      const supabase = createSupabaseClient();
      supabase.rpc("app_logout", { p_token: session.token }).catch(() => {});
    } catch {
      // ignore
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isLoggedIn(): boolean {
  return getStoredSession() !== null;
}

export function getCurrentUser(): string | null {
  return getStoredSession()?.username ?? null;
}

export function isAdmin(): boolean {
  return getStoredSession()?.isAdmin ?? false;
}

export async function listUsers(): Promise<Array<{ username: string; isAdmin: boolean }>> {
  const session = getStoredSession();
  if (!session) return [];
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc("app_list_users", { p_token: session.token });
    if (error || !data) {
      console.warn("[listUsers] error:", error?.message);
      return [];
    }
    const result = data as { ok: boolean; users?: Array<{ username: string; is_admin: boolean }>; error?: string };
    if (!result.ok) return [];
    return (result.users || []).map((u) => ({ username: u.username, isAdmin: u.is_admin }));
  } catch (e) {
    console.error("[listUsers] fatal:", e);
    return [];
  }
}

export async function addUser(username: string, password: string, isAdminUser: boolean = false): Promise<boolean> {
  const session = getStoredSession();
  if (!session) return false;
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc("app_upsert_user", {
      p_token: session.token,
      p_username: username,
      p_password: password,
      p_is_admin: isAdminUser,
    });
    if (error || !data) {
      console.warn("[addUser] error:", error?.message);
      return false;
    }
    return (data as { ok: boolean }).ok;
  } catch (e) {
    console.error("[addUser] fatal:", e);
    return false;
  }
}

export async function updatePassword(username: string, newPassword: string): Promise<boolean> {
  const session = getStoredSession();
  if (!session) return false;
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc("app_upsert_user", {
      p_token: session.token,
      p_username: username,
      p_password: newPassword,
      p_is_admin: isAdmin(),
    });
    if (error || !data) return false;
    return (data as { ok: boolean }).ok;
  } catch (e) {
    console.error("[updatePassword] fatal:", e);
    return false;
  }
}

export async function removeUser(username: string): Promise<boolean> {
  const session = getStoredSession();
  if (!session) return false;
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc("app_delete_user", {
      p_token: session.token,
      p_username: username,
    });
    if (error || !data) return false;
    return (data as { ok: boolean }).ok;
  } catch (e) {
    console.error("[removeUser] fatal:", e);
    return false;
  }
}

export async function initializeDefaultUsers(): Promise<void> {
  return;
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const saltToUse = salt || Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
  const msgBuffer = new TextEncoder().encode(password + saltToUse);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { hash, salt: saltToUse };
}
