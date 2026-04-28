"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ViewerMusicPulseContextValue = {
  /** True when host reports background music is actively playing (viewer UI only). */
  musicPulseActive: boolean;
  setMusicPulseActive: (active: boolean) => void;
};

const ViewerMusicPulseContext = createContext<ViewerMusicPulseContextValue | null>(null);

export function ViewerMusicPulseProvider({ children }: { children: React.ReactNode }) {
  const [musicPulseActive, setMusicPulseActiveState] = useState(false);

  const setMusicPulseActive = useCallback((active: boolean) => {
    setMusicPulseActiveState((prev) => (prev === active ? prev : active));
  }, []);

  const value = useMemo(
    () => ({ musicPulseActive, setMusicPulseActive }),
    [musicPulseActive, setMusicPulseActive],
  );

  return (
    <ViewerMusicPulseContext.Provider value={value}>{children}</ViewerMusicPulseContext.Provider>
  );
}

export function useViewerMusicPulse() {
  const ctx = useContext(ViewerMusicPulseContext);
  if (!ctx) {
    throw new Error("useViewerMusicPulse must be used within ViewerMusicPulseProvider");
  }
  return ctx;
}
