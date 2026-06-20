"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/services/supabase";
import { HeroCarouselItem, Store as StoreType } from "@/lib/types";
import { mapStoreRow } from "@/services/supabase-db";

import { HeroCarousel } from "@/components/hero-carousel";
import { StoreCard } from "@/components/store-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Store,
  ShoppingBag,
  Star,
  Zap,
  Globe,
  Building2,
  TrendingUp,
  Shield,
  LayoutGrid,
  Sparkles,
} from "lucide-react";

/* ─── مكوّن الظهور عند السكرول ─── */
function FadeInSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── عداد متحرك ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString("ar")}{suffix}</span>;
}

/* ─── بطاقة ميزة ─── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <FadeInSection delay={delay}>
      <div className="group relative rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
        <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </FadeInSection>
  );
}

/* ─── الصفحة الرئيسية ─── */
export default function Home() {
  const [heroItems, setHeroItems] = useState<HeroCarouselItem[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "physical" | "online">("all");

  /* parallax للهيرو */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 80]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [heroRes, storeRes] = await Promise.allSettled([
          supabase
            .from("hero_carousel_items")
            .select("id, src, hint, text, store_id")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("stores")
            .select("*")
            .eq("is_active", true)
            .order("rating", { ascending: false })
            .limit(20),
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
          if (!error && data)
            setStores(
              data
                .map((row: any) => mapStoreRow(row))
                .filter((s: StoreType) => s.isActive)
            );
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
    if (filterType === "physical") return s.type === "فعلي";
    if (filterType === "online") return s.type === "إلكتروني";
    return true;
  });

  const stats = [
    { label: "متجر نشط", value: stores.length || 0, suffix: "+" },
    { label: "عملية بيع", value: 1200, suffix: "+" },
    { label: "تقييم عملاء", value: 4.8, suffix: "★" },
    { label: "فئة تجارية", value: 8, suffix: "+" },
  ];

  const features = [
    { icon: Zap, title: "إطلاق فوري", desc: "أنشئ متجرك وابدأ البيع في دقائق بدون تعقيدات تقنية." },
    { icon: LayoutGrid, title: "لوحة تحكم متكاملة", desc: "أدر منتجاتك وطلباتك واشتراكاتك من مكان واحد." },
    { icon: Globe, title: "متاجر أونلاين وفعلية", desc: "ندعم كلا النوعين مع خرائط موقع وساعات عمل." },
    { icon: Shield, title: "دفع آمن", desc: "بوابة دفع موثوقة مع حماية كاملة لمعلوماتك." },
    { icon: TrendingUp, title: "إحصائيات مباشرة", desc: "راقب أداء متجرك وعدد الزيارات والمبيعات لحظة بلحظة." },
    { icon: Star, title: "نظام تقييم", desc: "اجمع آراء عملائك وابنِ سمعتك رقمياً." },
  ];

  return (
    <div className="flex flex-col bg-white overflow-x-hidden">

      {/* ══════════════════════════════════════
          قسم الهيرو
      ══════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]">
        {/* خلفية زخرفية */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <motion.div style={{ y: heroY }} className="container mx-auto px-4 pt-10 pb-6 relative z-10">
          {/* شارة */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              منصة مركزي للمتاجر
            </span>
          </motion.div>

          {/* العنوان الرئيسي */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center max-w-3xl mx-auto mb-6"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-5">
              ابدأ متجرك
              <span className="block text-primary">الرقمي اليوم</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto">
              منصة متكاملة لإنشاء وإدارة متجرك الإلكتروني أو الفعلي — اختر باقتك وانطلق.
            </p>
          </motion.div>

          {/* أزرار CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-12"
          >
            <Link href="/create-store">
              <Button size="lg" className="h-12 px-8 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow gap-2">
                <Store className="w-5 h-5" />
                أنشئ متجرك الآن
              </Button>
            </Link>
            <Link href="/stores">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-2xl text-base font-semibold border-slate-200 gap-2">
                <ShoppingBag className="w-5 h-5" />
                تصفح المتاجر
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* الكاروسيل */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/8 to-transparent blur-2xl -z-10" />
            {loading ? (
              <Skeleton className="aspect-[16/7] w-full rounded-3xl" />
            ) : (
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-white/60">
                <HeroCarousel heroCarouselItems={heroItems} />
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          قسم الأرقام
      ══════════════════════════════════════ */}
      <section className="border-y border-slate-100 bg-slate-50/60 py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <FadeInSection key={stat.label} delay={i * 0.07}>
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-black text-slate-900 mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          قسم المتاجر
      ══════════════════════════════════════ */}
      {!loading && stores.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">المتاجر</p>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    تصفح المتاجر المتاحة
                  </h2>
                </div>

                {/* فلاتر */}
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { key: "all", label: "الكل", count: stores.length },
                      { key: "physical", label: "فعلية", count: stores.filter((s) => s.type === "فعلي").length },
                      { key: "online", label: "إلكترونية", count: stores.filter((s) => s.type === "إلكتروني").length },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterType(f.key)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                        filterType === f.key
                          ? "bg-primary text-white shadow-md shadow-primary/25"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.key === "physical" && <Building2 className="w-3.5 h-3.5" />}
                      {f.key === "online" && <Globe className="w-3.5 h-3.5" />}
                      {f.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        filterType === f.key ? "bg-white/20 text-white" : "bg-white text-slate-500"
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </FadeInSection>

            {filteredStores.length > 0 ? (
              <motion.div
                key={filterType}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {filteredStores.map((store, i) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                  >
                    <StoreCard store={store} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <FadeInSection>
                <div className="text-center py-16 rounded-3xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">لا توجد متاجر في هذه الفئة</p>
                </div>
              </FadeInSection>
            )}

            {stores.length > 8 && (
              <FadeInSection delay={0.1} className="text-center mt-10">
                <Link href="/stores">
                  <Button variant="outline" size="lg" className="rounded-2xl border-slate-200 gap-2 font-semibold">
                    عرض جميع المتاجر
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </FadeInSection>
            )}
          </div>
        </section>
      )}

      {/* Skeleton للتحميل */}
      {loading && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-3xl" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          قسم المميزات
      ══════════════════════════════════════ */}
      <section className="py-20 bg-slate-50/70">
        <div className="container mx-auto px-4">
          <FadeInSection className="text-center mb-14">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">لماذا مركزي؟</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              منصة متكاملة تجمع بين سهولة الإنشاء وقوة الإدارة ومرونة التوسع.
            </p>
          </FadeInSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA ختامي
      ══════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,hsl(var(--primary)/0.07),transparent)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <FadeInSection className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 mb-6">
              <Zap className="w-8 h-8 text-primary fill-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
              جاهز لتطوير تجارتك؟
            </h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              انضم لمئات المتاجر على منصة مركزي وابدأ رحلة نجاحك الرقمي.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/create-store">
                <Button size="lg" className="h-12 px-10 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow gap-2">
                  <Store className="w-5 h-5" />
                  أنشئ متجرك مجاناً
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-2xl text-base border-slate-200">
                  إنشاء حساب
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

    </div>
  );
}
