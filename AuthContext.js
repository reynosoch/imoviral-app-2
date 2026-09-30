import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabaseClient';
import { fetchModerators, upsertUser } from './Componentes/systemSync';

WebBrowser.maybeCompleteAuthSession();

// Creación del contexto de autenticación
const AuthContext = createContext({});

// Helper: normalizes user data across providers (email/password, Google, etc.)
// Google stores name in 'name' or 'full_name', avatar in 'picture' or 'avatar_url'
function extractUserRecord(u) {
  const meta = u.user_metadata || {};
  const isVentas = u.email === 'ventas@inmoviral.com.mx';
  return {
    id: u.id,
    email: u.email || meta.email || '',
    full_name: meta.full_name || meta.name || meta.display_name || '',
    phone: meta.phone || meta.phone_number || '',
    avatar_url: meta.avatar_url || meta.picture || '',
    provider: u.app_metadata?.provider || 'email',
    registered_at: u.created_at || new Date().toISOString(),
    isAdmin: isVentas,
  };
}

function normalizeAuthUser(u) {
  if (!u) return null;
  const meta = u.user_metadata || {};
  const isVentas = u.email === 'ventas@inmoviral.com.mx';
  return {
    ...u,
    user_metadata: meta,
    app_metadata: u.app_metadata || {},
    isAdmin: isVentas,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSetUser = (u) => {
    setUser(normalizeAuthUser(u));
  };

  useEffect(() => {
    // 1. Validar si ya existe una sesión activa al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      handleSetUser(u);
      setLoading(false);
      if (u) {
        upsertUser(extractUserRecord(u)).catch(() => {});
      }
    });

    // 2. Escuchar en tiempo real cambios de estado (Login, Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      handleSetUser(u);
      setLoading(false);
      if (u) {
        upsertUser(extractUserRecord(u)).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkModerator() {
      if (user && !user.isAdmin) {
        try {
          const mods = await fetchModerators();
          const isMod = mods.includes(user.id);
          if (user.isModerator !== isMod) {
            setUser(prev => prev ? { ...prev, isModerator: isMod } : null);
          }
        } catch (e) {
          console.error("Error checking moderator status:", e);
        }
      }
    }
    checkModerator();
  }, [user]);

  // Función global para iniciar sesión
  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data?.user) {
      handleSetUser(result.data.user);
      upsertUser(extractUserRecord(result.data.user)).catch(() => {});
    }
    return result;
  };

  const signInWithGoogle = async () => {
    const redirectTo = Platform.OS === 'web'
      ? `${window.location.origin}/auth/callback`
      : AuthSession.makeRedirectUri({ scheme: 'imoviralapp2', path: 'auth/callback' });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) {
      return { data: null, error };
    }

    if (Platform.OS === 'web') {
      return { data, error: null };
    }

    if (!data?.url) {
      return { data: null, error: new Error('No se pudo abrir Google para iniciar sesión.') };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      return { data: null, error: new Error('Inicio con Google cancelado o incompleto.') };
    }

    let code = null;
    try {
      const url = new URL(result.url);
      code = url.searchParams.get('code');
    } catch (e) {
      // Fallback para esquemas personalizados en React Native (ej. imoviralapp2://)
      const match = result.url.match(/[?&]code=([^&#]+)/);
      if (match) {
        code = match[1];
      }
    }

    if (!code) {
      return { data: null, error: new Error('No se recibió código de autorización.') };
    }

    const exchange = await supabase.auth.exchangeCodeForSession(code);
    if (!exchange.error && exchange.data?.user) {
      handleSetUser(exchange.data.user);
      upsertUser(extractUserRecord(exchange.data.user)).catch(() => {});
    }
    return exchange;
  };

  const signOut = async () => {
    try {
      handleSetUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const updateUserMetadata = async (metadata) => {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });
    if (!error && data?.user) {
      handleSetUser(data.user);
    }
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signInWithGoogle, signOut, updateUserMetadata, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar la autenticación en cualquier pantalla
export const useAuth = () => useContext(AuthContext);