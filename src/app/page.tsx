
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, Star, MapPin, Package } from "lucide-react";
import { supabase } from "@/services/supabase";
import { HeroCarouselItem, Product, Store as StoreType } from "@/lib/types";
import { mapStoreRow } from '@/services/supabase-db';

import { Button } from "@/components/ui/button";
import { CategoryCarousel } from "@/components/category-carousel";
import { ProductGrid } from "@/components/product-grid";
import { HeroCarousel } from "@/components/hero-carousel";
import { categories as staticCategories } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function HomePageContent() {
  const [heroItems, setHeroItems] = useState<HeroCarouselItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getHomepageData() {
      setLoading(true);
      try {
        const [heroRes, prodRes, storeRes] = await Promise.allSettled([
          supabase
            .from('hero_carousel_items')
            .select('id, src, hint, text, store_id')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('products')
            .select('id, name, description, price, image_url, store_id, category_id')
            .eq('is_featured', true)
            .limit(12),
          supabase
            .from('stores')
            .select('id, name, description, logo_url, cover_image_url, rating, reviews, location, latitude, longitude, type, market_type, whatsapp_number, has_delivery, is_active')
            .order('rating', { ascending: false })
            .limit(8),
        ]);

        if (heroRes.status === 'fulfilled') {
          const { data, error } = heroRes.value;
          if (!error && data) {
            setHeroItems(
              (data || []).map((row: any) => ({
                id: String(row.id),
                src: row.src,
                hint: row.hint,
                text: row.text,
                storeId: row.store_id || undefined,
              }))
            );
          }
        } else {
          console.error('Hero items fetch error:', heroRes.reason);
        }

        if (prodRes.status === 'fulfilled') {
          const { data, error } = prodRes.value;
          if (!error && data) {
            setFeaturedProducts(
              (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                price: row.price,
                imageUrl: row.image_url || row.imageUrl,
                storeId: row.store_id,
                categoryId: row.category_id || row.categoryId,
                sku: row.sku || row.product_sku || undefined,
                stock: typeof row.stock === 'number' ? row.stock : Number(row.stock ?? 0),
              }))
            );
          }
        } else {
          console.error('Featured products fetch error:', prodRes.reason);
        }

        if (storeRes.status === 'fulfilled') {
          const { data, error } = storeRes.value;
          if (!error && data) {
            setStores(
              (data || [])
                .map((row: any) => mapStoreRow(row))
                .filter((store: StoreType) => store.isActive)
            );
          }
        } else {
          console.error('Featured stores fetch error:', storeRes.reason);
        }
      } catch (error) {
        console.error('Homepage data fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    getHomepageData();
  }, []);

  return (
    <div className="flex flex-col gap-0 bg-gradient-to-b from-background via-background to-background/50">
      {/* Hero Section - Modern and Clean */}
      <motion.section 
        className="relative overflow-hidden pt-6 pb-12 md:pt-12 md:pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
        <div className="container mx-auto px-4 relative z-10">
          {loading ? (
            <Skeleton className="aspect-[16/9] w-full rounded-3xl shadow-2xl" />
          ) : (
            <HeroCarousel heroCarouselItems={heroItems} />
          )}
        </div>
      </motion.section>

      {/* Categories Section */}
      <motion.section 
        className="py-16 bg-background border-b"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <motion.h2 
                className="text-3xl font-bold"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                تصفح الفئات
              </motion.h2>
              <motion.p 
                className="text-muted-foreground mt-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                اختر من بين مختلف الفئات والخدمات
              </motion.p>
            </div>
          </div>
          <CategoryCarousel categories={staticCategories} />
        </div>
      </motion.section>

      {/* CTA Section - Explore All Stores */}
      <motion.section 
        className="py-16 bg-gradient-to-r from-primary via-primary-light to-primary-dark text-white relative overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
          >
            اكتشف جميع المتاجر المتاحة
          </motion.h2>
          <motion.p 
            className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            viewport={{ once: true }}
          >
            تصفح المنتجات المتاحة من المتاجر المحلية.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Button 
              asChild 
              size="lg" 
              variant="secondary"
              className="group rounded-full shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-110 font-semibold text-lg px-8 py-4 bg-primary text-white hover:bg-primary/90"
            >
              <Link href="/stores" className="flex items-center gap-3">
                استكشف المتاجر
                <Rocket className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Products Section */}
      <motion.section 
        className="py-16 bg-gradient-to-b from-muted/20 to-background"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary-dark rounded-full"></div>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">🎯 المنتجات المميزة</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">المنتجات المميزة</h2>
              <p className="text-muted-foreground mt-2 text-lg">المنتجات المميزة المتاحة حالياً في النظام.</p>
            </motion.div>
          </div>
          {loading ? (
             <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="flex flex-col space-y-3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                        <Skeleton className="h-[160px] w-full rounded-2xl shadow-lg" />
                        <div className="space-y-3 p-4">
                            <Skeleton className="h-5 w-4/5 rounded" />
                            <Skeleton className="h-4 w-1/2 rounded" />
                        </div>
                    </motion.div>
                ))}
             </div>
          ) : featuredProducts.length > 0 ? (
            <ProductGrid products={featuredProducts} />
          ) : (
             <motion.div 
               className="text-center py-20 rounded-2xl border-2 border-dashed border-muted bg-muted/20"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5 }}
             >
               <Package className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
               <p className="text-muted-foreground text-xl font-medium">لا توجد منتجات مميزة حالياً</p>
               <p className="text-muted-foreground/70 mt-2">سنضيف المزيد قريباً</p>
             </motion.div>
          )}
        </div>
      </motion.section>

      {/* Featured Stores Section */}
      {stores.length > 0 && (
        <motion.section 
          className="py-16 bg-gradient-to-r from-background to-muted/30 border-b"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-primary bg-yellow-100 px-3 py-1 rounded-full">⭐ المتاجر المدرجة</span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">استعرض المتاجر المدرجة</h2>
                <p className="text-muted-foreground mt-2 text-lg">المتاجر المتاحة حالياً في النظام.</p>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stores.slice(0, 4).map((store: any, index: number) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Link href={`/store?id=${store.id}`}>
                    <Card className="hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      {store.logo_url && (
                        <div className="h-28 bg-gradient-to-br from-primary/20 via-blue-50 to-purple-50 overflow-hidden relative">
                          <img 
                            src={store.logo_url} 
                            alt={store.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-xl line-clamp-2 flex-1 group-hover:text-primary transition-colors">{store.name}</h3>
                            {store.rating && store.rating > 0 && (
                              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1.5 rounded-full flex-shrink-0 mr-2 shadow-sm">
                                <Star className="w-4 h-4 fill-white text-white" />
                                <span className="text-xs font-bold text-white">{Number(store.rating).toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {store.description || store.market_type || "متجر موثوق يقدم خدمات عالية الجودة"}
                          </p>
                          {store.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                              <span className="line-clamp-1">{store.location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}

export default function Home() {
  return <HomePageContent />;
}
