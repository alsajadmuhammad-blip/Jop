"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/services/supabase";
import { HeroCarouselItem, Store as StoreType } from "@/lib/types";
import { mapStoreRow } from "@/services/supabase-db";

import { HeroCarousel } from "@/components/hero-carousel";
import { StoreCard } from "@/components/store-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Building2,
  Globe,
  Smartphone,
  ShoppingBag,
  Utensils,
  Shirt,
  Cpu,
  Dumbbell,
  BookOpen,
  Wrench,
  Sparkles,
  Store,
  LayoutGrid,
} from "lucide-react";

/* ─── أيقونات + ألوان الفئات ─── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "هواتف ذكية": Smartphone,
  "ملابس": Shirt,
  "أجهزة كهربائية": Cpu,
  "أدوات رياضية": Dumbbell,
  "كتب": BookOpen,
  "قطع غيار": Wrench,
  "مستحضرات عناية": Sparkles,
  "طعام": Utensils,
  "ملحقات": ShoppingBag,
};

const CATEGORY_BG: Record<string, string> = {
  "هواتف ذكية":        "bg-blue-50   text-blue-600",
  "ملابس":             "bg-pink-50   text-pink-600",
  "أجهزة كهربائية":   "bg-purple-50 text-purple-600",
  "أدوات رياضية":     "bg-green-50  text-green-600",
  "كتب":               "bg-amber-50  text-amber-600",
  "قطع غيار":         "bg-slate-100 text-slate-600",
  "مستحضرات عناية":   "bg-rose-50   text-rose-600",
  "طعام":              "bg-orange-50 text-orange-600",
  "ملحقات":            "bg-indigo-50 text-indigo-600",
};

const CATEGORY_ACTIVE: Record<string, string> = {
  "هواتف ذكية":        "bg-blue-500   text-white",
  "ملابس":             "bg-pink-500   text-white",
  "أجهزة كهربائية":   "bg-purple-500 text-white",
  "أدوات رياضية":     "bg-green-500  text-white",
  "كتب":               "bg-amber-500  text-white",
  "قطع غيار":         "bg-slate-600  text-white",
  "مستحضرات عناية":   "bg-rose-500   text-white",
  "طعام":              "bg-orange-500 text-white",
  "ملحقات":            "bg-indigo-500 text-white",
};

/* ─── شريط بحث ─── */
function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن متجر أو منتج..."
        className="w-full h-11 pr-11 pl-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-[background-color,border-color,box-shadow] duration-200"
      />
    </form>
  );
}

/* ─── فلتر نوع المتجر ─── */
type FilterType = "all" | "physical" | "online";
const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all",      label: "الكل"        },
  { key: "physical", label: "فعلية"       },
  { key: "online",   label: "إلكترونية"  },
];

