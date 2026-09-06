import React, { createContext, useContext, useState } from 'react';

type NavVisibilityContextValue = {
  hideTabBar: boolean;
  setHideTabBar: (hidden: boolean) => void;
};

const NavVisibilityContext = createContext<NavVisibilityContextValue | undefined>(undefined);

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [hideTabBar, setHideTabBar] = useState(false);
  return (
    <NavVisibilityContext.Provider value={{ hideTabBar, setHideTabBar }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  const ctx = useContext(NavVisibilityContext);
  if (!ctx) throw new Error('useNavVisibility must be used within a NavVisibilityProvider');
  return ctx;
}
