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
import { DEFAULT_LANG_CODE } from "../data/constants";

export interface Settings {
  /** Active translation languages, primary first. Minimum length 1. */
  langCodes: string[];
  arabicScale: number;
  translationScale: number;
  layoutMode: LayoutMode;
}

interface SettingsContextValue extends Settings {
  langCode: string;
  setLangCode: (lang: string) => void;
  toggleLangCode: (lang: string) => void;
  setArabicScale: (scale: number) => void;
  setTranslationScale: (scale: number) => void;
  setLayoutMode: (mode: LayoutMode) => void;
}

const STORAGE_KEY = "al_muhaddith_settings";

const DEFAULT_SETTINGS: Settings = {
  langCodes: [DEFAULT_LANG_CODE],
  arabicScale: 1,
  translationScale: 1,
  layoutMode: "stacked",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitizeLangCodes(codes: unknown): string[] {
  if (!Array.isArray(codes)) return [DEFAULT_LANG_CODE];
  const clean = codes.filter(
    (c): c is string => typeof c === "string" && /^[a-z]{3}$/.test(c),
  );
  if (clean.length === 0) return [DEFAULT_LANG_CODE];
  return [...new Set(clean)];
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        langCodes: sanitizeLangCodes(parsed.langCodes),
      };
    }
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

  const setLangCode = useCallback((langCode: string) => {
    setSettings((s) => {
      if (s.langCodes[0] === langCode) return s;
      // The chosen primary moves to the front; keep any other active languages.
      return { ...s, langCodes: [langCode, ...s.langCodes.filter((c) => c !== langCode)] };
    });
  }, []);

  const toggleLangCode = useCallback((langCode: string) => {
    setSettings((s) => {
      const has = s.langCodes.includes(langCode);
      if (has) {
        // Never allow removing the last active language.
        if (s.langCodes.length === 1) return s;
        return { ...s, langCodes: s.langCodes.filter((c) => c !== langCode) };
      }
      return { ...s, langCodes: [...s.langCodes, langCode] };
    });
  }, []);

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
      langCode: settings.langCodes[0] ?? DEFAULT_LANG_CODE,
      setLangCode,
      toggleLangCode,
      setArabicScale,
      setTranslationScale,
      setLayoutMode,
    }),
    [
      settings,
      setLangCode,
      toggleLangCode,
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
