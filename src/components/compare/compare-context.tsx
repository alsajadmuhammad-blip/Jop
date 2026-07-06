"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Product } from "@/lib/types";

interface CompareContextType {
  selected: Product[];
  addProduct: (p: Product) => void;
  removeProduct: (id: string) => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
  canAdd: boolean;
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Product[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const addProduct = useCallback((p: Product) => {
    setSelected(prev => {
      if (prev.length >= 2 || prev.some(x => x.id === p.id)) return prev;
      return [...prev, p];
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setSelected(prev => prev.filter(p => p.id !== id));
    setIsSheetOpen(false);
  }, []);

  const clearAll = useCallback(() => {
    setSelected([]);
    setIsSheetOpen(false);
  }, []);

  const isSelected = useCallback(
    (id: string) => selected.some(p => p.id === id),
    [selected]
  );

  return (
    <CompareContext.Provider
      value={{
        selected,
        addProduct,
        removeProduct,
        clearAll,
        isSelected,
        canAdd: selected.length < 2,
        isSheetOpen,
        openSheet: () => setIsSheetOpen(true),
        closeSheet: () => setIsSheetOpen(false),
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

/** يعيد null عندما يُستخدم خارج CompareProvider — لا يرمي خطأ */
export function useCompare(): CompareContextType | null {
  return useContext(CompareContext);
}
