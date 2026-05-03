
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { StoreCard } from "@/components/store-card";
import { SearchIcon, X } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import type { Store, Product, User } from "@/lib/types";
import { supabase } from "@/services/supabase";
import { mapStoreRow } from '@/services/supabase-db';
import { ProductGrid } from "@/components/product-grid";
import { Input } from "@/components/ui/input";

function EmptyState() {
    return (
        <div className="text-center py-16 rounded-lg bg-background border-2 border-dashed">
            <SearchIcon className="mx-auto h-16 w-16 text-muted-foreground" strokeWidth={1} />
            <h2 className="mt-4 text-xl font-semibold">لم يتم العثور على نتائج</h2>
            <p className="mt-2 text-muted-foreground">
                حاول البحث باستخدام كلمات مختلفة أو تحقق من الإملاء.
            </p>
        </div>
    );
}

export default function SearchPageComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("query") || "";
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Automatically focus the input on page load
    inputRef.current?.focus();
    // جلب المستخدم الحالي من localStorage أو hook
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch all stores from Supabase and normalize them.
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('*');

        if (storesError) {
          throw storesError;
        }

        let stores = (storesData || []).map((row: any) => mapStoreRow(row));
        stores = stores.filter((store: Store) => store.isActive);

        // استثناء المطاعم
        stores = stores.filter((store: Store) => store.marketType !== 'restaurant');
        // إخفاء متاجر قطع الغيار عن الجميع ما عدا أصحاب محلات الهواتف
        if (!currentUser || currentUser.role !== 'store' || currentUser.storeId == null) {
          stores = stores.filter((store: Store) => store.marketType !== 'spare-parts');
        }
        setAllStores(stores);
        const activeStoreIds = new Set(stores.map((s: Store) => s.id));

        // Fetch all products and filter by active store ids
        const { data: productsData, error: productsError } = await supabase.from('products').select('*');
        if (productsError) throw productsError;

        const products = (productsData || [])
          .map((row: any) => ({ id: String(row.id), ...row } as Product))
          .filter((product: Product) => product.storeId && activeStoreIds.has(String(product.storeId)));

        setAllProducts(products);
      } catch (error: any) {
        console.error("Supabase Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [currentUser]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    const params = new URLSearchParams(searchParams);
    if (newSearchTerm) {
      params.set('query', newSearchTerm);
    } else {
      params.delete('query');
    }
    // Use replace to avoid adding to browser history for every keystroke
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete('query');
    router.replace(`/search?${params.toString()}`, { scroll: false });
    inputRef.current?.focus();
  };

  const { filteredStores, filteredProducts } = useMemo(() => {
    const lowerCaseQuery = searchTerm.toLowerCase().trim();

    if (!lowerCaseQuery) {
      // If no search term, return all data
      return { filteredStores: allStores, filteredProducts: allProducts };
    }

    const stores = allStores.filter((store) =>
      store.name.toLowerCase().includes(lowerCaseQuery)
    );

    const products = allProducts.filter((product) => {
      const nameMatches = product.name.toLowerCase().includes(lowerCaseQuery);
      const descriptionMatches =
        product.description?.toLowerCase().includes(lowerCaseQuery) || false;
      return nameMatches || descriptionMatches;
    });

    return { filteredStores: stores, filteredProducts: products };
  }, [searchTerm, allStores, allProducts]);

  const isSearching = searchTerm.trim() !== "";
  const hasResults = filteredStores.length > 0 || filteredProducts.length > 0;

  if (isLoading) {
      return <div className="container mx-auto p-8 text-center">جاري تحميل البيانات...</div>
  }

  return (
    <>
      <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-4">
            {isSearching ? `نتائج البحث عن: "${searchTerm}"` : 'البحث في مركزي'}
          </h1>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="ابحث عن متجر أو منتج..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-full border-2 border-border bg-muted/50 px-10 py-3 text-base focus:bg-background"
            />
             {searchTerm && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40">
                <X className="h-4 w-4 text-background" />
              </button>
            )}
          </div>
          {isSearching && (
            <p className="text-muted-foreground mt-2 text-sm">
                {`تم العثور على ${filteredStores.length} متجر و ${filteredProducts.length} منتج.`}
            </p>
          )}
      </div>

      {!hasResults && isSearching ? (
        <EmptyState />
      ) : (
        <div className="space-y-12">
           {!isSearching && (
             <h2 className="text-2xl font-bold font-headline mb-6">
                تصفح كل شيء
             </h2>
           )}

          {filteredStores.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold font-headline mb-6">
                {isSearching ? "المتاجر المطابقة" : "كل المتاجر"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </section>
          )}

          {filteredProducts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold font-headline mb-6">
                {isSearching ? "المنتجات المطابقة" : "كل المنتجات"}
              </h2>
              <ProductGrid products={filteredProducts} />
            </section>
          )}
        </div>
      )}
    </>
  );
}

    