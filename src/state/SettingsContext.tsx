import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LayoutMode } from "../types";

export interface Settings {
  langCode: string;
  arabicScale: number;
  translationScale: number;
  layoutMode: LayoutMode;
}

interface SettingsContextValue extends Settings {
  setLangCode: (lang: string) => void;
  setArabicScale: (scale: number) => void;
  setTranslationScale: (scale: number) => void;
  setLayoutMode: (mode: LayoutMode) => void;
}

const STORAGE_KEY = "al_muhaddith_settings";

const DEFAULT_SETTINGS: Settings = {
  langCode: "eng",
  arabicScale: 1,
  translationScale: 1,
  layoutMode: "stacked",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* corrupted storage, fall back to defaults */
  }
  return DEFAULT_SETTINGS;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    const root = document.documentElement;
    root.style.setProperty("--arabic-scale", String(settings.arabicScale));
    root.style
      .setProperty("--translation-scale", String(settings.translationScale));
    root.style.setProperty("--layout-mode", settings.layoutMode);
  }, [settings]);

  const setLangCode = useCallback(
    (langCode: string) => setSettings((s) => ({ ...s, langCode })),
    [],
  );
  const setArabicScale = useCallback(
    (arabicScale: number) => setSettings((s) => ({ ...s, arabicScale })),
    [],
  );
  const setTranslationScale = useCallback(
    (translationScale: number) =>
      setSettings((s) => ({ ...s, translationScale })),
    [],
  );
  const setLayoutMode = useCallback(
    (layoutMode: LayoutMode) => setSettings((s) => ({ ...s, layoutMode })),
    [],
  );

  const value = useMemo(
    () => ({
      ...settings,
      setLangCode,
      setArabicScale,
      setTranslationScale,
      setLayoutMode,
    }),
    [
      settings,
      setLangCode,
      setArabicScale,
      setTranslationScale,
      setLayoutMode,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
