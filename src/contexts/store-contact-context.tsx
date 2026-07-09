"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface StoreContactInfo {
  waHref?: string;
  mapsUrl?: string;
}

interface StoreContactContextType {
  contact: StoreContactInfo;
  setContact: (info: StoreContactInfo) => void;
  clearContact: () => void;
}

const StoreContactContext = createContext<StoreContactContextType>({
  contact: {},
  setContact: () => {},
  clearContact: () => {},
});

export function StoreContactProvider({ children }: { children: React.ReactNode }) {
  const [contact, setContactState] = useState<StoreContactInfo>({});
  const setContact  = useCallback((info: StoreContactInfo) => setContactState(info), []);
  const clearContact = useCallback(() => setContactState({}), []);
  return (
    <StoreContactContext.Provider value={{ contact, setContact, clearContact }}>
      {children}
    </StoreContactContext.Provider>
  );
}

export function useStoreContact() {
  return useContext(StoreContactContext);
}
