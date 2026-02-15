import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const ACCENT_KEY = 'app_accent_color';
export const DEFAULT_ACCENT = '#6366F1';
const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface AccentContextType {
  accent: string;
  setAccent: (color: string) => void;
}

const AccentContext = createContext<AccentContextType>({
  accent: DEFAULT_ACCENT,
  setAccent: () => {},
});

export const useAccent = () => useContext(AccentContext);

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ACCENT_KEY).then((stored) => {
      if (stored && HEX_REGEX.test(stored)) setAccentState(stored);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadFromProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          setUserId(session.user.id);
          await loadFromProfile(session.user.id);
        } else {
          setUserId(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadFromProfile = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('accent_color')
        .eq('id', uid)
        .maybeSingle();

      if (data?.accent_color && HEX_REGEX.test(data.accent_color)) {
        setAccentState(data.accent_color);
        AsyncStorage.setItem(ACCENT_KEY, data.accent_color);
      }
    } catch {
      // fall back to AsyncStorage value
    }
  };

  const setAccent = useCallback((color: string) => {
    if (!HEX_REGEX.test(color)) return;

    setAccentState(color);
    AsyncStorage.setItem(ACCENT_KEY, color);

    if (userId) {
      supabase
        .from('profiles')
        .update({ accent_color: color })
        .eq('id', userId)
        .then();
    }
  }, [userId]);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}