/* ══════════════════════════════════════
   الصفحة الرئيسية
══════════════════════════════════════ */
export default function Home() {
  const [heroItems,    setHeroItems]    = useState<HeroCarouselItem[]>([]);
  const [stores,       setStores]       = useState<StoreType[]>([]);
  const [marketTypes,  setMarketTypes]  = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filterType,   setFilterType]   = useState<FilterType>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [heroRes, storeRes] = await Promise.allSettled([
          supabase
            .from("hero_carousel_items")
            .select("id, src, hint, text, store_id")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("stores")
            .select("*")
            .eq("is_active", true)
            .order("rating", { ascending: false })
            .limit(40),
        ]);

        if (heroRes.status === "fulfilled") {
          const { data, error } = heroRes.value;
          if (!error && data)
            setHeroItems(
              data.map((row: any) => ({
                id: String(row.id),
                src: row.src,
                hint: row.hint,
                text: row.text,
                storeId: row.store_id || undefined,
              }))
            );
        }

        if (storeRes.status === "fulfilled") {
          const { data, error } = storeRes.value;
          if (!error && data) {
            const active = data
              .map((row: any) => mapStoreRow(row))
              .filter((s: StoreType) => s.isActive);
            setStores(active);
            const types = [
              ...new Set(active.map((s: StoreType) => s.marketType).filter(Boolean)),
            ] as string[];
            setMarketTypes(types);
          }
        }
      } catch (e) {
        console.error("Homepage fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredStores = stores.filter((s) => {
    const typeMatch =
      filterType === "all" ||
      (filterType === "physical" && s.type === "فعلي") ||
      (filterType === "online"   && s.type === "إلكتروني");
    const catMatch = activeCategory === "all" || s.marketType === activeCategory;
    return typeMatch && catMatch;
  });

  /* عدد المتاجر لكل فئة */
  const countByType = (type: string) =>
    stores.filter((s) => s.marketType === type).length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">

      {/* ── شريط بحث ثابت ── */}
      <div style={{ top: 'var(--header-h, 56px)' }} className="sticky z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-2.5">
        <SearchBar />
      </div>

      <div className="container mx-auto px-4 max-w-5xl">

        {/* ═══════════════════════════════
            البانر الإعلاني
        ═══════════════════════════════ */}
        <section className="pt-5 pb-5">
          {loading ? (
            <Skeleton className="w-full aspect-[16/7] rounded-2xl" />
          ) : (
            <HeroCarousel heroCarouselItems={heroItems} />
          )}
        </section>

        {/* ═══════════════════════════════
            الأقسام — بطاقات بصرية
        ═══════════════════════════════ */}
        {(loading || marketTypes.length > 0) && (
          <section className="pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                تصفح الأقسام
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
                {/* بطاقة الكل */}
                <button
                  onClick={() => { setActiveCategory("all"); setFilterType("all"); }}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-[transform,background-color,box-shadow] duration-200 shadow-sm ${
                    activeCategory === "all"
                      ? "bg-primary text-white shadow-primary/25 scale-95"
                      : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-primary/5 border border-slate-100 dark:border-slate-700"
                  }`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <span className={`text-[11px] font-semibold leading-tight text-center ${
                    activeCategory === "all" ? "text-primary" : "text-slate-500 dark:text-slate-400"
                  }`}>
                    الكل
                  </span>
                </button>

                {/* بطاقات الأقسام */}
                {marketTypes.map((type) => {
                  const Icon = CATEGORY_ICONS[type] ?? ShoppingBag;
                  const isActive = activeCategory === type;
                  const idleClass   = CATEGORY_BG[type]     ?? "bg-slate-50 text-slate-500";
                  const activeClass = CATEGORY_ACTIVE[type] ?? "bg-primary text-white";
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setActiveCategory(isActive ? "all" : type);
                        setFilterType("all");
                      }}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-[transform,background-color,box-shadow] duration-200 shadow-sm ${
                        isActive
                          ? `${activeClass} scale-95`
                          : `${idleClass} hover:scale-95 border border-white dark:border-slate-700`
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[11px] font-semibold leading-tight text-center line-clamp-1 w-full ${
                        isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                      }`}>
                        {type}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════
            بنر إنشاء متجر
        ═══════════════════════════════ */}
        <section className="pb-6">
          <Link href="/create-store">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-primary/75 p-5 flex items-center justify-between gap-4 shadow-md shadow-primary/20 cursor-pointer"
            >
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div className="relative z-10">
                <p className="text-white/75 text-xs font-medium mb-0.5">ابدأ رحلتك الرقمية</p>
                <p className="text-white text-base font-black">أنشئ متجرك الآن</p>
              </div>
              <div className="relative z-10 w-12 h-12 rounded-xl bg-white/15 flex-shrink-0 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
            </motion.div>
          </Link>
        </section>

        {/* ═══════════════════════════════
            جميع المتاجر
        ═══════════════════════════════ */}
        <section className="pb-12">
          {/* رأس + فلاتر */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {activeCategory === "all" ? "جميع المتاجر" : `متاجر ${activeCategory}`}
              {!loading && (
                <span className="mr-1.5 text-xs font-normal text-slate-400">
                  ({filteredStores.length})
                </span>
              )}
            </h2>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-[background-color,color,border-color] duration-200 ${
                    filterType === f.key
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                      : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* الشبكة */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          ) : filteredStores.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filterType}-${activeCategory}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {filteredStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700">
              <Store className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-400 text-sm font-medium">لا توجد متاجر في هذه الفئة</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
