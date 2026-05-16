
"use client";

import { createContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import type { CartItem, Product, Store } from "@/lib/types";
import { supabase } from "@/services/supabase";
import { parseBoolean } from "@/services/supabase-db";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalPrice: number;
  itemsByStore: [string, { storeName: string; whatsappNumber: string; items: CartItem[] }][];
}

export const CartContext = createContext<CartContextType | undefined>(undefined);


// Helper to fetch only the products currently in the cart from Supabase
async function getProductsByIds(productIds: string[]): Promise<Product[]> {
    if (productIds.length === 0) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

    if (error) {
        console.error('Failed to fetch products for cart', error);
        return [];
    }

    // Map DB fields (snake_case) to frontend types (camelCase)
    const products: Product[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        imageUrl: row.image_url || row.imageUrl,
        storeId: row.store_id || row.storeId,
        categoryId: row.category_id || row.categoryId,
    }));

    return products;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [cartStores, setCartStores] = useState<Pick<Store, 'id' | 'name' | 'whatsappNumber'>[]>([]);

  useEffect(() => {
    // Fetch all store info once for grouping cart items by store (from Supabase)
    const fetchStores = async () => {
        const { data, error } = await supabase
            .from('stores')
            .select('id, name, whatsapp_number, is_active');

        if (error) {
            console.error('Failed to fetch stores for cart grouping', error);
            return;
        }

        const stores = (data || [])
          .filter((row: any) => parseBoolean(row.is_active ?? row.isActive))
          .map((row: any) => ({
            id: row.id,
            name: row.name,
            whatsappNumber: row.whatsapp_number || row.whatsappNumber,
          }) as Pick<Store, 'id' | 'name' | 'whatsappNumber'>);

        setCartStores(stores);
    };
    
    fetchStores();
  }, []);

  useEffect(() => {
    // Initial hydration from localStorage
    const initializeCart = async () => {
        try {
            const storedCartRaw = localStorage.getItem("markazi_cart");
            if (storedCartRaw) {
                const parsedStoredCart: { productId: string; quantity: number }[] = JSON.parse(storedCartRaw);
                const productIds = parsedStoredCart.map(item => item.productId);
                
                const productsFromDb = await getProductsByIds(productIds);
                
                const hydratedCart: CartItem[] = [];
                parsedStoredCart.forEach(storedItem => {
                    const product = productsFromDb.find(p => p.id === storedItem.productId);
                    if (product) {
                        hydratedCart.push({ product, quantity: storedItem.quantity });
                    }
                });
                setItems(hydratedCart);
            }
        } catch (error) {
            console.error("Failed to parse or hydrate cart from localStorage", error);
            // If hydration fails, clear the corrupted cart data
            localStorage.removeItem("markazi_cart");
        }
        setIsInitialLoad(false);
    };
    
    initializeCart();
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      try {
        const storableCart = items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        }));
        localStorage.setItem("markazi_cart", JSON.stringify(storableCart));
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }
  }, [items, isInitialLoad]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      return;
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prevItems, { product, quantity: Math.min(quantity, product.stock) }];
    });
  }, []);

  const updateItemQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prevItems) => {
      const currentItem = prevItems.find((item) => item.product.id === productId);
      if (!currentItem) {
        return prevItems;
      }

      const boundedQuantity = Math.max(0, Math.min(quantity, currentItem.product.stock));
      if (boundedQuantity <= 0) {
        return prevItems.filter((item) => item.product.id !== productId);
      }
      return prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: boundedQuantity } : item
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalPrice = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const itemsByStore = useMemo(() => {
    const groupedItems: { [storeId: string]: { storeName: string; whatsappNumber: string; items: CartItem[] } } = {};

    items.forEach(cartItem => {
      const store = cartStores.find(s => s.id === cartItem.product.storeId);
      if (store) {
        if (!groupedItems[store.id]) {
          groupedItems[store.id] = {
            storeName: store.name,
            whatsappNumber: store.whatsappNumber || '',
            items: [],
          };
        }
        groupedItems[store.id].items.push(cartItem);
      }
    });

    return Object.entries(groupedItems);
  }, [items, cartStores]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        totalPrice,
        itemsByStore,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
